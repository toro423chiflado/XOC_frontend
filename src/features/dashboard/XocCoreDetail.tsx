import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { providerService } from '../../services/provider.service';
import { providerApiService } from '../../services/provider-api.service';
import { ticketsService } from '../../services/tickets.service';
import type { DashboardSummary, Ticket } from '../../types/api';
import { ClipboardList, GitBranch, Activity, CheckCircle2, ArrowLeft, ShieldAlert, Zap, AlertTriangle, XCircle } from 'lucide-react';

const toSafeNumber = (value: unknown, fallback = 0) => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const normalizeVulns = (vulnerabilities: any) => ({
    critical: toSafeNumber(vulnerabilities?.critical),
    high: toSafeNumber(vulnerabilities?.high),
    medium: toSafeNumber(vulnerabilities?.medium),
    low: toSafeNumber(vulnerabilities?.low),
    info: toSafeNumber(vulnerabilities?.info)
});


export default function XocCoreDetail() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isEntering, setIsEntering] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
    const [severityTotals, setSeverityTotals] = useState({ critical: 0, high: 0, medium: 0, low: 0, info: 0 });
    const [vulnSources, setVulnSources] = useState({
        openvas: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        insightvm: { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    });
    const [scanStats, setScanStats] = useState({ openvas: 0, insightvm: 0 });
    const [metrics, setMetrics] = useState({
        totalVulns: 0,
        totalTickets: 0,
        automatedTickets: 0,
        manualTickets: 0,
        totalResolved: 0,
        totalIngestion: 0
    });

    useEffect(() => {
        setIsEntering(true);
    }, []);

    useEffect(() => {
        async function load() {
            try {
                const [summary, openvas, insightvm, allTickets] = await Promise.all([
                    providerApiService.getDashboardSummary().catch(() => null),
                    providerService.getOpenvasMetrics().catch(() => null),
                    providerService.getInsightvmMetrics().catch(() => null),
                    ticketsService.getAll().catch(() => [])
                ]);

                const ovVulns = normalizeVulns(openvas?.vulnerabilities);
                const ivVulns = normalizeVulns(insightvm?.vulnerabilities);
                const summaryVulns = summary?.summary?.critical_vulnerabilities || 0;

                const totalVulns = summaryVulns > 0
                    ? summaryVulns + (ovVulns.high + ovVulns.medium + ovVulns.low) + (ivVulns.high + ivVulns.medium + ivVulns.low)
                    : (ovVulns.critical + ovVulns.high + ovVulns.medium + ovVulns.low) +
                    (ivVulns.critical + ivVulns.high + ivVulns.medium + ivVulns.low);

                const realTotalTickets = allTickets.length;
                const manualTickets = realTotalTickets > 0
                    ? allTickets.filter(t => t.status !== 'EXECUTED').length
                    : 0;
                const autoTickets = realTotalTickets > 0
                    ? allTickets.filter(t => t.status === 'EXECUTED').length
                    : 0;
                const totalResolvedTickets = realTotalTickets > 0
                    ? allTickets.filter(t => t.status === 'EXECUTED').length
                    : 0;
                const totalIngestion = summary?.summary?.total_alerts || summary?.wazuh?.alerts?.total || 0;

                setTickets(allTickets);
                setSummaryData(summary || null);
                setVulnSources({
                    openvas: ovVulns,
                    insightvm: ivVulns
                });
                setSeverityTotals({
                    critical: ovVulns.critical + ivVulns.critical,
                    high: ovVulns.high + ivVulns.high,
                    medium: ovVulns.medium + ivVulns.medium,
                    low: ovVulns.low + ivVulns.low,
                    info: ovVulns.info + ivVulns.info
                });
                setScanStats({
                    openvas: toSafeNumber(openvas?.scansCompleted),
                    insightvm: toSafeNumber(insightvm?.scansCompleted)
                });
                setMetrics({
                    totalVulns,
                    totalTickets: manualTickets + autoTickets,
                    automatedTickets: autoTickets,
                    manualTickets,
                    totalResolved: totalResolvedTickets,
                    totalIngestion: totalIngestion || (manualTickets + autoTickets) * 15
                });
            } catch (error) {
                console.error('Failed to load core detail', error);
            } finally {
                setIsLoading(false);
            }
        }

        load();
    }, []);

    const statusCounts = useMemo(() => {
        return tickets.reduce((acc, ticket) => {
            acc[ticket.status] = (acc[ticket.status] || 0) + 1;
            return acc;
        }, {
            PENDING: 0,
            DERIVED: 0,
            EXECUTED: 0,
            FAILED: 0
        } as Record<string, number>);
    }, [tickets]);

    const automationRate = useMemo(() => {
        if (!metrics.totalTickets) return 0;
        return Math.round((statusCounts.EXECUTED / metrics.totalTickets) * 100);
    }, [metrics.totalTickets, statusCounts.EXECUTED]);

    const manualRate = metrics.totalTickets ? Math.max(0, 100 - automationRate) : 0;
    const severityTotal = severityTotals.critical + severityTotals.high + severityTotals.medium + severityTotals.low;

    const flowSize = { width: 1000, height: 320 };
    const flowNodes = {
        tickets: { x: 120, y: 160 },
        automated: { x: 320, y: 80 },
        manual: { x: 320, y: 235 },
        crit: { x: 560, y: 80 },
        high: { x: 560, y: 130 },
        med: { x: 560, y: 180 },
        low: { x: 560, y: 230 },
        resolved: { x: 840, y: 160 }
    };
    const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;
    const nodeStyle = (node: { x: number; y: number }) => ({
        left: toPercent(node.x, flowSize.width),
        top: toPercent(node.y, flowSize.height)
    });
    const curvePath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
        const dx = (to.x - from.x) * 0.5;
        return `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;
    };

    const ticketVelocity = useMemo(() => {
        const days: Array<{ label: string; key: string; count: number }> = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const key = date.toISOString().slice(0, 10);
            const label = date.toLocaleDateString(undefined, { weekday: 'short' });
            days.push({ label, key, count: 0 });
        }

        const map = new Map(days.map(day => [day.key, day]));
        tickets.forEach(ticket => {
            const date = new Date(ticket.created_at);
            if (Number.isNaN(date.getTime())) return;
            const key = date.toISOString().slice(0, 10);
            const entry = map.get(key);
            if (entry) entry.count += 1;
        });

        return days;
    }, [tickets]);

    const maxVelocity = Math.max(1, ...ticketVelocity.map(day => day.count));

    const integrationInsights = useMemo(() => ([
        {
            label: 'OpenVAS',
            active: scanStats.openvas > 0,
            issues: vulnSources.openvas.critical + vulnSources.openvas.high,
            detail: `${vulnSources.openvas.critical} crit · ${vulnSources.openvas.high} high`,
            badge: scanStats.openvas > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
        },
        {
            label: 'InsightVM',
            active: scanStats.insightvm > 0,
            issues: vulnSources.insightvm.critical + vulnSources.insightvm.high,
            detail: `${vulnSources.insightvm.critical} crit · ${vulnSources.insightvm.high} high`,
            badge: scanStats.insightvm > 0 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
        },
        {
            label: 'Wazuh',
            active: Boolean(summaryData?.wazuh?.configured),
            issues: toSafeNumber(summaryData?.wazuh?.alerts?.total),
            detail: summaryData?.wazuh?.alerts?.total ? `${summaryData?.wazuh?.alerts?.total} alertas` : 'Sin alertas',
            badge: summaryData?.wazuh?.configured ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
        },
        {
            label: 'Zabbix',
            active: Boolean(summaryData?.zabbix?.configured),
            issues: toSafeNumber(summaryData?.zabbix?.alerts),
            detail: summaryData?.zabbix?.alerts ? `${summaryData?.zabbix?.alerts} alertas` : 'Sin alertas',
            badge: summaryData?.zabbix?.configured ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
        },
        {
            label: 'Nessus',
            active: Boolean(summaryData?.nessus?.configured),
            issues: toSafeNumber(summaryData?.nessus?.vulnerabilities?.critical) + toSafeNumber(summaryData?.nessus?.vulnerabilities?.high),
            detail: summaryData?.nessus?.vulnerabilities
                ? `${toSafeNumber(summaryData?.nessus?.vulnerabilities?.critical)} crit · ${toSafeNumber(summaryData?.nessus?.vulnerabilities?.high)} high`
                : 'Sin datos',
            badge: summaryData?.nessus?.configured ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
        },
        {
            label: 'Uptime Kuma',
            active: Boolean(summaryData?.uptime_kuma?.configured),
            issues: toSafeNumber(summaryData?.uptime_kuma?.services?.down),
            detail: summaryData?.uptime_kuma?.services
                ? `${summaryData?.uptime_kuma?.services?.down || 0} caidas`
                : 'Sin datos',
            badge: summaryData?.uptime_kuma?.configured ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500 border border-white/10'
        }
    ]), [scanStats, summaryData, vulnSources]);

    const formatNumber = (value: number) => (isLoading ? '—' : value.toLocaleString());

    return (
        <DashboardLayout>
            <div className={`space-y-10 transform-gpu transition-all duration-700 ease-out ${isEntering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver
                        </button>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Nucleo XOC</p>
                        <h2 className="text-3xl font-black text-white">Orquestacion del flujo operativo</h2>
                        <p className="text-sm text-gray-400 max-w-2xl">
                            Vista a detalle del flujo completo. Este tablero prioriza automatizacion, pendientes y
                            el impacto real de cada integracion.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-neon-green/20 bg-neon-green/5 px-4 py-3">
                        <div className="text-[10px] uppercase tracking-widest text-gray-500">Automatizacion</div>
                        <div className="text-2xl font-black text-white">{isLoading ? '—' : `${automationRate}%`}</div>
                        <div className="text-[11px] text-gray-500">
                            {isLoading ? 'Cargando...' : `${metrics.automatedTickets.toLocaleString()} ejecutados`}
                        </div>
                    </div>
                </div>

                <section className="grid items-center gap-8 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
                    <div className="relative w-full max-w-[360px] h-[360px]">
                        <div className="absolute inset-0 rounded-full border border-white/10" />
                        <div className="absolute inset-6 rounded-full border border-white/15 border-dashed" />
                        <div className="absolute inset-12 rounded-full border border-white/10" />
                        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,255,157,0.08),transparent_65%)]" />

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-40 h-40 rounded-full bg-black/80 border border-white/10 shadow-[0_0_40px_rgba(0,255,157,0.2)] flex flex-col items-center justify-center">
                                <img src="./Logo_XOC_Vectorial.svg" alt="XOC Core" className="w-20 h-20 object-contain" />
                                <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-white">XOC Core</div>
                                <div className="text-[9px] text-gray-500">Orquestacion</div>
                            </div>
                        </div>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                            <div className="text-[10px] uppercase tracking-widest text-gray-500">Ingesta 24h</div>
                            <div className="text-2xl font-black text-white">{formatNumber(metrics.totalIngestion)}</div>
                            <div className="text-[10px] text-gray-500">Eventos procesados</div>
                        </div>
                    </div>

                    <div className="relative w-full min-h-[320px] rounded-2xl border border-dark-border bg-dark-card/60 p-6 overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${flowSize.width} ${flowSize.height}`}>
                            <defs>
                                <linearGradient id="flow-green" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
                                </linearGradient>
                            </defs>
                            <path d={curvePath(flowNodes.tickets, flowNodes.automated)} stroke="#22d3ee" strokeWidth="2" fill="none" opacity="0.6" />
                            <path d={curvePath(flowNodes.tickets, flowNodes.manual)} stroke="#6366f1" strokeWidth="2" fill="none" opacity="0.6" />
                            <path d={curvePath(flowNodes.automated, flowNodes.resolved)} stroke="#10b981" strokeWidth="2" fill="none" opacity="0.6" strokeDasharray="4 4" />
                            {[flowNodes.crit, flowNodes.high, flowNodes.med, flowNodes.low].map((node, idx) => (
                                <path
                                    key={`manual-${idx}`}
                                    d={curvePath(flowNodes.manual, node)}
                                    stroke={['#ef4444', '#f97316', '#eab308', '#3b82f6'][idx]}
                                    strokeWidth="1.6"
                                    fill="none"
                                    opacity="0.6"
                                />
                            ))}
                            {[flowNodes.crit, flowNodes.high, flowNodes.med, flowNodes.low].map((node, idx) => (
                                <path
                                    key={`resolve-${idx}`}
                                    d={curvePath(node, flowNodes.resolved)}
                                    stroke={['#ef4444', '#f97316', '#eab308', '#3b82f6'][idx]}
                                    strokeWidth="1.2"
                                    fill="none"
                                    opacity="0.45"
                                    strokeDasharray="3 4"
                                />
                            ))}
                        </svg>

                        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={nodeStyle(flowNodes.tickets)}>
                            <div className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 min-w-[150px]">
                                <div className="text-[10px] uppercase tracking-widest text-gray-500">Tickets generados</div>
                                <div className="text-2xl font-black text-white">{formatNumber(metrics.totalTickets)}</div>
                            </div>
                        </div>

                        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={nodeStyle(flowNodes.automated)}>
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 min-w-[180px]">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-200">
                                    <Zap className="h-4 w-4" />
                                    Automated Victor
                                </div>
                                <div className="text-2xl font-black text-white">{formatNumber(metrics.automatedTickets)}</div>
                                <div className="text-[10px] text-emerald-200/70">Pdte. aprobacion</div>
                            </div>
                        </div>

                        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={nodeStyle(flowNodes.manual)}>
                            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 min-w-[180px]">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-indigo-200">
                                    <ShieldAlert className="h-4 w-4" />
                                    Manual XOC Team
                                </div>
                                <div className="text-2xl font-black text-white">{formatNumber(metrics.manualTickets)}</div>
                                <div className="text-[10px] text-indigo-200/70">Requiere validacion</div>
                            </div>
                        </div>

                        {[
                            { id: 'crit', label: 'CRIT', value: severityTotals.critical, color: 'border-red-500/30 text-red-300 bg-red-500/10' },
                            { id: 'high', label: 'HIGH', value: severityTotals.high, color: 'border-orange-500/30 text-orange-300 bg-orange-500/10' },
                            { id: 'med', label: 'MED', value: severityTotals.medium, color: 'border-yellow-500/30 text-yellow-200 bg-yellow-500/10' },
                            { id: 'low', label: 'LOW', value: severityTotals.low, color: 'border-blue-500/30 text-blue-300 bg-blue-500/10' }
                        ].map((item, idx) => (
                            <div
                                key={item.id}
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={nodeStyle([flowNodes.crit, flowNodes.high, flowNodes.med, flowNodes.low][idx])}
                            >
                                <div className={`rounded-lg border px-3 py-2 min-w-[90px] ${item.color}`}>
                                    <div className="text-[10px] font-black uppercase tracking-widest">{item.label}</div>
                                    <div className="text-lg font-bold text-white">{formatNumber(item.value)}</div>
                                </div>
                            </div>
                        ))}

                        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={nodeStyle(flowNodes.resolved)}>
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 min-w-[150px]">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-200">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Tickets resueltos
                                </div>
                                <div className="text-2xl font-black text-white">{formatNumber(metrics.totalResolved)}</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                    {[
                        { label: 'Total', value: metrics.totalTickets, icon: ClipboardList, tone: 'text-white', bg: 'bg-white/5 border-white/10' },
                        { label: 'Automatizados', value: statusCounts.EXECUTED, icon: Zap, tone: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30' },
                        { label: 'Manuales', value: metrics.manualTickets, icon: ShieldAlert, tone: 'text-indigo-300', bg: 'bg-indigo-500/10 border-indigo-500/30' },
                        { label: 'Pendientes', value: statusCounts.PENDING, icon: AlertTriangle, tone: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/30' },
                        { label: 'Derivados', value: statusCounts.DERIVED, icon: GitBranch, tone: 'text-blue-300', bg: 'bg-blue-500/10 border-blue-500/30' },
                        { label: 'Fallidos', value: statusCounts.FAILED, icon: XCircle, tone: 'text-red-300', bg: 'bg-red-500/10 border-red-500/30' }
                    ].map((card) => (
                        <div key={card.label} className={`rounded-2xl border p-4 ${card.bg}`}>
                            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-400">
                                <span>{card.label}</span>
                                <card.icon className={`h-4 w-4 ${card.tone}`} />
                            </div>
                            <div className="mt-3 text-2xl font-black text-white">{formatNumber(card.value)}</div>
                        </div>
                    ))}
                </section>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="space-y-6">
                        <section className="rounded-2xl border border-dark-border bg-dark-card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Balance automatizacion vs manual</h3>
                                    <p className="text-xs text-gray-500">Cobertura y pendiente de aprobacion.</p>
                                </div>
                                <ClipboardList className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>Automatizado</span>
                                    <span>{isLoading ? '—' : `${automationRate}%`}</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-black/40 overflow-hidden">
                                    <div className="h-full bg-neon-green" style={{ width: `${automationRate}%` }} />
                                </div>
                                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                                    <span>Manual</span>
                                    <span>{isLoading ? '—' : `${manualRate}%`}</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-black/40 overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${manualRate}%` }} />
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                        <div className="text-[10px] uppercase tracking-widest text-gray-500">Pendientes</div>
                                        <div className="mt-1 text-xl font-bold text-white">{formatNumber(statusCounts.PENDING)}</div>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                                        <div className="text-[10px] uppercase tracking-widest text-gray-500">Derivados</div>
                                        <div className="mt-1 text-xl font-bold text-white">{formatNumber(statusCounts.DERIVED)}</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-dark-border bg-dark-card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Riesgo por severidad</h3>
                                    <p className="text-xs text-gray-500">Inventario consolidado de vulnerabilidades.</p>
                                </div>
                                <ShieldAlert className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {[
                                    { label: 'Critico', value: severityTotals.critical, color: 'bg-red-500/15 text-red-400 border-red-500/30' },
                                    { label: 'Alto', value: severityTotals.high, color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
                                    { label: 'Medio', value: severityTotals.medium, color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
                                    { label: 'Bajo', value: severityTotals.low, color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' }
                                ].map((item) => (
                                    <div key={item.label} className={`rounded-xl border p-3 ${item.color}`}>
                                        <div className="text-[10px] uppercase tracking-widest">{item.label}</div>
                                        <div className="mt-2 text-2xl font-bold text-white">{formatNumber(item.value)}</div>
                                        <div className="text-[11px] text-white/60">
                                            {severityTotal ? Math.round((item.value / severityTotal) * 100) : 0}% del total
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-dark-border bg-dark-card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Velocidad de tickets</h3>
                                    <p className="text-xs text-gray-500">Ultimos 7 dias de actividad.</p>
                                </div>
                                <Activity className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="mt-6 flex items-end gap-3">
                                {ticketVelocity.map((day) => (
                                    <div key={day.key} className="flex flex-col items-center gap-2">
                                        <div className="text-[10px] text-gray-500">{day.count}</div>
                                        <div
                                            className="w-6 rounded-md bg-neon-green/30 border border-neon-green/30"
                                            style={{ height: `${Math.max(8, (day.count / maxVelocity) * 64)}px` }}
                                        />
                                        <div className="text-[10px] text-gray-500">{day.label}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="rounded-2xl border border-dark-border bg-dark-card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Integraciones y problemas</h3>
                                <p className="text-xs text-gray-500">Alertas y vulnerabilidades por conector.</p>
                            </div>
                            <GitBranch className="h-5 w-5 text-gray-500" />
                        </div>

                        <div className="mt-5 space-y-3">
                            {integrationInsights.map((item) => (
                                <div key={item.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
                                    <div>
                                        <div className="text-sm font-semibold text-white">{item.label}</div>
                                        <div className="text-[11px] text-gray-500">{item.detail}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-white">{formatNumber(item.issues)}</div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${item.badge}`}>
                                            {item.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </div>
        </DashboardLayout>
    );
}
