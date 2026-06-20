import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { providerService } from '../../services/provider.service';
import { providerApiService } from '../../services/provider-api.service';
import { ticketsService } from '../../services/tickets.service';
import { Shield, Activity } from 'lucide-react';

const toSafeNumber = (value: unknown, fallback = 0) => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const normalizeVulns = (vulnerabilities: any) => ({
    critical: toSafeNumber(vulnerabilities?.critical),
    high: toSafeNumber(vulnerabilities?.high),
    medium: toSafeNumber(vulnerabilities?.medium),
    low: toSafeNumber(vulnerabilities?.low)
});

const hasItems = (value: unknown) => Array.isArray(value) && value.length > 0;

const totalSeverityCount = (totals: { critical?: number; high?: number; medium?: number; low?: number }) => (
    toSafeNumber(totals?.critical)
    + toSafeNumber(totals?.high)
    + toSafeNumber(totals?.medium)
    + toSafeNumber(totals?.low)
);

const hasScannerTelemetry = (metrics: any) => (
    toSafeNumber(metrics?.scansCompleted) > 0
    || toSafeNumber(metrics?.hostsScanned) > 0
    || totalSeverityCount(normalizeVulns(metrics?.vulnerabilities)) > 0
    || hasItems(metrics?.scanDetails)
);

const hasWazuhTelemetry = (metrics: any) => (
    metrics?.configured !== false && (
        toSafeNumber(metrics?.activeAgents) > 0
        || totalSeverityCount(metrics?.alertsBySeverity) > 0
        || hasItems(metrics?.scanDetails)
        || hasItems(metrics?.recentFindings)
    )
);

const hasZabbixTelemetry = (metrics: any) => (
    metrics?.configured && (
        toSafeNumber(metrics?.summary?.hosts) > 0
        || toSafeNumber(metrics?.summary?.alerts) > 0
        || hasItems(metrics?.hosts)
        || hasItems(metrics?.alerts)
    )
);

const hasUptimeTelemetry = (metrics: any) => (
    toSafeNumber(metrics?.servicesMonitored) > 0
    || toSafeNumber(metrics?.servicesUp) > 0
    || toSafeNumber(metrics?.servicesDown) > 0
    || hasItems(metrics?.scanDetails)
);

export default function XSIAMCommandCenter() {
    const navigate = useNavigate();
    const [isCoreZooming, setIsCoreZooming] = useState(false);
    const coreButtonRef = useRef<HTMLButtonElement>(null);
    const [coreRect, setCoreRect] = useState<DOMRect | null>(null);
    const [metrics, setMetrics] = useState<any>({
        openvas: { active: false, count: 0 },
        insightvm: { active: false, count: 0 },
        wazuh: { active: false, count: 0 },
        zabbix: { active: false, count: 0 },
        total_vulns: 0,
        total_tickets: 0,
        automated_tickets: 0,
        manual_tickets: 0,
        total_resolved: 0,
        total_ingestion: 0,
        manual_breakdown: { crit: 0, high: 0, med: 0, low: 0 }
    });

    const [activeSources, setActiveSources] = useState<any[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 1200, height: 500 });

    useEffect(() => {
        const updateDims = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };
        window.addEventListener('resize', updateDims);
        updateDims();
        return () => window.removeEventListener('resize', updateDims);
    }, []);

    useEffect(() => {
        async function loadData() {
            try {
                const [summary, openvas, insightvm, wazuh, zabbix, nessus, uptime, allTickets] = await Promise.all([
                    providerApiService.getDashboardSummary().catch(() => null),
                    providerService.getOpenvasMetrics().catch(() => null),
                    providerService.getInsightvmMetrics().catch(() => null),
                    providerService.getWazuhMetrics().catch(() => null),
                    providerService.getZabbixFullMetrics({ preset: '7d' }).catch(() => null),
                    providerService.getNessusMetrics().catch(() => null),
                    providerService.getUptimeMetrics().catch(() => null),
                    ticketsService.getAll().catch(() => [])
                ]);

                const ovVulns = normalizeVulns(openvas?.vulnerabilities);
                const ivVulns = normalizeVulns(insightvm?.vulnerabilities);
                const nzVulns = normalizeVulns(nessus?.vulnerabilities);
                const wzVulns = normalizeVulns(wazuh?.alertsBySeverity);

                const totalVulns = totalSeverityCount(ovVulns)
                    + totalSeverityCount(ivVulns)
                    + totalSeverityCount(nzVulns)
                    + totalSeverityCount(wzVulns)
                    + toSafeNumber((zabbix as any)?.summary?.alerts)
                    + toSafeNumber(uptime?.servicesDown);

                const realTotalTickets = allTickets.length;
                const manualTickets = allTickets.filter(t => t.status !== 'EXECUTED').length;
                const autoTickets = allTickets.filter(t => t.status === 'EXECUTED').length;
                const totalTickets = realTotalTickets;
                const totalResolvedTickets = autoTickets;

                const isOpenvasActive = hasScannerTelemetry(openvas) || Boolean((summary as any)?.openvas?.configured);
                const isInsightvmActive = hasScannerTelemetry(insightvm) || Boolean((summary as any)?.insightvm?.configured);
                const isWazuhActive = hasWazuhTelemetry(wazuh) || Boolean(summary?.wazuh?.configured);
                const isZabbixActive = hasZabbixTelemetry(zabbix) || Boolean(summary?.zabbix?.configured);
                const isNessusActive = hasScannerTelemetry(nessus) || Boolean(summary?.nessus?.configured);
                const isUptimeActive = hasUptimeTelemetry(uptime) || Boolean(summary?.uptime_kuma?.configured);

                // Use real backend alerts count for event ingestion
                const totalIngestion = summary?.summary?.total_alerts || summary?.wazuh?.alerts?.total || 0;

                const manualBreakdown = {
                    crit: ovVulns.critical + ivVulns.critical + nzVulns.critical + wzVulns.critical,
                    high: ovVulns.high + ivVulns.high + nzVulns.high + wzVulns.high,
                    med: ovVulns.medium + ivVulns.medium + nzVulns.medium + wzVulns.medium,
                    low: ovVulns.low + ivVulns.low + nzVulns.low + wzVulns.low
                };

                setMetrics({
                    openvas: { active: isOpenvasActive, count: 0 },
                    insightvm: { active: isInsightvmActive, count: 0 },
                    wazuh: { active: isWazuhActive, count: 0 },
                    zabbix: { active: isZabbixActive, count: 0 },
                    total_vulns: totalVulns,
                    total_tickets: totalTickets,
                    automated_tickets: autoTickets,
                    manual_tickets: manualTickets,
                    total_resolved: totalResolvedTickets,
                    total_ingestion: totalIngestion,
                    manual_breakdown: manualBreakdown
                });

                // Build dynamic source list
                const sources = [];
                if (isOpenvasActive) {
                    sources.push({ id: 'openvas', label: 'OpenVAS', icon: './greenbone_openvass_logo.svg', type: 'image', active: true });
                }
                if (isInsightvmActive) {
                    sources.push({ id: 'insightvm', label: 'InsightVM', icon: './RPD.svg', type: 'image', active: true });
                }
                if (isWazuhActive) {
                    sources.push({ id: 'wazuh', label: 'Wazuh SIEM', icon: './wazuuu.svg', type: 'image', active: true });
                }
                if (isZabbixActive) {
                    sources.push({ id: 'zabbix', label: 'Zabbix', icon: './Zabbix_logo.svg', type: 'image', active: true });
                }
                if (isNessusActive) {
                    sources.push({ id: 'nessus', label: 'Nessus', icon: './tenablenesus.svg', type: 'image', active: true });
                }
                if (isUptimeActive) {
                    sources.push({ id: 'uptime', label: 'Uptime Kuma', icon: './uptime-kuma.svg', type: 'image', active: true });
                }

                if (sources.length === 0) {
                    sources.push({ id: 'openvas', label: 'OpenVAS', icon: './greenbone_openvass_logo.svg', type: 'image', active: false });
                    sources.push({ id: 'insightvm', label: 'InsightVM', icon: './RPD.svg', type: 'image', active: false });
                    sources.push({ id: 'wazuh', label: 'Wazuh SIEM', icon: './wazuuu.svg', type: 'image', active: false });
                    sources.push({ id: 'zabbix', label: 'Zabbix', icon: './Zabbix_logo.svg', type: 'image', active: false });
                    sources.push({ id: 'nessus', label: 'Nessus', icon: './tenablenesus.svg', type: 'image', active: false });
                    sources.push({ id: 'uptime', label: 'Uptime Kuma', icon: './uptime-kuma.svg', type: 'image', active: false });
                }

                setActiveSources(sources);

            } catch (e) {
                console.error(e);
            }
        }
        loadData();
    }, []);

    // Layout Calculations for SVG
    const CENTER_X = dimensions.width / 2;
    const CENTER_Y = dimensions.height / 2;

    return (
        <div ref={containerRef} className="relative w-full h-[500px] overflow-visible select-none">

            <div className="relative z-10 w-full h-full flex items-center justify-between px-4 lg:px-16 pointer-events-none">

                {/* LEFT: Integrations */}
                <div className="flex flex-col justify-center gap-6 z-20 pointer-events-auto" style={{ height: '100%' }}>
                    {activeSources.length > 0 && <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest absolute top-10 left-16">Integraciones</h3>}

                    <div className="flex flex-col gap-6 justify-center w-40">
                        {activeSources.map((source, idx) => (
                            <div key={idx} className="relative group flex items-center gap-3 h-10">
                                <div className="absolute right-[-24px] top-1/2 w-2 h-2 rounded-full bg-blue-500/50 group-hover:bg-blue-400 transition-colors transform -translate-y-1/2 z-20 shadow-[0_0_10px_#3b82f6]"></div>

                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${source.active ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 opacity-50'}`}>
                                    {source.type === 'image' ? (
                                        <img src={source.icon as string} className="w-6 h-6 rounded-full object-cover" alt={source.label} />
                                    ) : (
                                        <source.icon className={`w-5 h-5 ${source.color || 'text-gray-400'}`} />
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${source.active ? 'text-white' : 'text-gray-500'}`}>{source.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SVG CONNECTIONS LAYER */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                    <defs>
                        <linearGradient id="gradientFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                        </linearGradient>
                    </defs>

                    {/* Left to Center Connections */}
                    {activeSources.map((_, i) => {
                        const totalH = (activeSources.length * 40) + ((activeSources.length - 1) * 24);
                        const startY = CENTER_Y - (totalH / 2) + 20 + (i * 64);
                        const startX = 220;
                        const endX = CENTER_X - 80;

                        return (
                            <path
                                key={`path-in-${i}`}
                                d={`M ${startX} ${startY} C ${startX + 100} ${startY}, ${endX - 100} ${CENTER_Y}, ${endX} ${CENTER_Y}`}
                                stroke="url(#gradientFlow)"
                                fill="none"
                                strokeWidth="1.5"
                                className="opacity-60"
                            />
                        );
                    })}
                </svg>


                {/* CENTER: Processing Core (Absolutely Centered) */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-10 pointer-events-auto group">
                    {/* Metrics Floating around Core */}
                    <div className="absolute left-[-140px] text-right pointer-events-none">
                        <div className="text-3xl font-black text-white leading-none">{metrics.total_vulns}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Prevenciones</div>
                    </div>
                    <div className="absolute right-[-140px] text-left pointer-events-none">
                        <div className="text-3xl font-black text-white leading-none">{metrics.total_tickets}</div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Tickets Generados</div>
                    </div>

                    <div className="absolute w-[350px] h-[350px] border border-white/15 rounded-full animate-[spin_90s_linear_infinite] group-hover:animate-[spin_60s_linear_infinite] group-hover:border-neon-green/35 transition-colors duration-700 ease-out" />
                    <div className="absolute w-[280px] h-[280px] border-2 border-white/30 rounded-full border-dashed animate-[spin_70s_linear_infinite_reverse] group-hover:animate-[spin_40s_linear_infinite_reverse] shadow-[0_0_12px_rgba(255,255,255,0.18)] group-hover:border-neon-green/50 group-hover:shadow-[0_0_16px_rgba(0,255,157,0.25)] transition-colors transition-shadow duration-700 ease-out" />

                    <button
                        type="button"
                        onClick={() => {
                            if (isCoreZooming) return;
                            if (coreButtonRef.current) {
                                setCoreRect(coreButtonRef.current.getBoundingClientRect());
                            }
                            setIsCoreZooming(true);
                            window.setTimeout(() => navigate('/dashboard/xoc-core'), 720);
                        }}
                        disabled={isCoreZooming}
                        ref={coreButtonRef}
                        className={`relative w-36 h-36 bg-black/80 backdrop-blur-xl rounded-full border border-blue-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.2)] z-20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green/50 transition-transform transition-opacity duration-500 ease-out will-change-transform ${isCoreZooming ? 'scale-[1.6] opacity-0' : 'scale-100 opacity-100'}`}
                        aria-label="Ver detalle del núcleo XOC"
                    >
                        <div className="absolute inset-0 rounded-full bg-blue-500/5 animate-pulse"></div>
                        <img src="./Logo_XOC_Vectorial.svg" alt="XOC Core" className="w-20 h-20 object-contain" />
                        <div className="absolute top-0 right-8 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
                    </button>
                </div>

                {/* RIGHT: Outcomes (Automated vs Manual) */}
                <div className="absolute right-0 top-0 bottom-0 w-[45%] z-20 flex items-center pointer-events-none">
                    <div className="w-full h-full flex items-center justify-start relative pl-32">

                        {/* TIER 1: Processing Nodes */}
                        <div className="flex flex-col gap-24 relative z-10 pointer-events-auto">
                            {/* AUTOMATED (VICTOR) */}
                            <div id="node-automated" className="relative p-2.5 rounded-xl bg-gradient-to-l from-cyan-950/80 to-black/60 border border-cyan-500/40 backdrop-blur-md w-36 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all hover:scale-105 translate-y-[-30px]">
                                <div className="absolute left-[-5px] top-1/2 w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4] transform -translate-y-1/2"></div>
                                <div id="node-automated-out" className="absolute right-[-5px] top-1/2 w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4] transform -translate-y-1/2"></div>

                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <div className="text-xl font-black text-white leading-none">{metrics.automated_tickets}</div>
                                        <div className="text-[7.5px] text-cyan-400 font-bold uppercase tracking-widest mt-1 text-wrap leading-tight">VICTOR automatizado<br />en aprobacion</div>
                                    </div>
                                    <Activity className="w-4 h-4 text-cyan-500/50" />
                                </div>
                            </div>

                            {/* MANUAL (XOC TEAM) */}
                            <div id="node-manual" className="relative p-2.5 rounded-xl bg-gradient-to-l from-indigo-950/80 to-black/60 border border-indigo-500/40 backdrop-blur-md w-36 shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all hover:scale-105">
                                <div className="absolute left-[-5px] top-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1] transform -translate-y-1/2"></div>
                                <div id="node-manual-out" className="absolute right-[-5px] top-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1] transform -translate-y-1/2"></div>

                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-xl font-black text-white leading-none">{metrics.manual_tickets}</div>
                                        <div className="text-[7.5px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Revision XOC</div>
                                    </div>
                                    <Shield className="w-4 h-4 text-indigo-500/50" />
                                </div>
                            </div>
                        </div>

                        {/* TIER 2: Severity Branches */}
                        <div className="flex flex-col gap-6 relative z-10 pointer-events-auto ml-16 translate-y-[65px]">
                            {/* CRITICAL */}
                            <div className="relative flex items-center justify-between p-1.5 rounded bg-red-950/40 border border-red-500/30 w-36">
                                <div id="node-crit-in" className="absolute left-[-5px] top-1/2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] transform -translate-y-1/2"></div>
                                <div id="node-crit-out" className="absolute right-[-5px] top-1/2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] transform -translate-y-1/2"></div>
                                <span className="text-[8px] text-red-400 font-bold uppercase">CRIT</span>
                                <span className="text-sm font-bold text-white">{metrics.manual_breakdown.crit}</span>
                            </div>
                            {/* HIGH */}
                            <div className="relative flex items-center justify-between p-1.5 rounded bg-orange-950/40 border border-orange-500/30 w-36">
                                <div id="node-high-in" className="absolute left-[-5px] top-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_#f97316] transform -translate-y-1/2"></div>
                                <div id="node-high-out" className="absolute right-[-5px] top-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_#f97316] transform -translate-y-1/2"></div>
                                <span className="text-[8px] text-orange-400 font-bold uppercase">HIGH</span>
                                <span className="text-sm font-bold text-white">{metrics.manual_breakdown.high}</span>
                            </div>
                            {/* MEDIUM */}
                            <div className="relative flex items-center justify-between p-1.5 rounded bg-yellow-950/40 border border-yellow-500/30 w-36">
                                <div id="node-med-in" className="absolute left-[-5px] top-1/2 w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_8px_#eab308] transform -translate-y-1/2"></div>
                                <div id="node-med-out" className="absolute right-[-5px] top-1/2 w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_8px_#eab308] transform -translate-y-1/2"></div>
                                <span className="text-[8px] text-yellow-400 font-bold uppercase">MED</span>
                                <span className="text-sm font-bold text-white">{metrics.manual_breakdown.med}</span>
                            </div>
                            {/* LOW */}
                            <div className="relative flex items-center justify-between p-1.5 rounded bg-blue-950/40 border border-blue-500/30 w-36">
                                <div id="node-low-in" className="absolute left-[-5px] top-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6] transform -translate-y-1/2"></div>
                                <div id="node-low-out" className="absolute right-[-5px] top-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6] transform -translate-y-1/2"></div>
                                <span className="text-[8px] text-blue-400 font-bold uppercase">LOW</span>
                                <span className="text-sm font-bold text-white">{metrics.manual_breakdown.low}</span>
                            </div>
                        </div>

                        {/* TIER 3: Final Resolution */}
                        <div className="flex flex-col h-full justify-center gap-10 ml-20 relative z-10 pointer-events-auto">
                            {/* Resolved */}
                            <div className="relative p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 w-32 flex flex-col justify-center translate-y-[-20px]">
                                <div id="node-resolved-in" className="absolute left-[-5px] top-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] transform -translate-y-1/2"></div>
                                <div className="text-lg font-bold text-white leading-tight">{metrics.total_resolved}</div>
                                <div className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">Tickets Resueltos</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* DYNAMIC SVG LAYER */}
            <RightSideConnections dimensions={dimensions} activeSources={activeSources} updateTrigger={metrics} />

            <AnimatePresence>
                {isCoreZooming && coreRect && (
                    <motion.div
                        className="fixed inset-0 z-[60] pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            style={{
                                top: coreRect.top,
                                left: coreRect.left,
                                width: coreRect.width,
                                height: coreRect.height
                            }}
                            initial={{ scale: 1, opacity: 1 }}
                            animate={{ scale: 5.2, opacity: 0 }}
                            transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute bg-black/80 backdrop-blur-xl rounded-full border border-blue-500/30 flex items-center justify-center shadow-[0_0_120px_rgba(59,130,246,0.45)]"
                        >
                            <div className="absolute inset-0 rounded-full bg-blue-500/10" />
                            <img src="./Logo_XOC_Vectorial.svg" alt="XOC Core" className="w-20 h-20 object-contain" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOTTOM: KPI Footer */}
            <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-around px-16 opacity-80">
                <div className="flex flex-col text-left">
                    <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-1">Eventos / Ingesta (24h)</span>
                    <div className="flex items-end gap-3">
                        <span className="text-2xl font-black text-white leading-none">{metrics.total_ingestion.toLocaleString()}</span>
                        <div className="h-4 w-16 mb-1">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20">
                                <path d="M0 10 Q 25 20, 50 10 T 100 15" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col text-center">
                    <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-1">Resueltos</span>
                    <span className="text-2xl font-black text-emerald-500 leading-none">{metrics.total_resolved}</span>
                </div>

                <div className="flex flex-col text-right">
                    <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mb-1">Estado Operativo</span>
                    <div className="flex items-center justify-end gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                        <span className="text-white font-bold text-lg leading-none">100% ONLINE</span>
                    </div>
                </div>
            </div>
        </div >
    );
}

// Sub-component for calculating exact connection paths based on layout assumptions
function RightSideConnections({ dimensions, activeSources, updateTrigger }: { dimensions: { width: number, height: number }, activeSources: any[], updateTrigger: any }) {
    const [coords, setCoords] = useState<any>({});

    useEffect(() => {
        const calculateCoords = () => {
            const svgElement = document.getElementById('dashboard-svg-layer') || document.querySelector('svg.pointer-events-none:last-of-type');
            const svgArea = svgElement?.getBoundingClientRect();
            if (!svgArea) return;

            const getCenterCoords = (id: string, isRight: boolean = false) => {
                const el = document.getElementById(id);
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                return {
                    x: (isRight ? rect.right : rect.left) - svgArea.left,
                    y: (rect.top + rect.height / 2) - svgArea.top
                };
            };

            setCoords({
                autoOut: getCenterCoords('node-automated-out', true),
                autoIn: getCenterCoords('node-automated'),
                manOut: getCenterCoords('node-manual-out', true),
                manIn: getCenterCoords('node-manual'),
                resIn: getCenterCoords('node-resolved-in'),
                critIn: getCenterCoords('node-crit-in'),
                highIn: getCenterCoords('node-high-in'),
                medIn: getCenterCoords('node-med-in'),
                lowIn: getCenterCoords('node-low-in'),
                critOut: getCenterCoords('node-crit-out', true),
                highOut: getCenterCoords('node-high-out', true),
                medOut: getCenterCoords('node-med-out', true),
                lowOut: getCenterCoords('node-low-out', true),
            });
        };

        // Calculate immediately, and then poll a few times to ensure layout shifts are caught
        calculateCoords();
        let frameCount = 0;
        const interval = setInterval(() => {
            calculateCoords();
            frameCount++;
            if (frameCount > 10) clearInterval(interval); // Stop polling after ~1 second
        }, 100);

        return () => clearInterval(interval);
    }, [dimensions, activeSources, updateTrigger]);

    // Helper to generate perfect S-curves
    const getPath = (p1: any, p2: any, fbX1: number, fbY1: number, fbX2: number, fbY2: number) => {
        const x1 = p1 ? p1.x : fbX1;
        const y1 = p1 ? p1.y : fbY1;
        const x2 = p2 ? p2.x : fbX2;
        const y2 = p2 ? p2.y : fbY2;
        const dx = Math.abs(x2 - x1);
        const cpOffset = Math.max(20, dx * 0.5); // 50% distance for smooth S-curve
        return `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`;
    };


    const CENTER_X = dimensions.width / 2;
    const CENTER_Y = dimensions.height / 2;

    // Fallback constants just in case measuring fails
    const TIER_1_START_X = (dimensions.width * 0.55) + 128;
    const BOX_H = 70;
    const ROW_GAP = 48;
    const AUTO_Y_FB = CENTER_Y - (BOX_H / 2) - (ROW_GAP / 2) - 10;
    const MAN_Y_FB = CENTER_Y + (BOX_H / 2) + (ROW_GAP / 2) + 10;

    return (
        <svg id="dashboard-svg-layer" className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            {/* RIGHT SIDE CONNECTIONS */}

            {/* 1. Center -> Automated (Cyan) */}
            <path
                d={getPath({ x: CENTER_X + 80, y: CENTER_Y }, coords.autoIn, CENTER_X + 80, CENTER_Y, TIER_1_START_X, AUTO_Y_FB)}
                stroke="#06b6d4" fill="none" strokeWidth="2" className="opacity-60"
            />
            {/* Travelling Light */ coords.autoIn && <g><circle r="2" fill="#06b6d4" filter="drop-shadow(0 0 4px #06b6d4)"><animateMotion dur="2.5s" repeatCount="indefinite" path={getPath({ x: CENTER_X + 80, y: CENTER_Y }, coords.autoIn, CENTER_X + 80, CENTER_Y, TIER_1_START_X, AUTO_Y_FB)} /></circle></g>}

            {/* 2. Center -> Manual (Indigo) */}
            <path
                d={getPath({ x: CENTER_X + 80, y: CENTER_Y }, coords.manIn, CENTER_X + 80, CENTER_Y, TIER_1_START_X, MAN_Y_FB)}
                stroke="#6366f1" fill="none" strokeWidth="2" className="opacity-60"
            />
            {/* Travelling Light */ coords.manIn && <g><circle r="2" fill="#6366f1" filter="drop-shadow(0 0 4px #6366f1)"><animateMotion dur="3s" repeatCount="indefinite" path={getPath({ x: CENTER_X + 80, y: CENTER_Y }, coords.manIn, CENTER_X + 80, CENTER_Y, TIER_1_START_X, MAN_Y_FB)} /></circle></g>}

            {/* 3. Automated -> Resolved */}
            {coords.autoOut && coords.resIn && (
                <>
                    <path
                        d={getPath(coords.autoOut, coords.resIn, 0, 0, 0, 0)}
                        stroke="#10b981" fill="none" strokeWidth="2" className="opacity-50" strokeDasharray="3 4"
                    />
                    <g>
                        <circle r="2" fill="#10b981" filter="drop-shadow(0 0 4px #10b981)">
                            <animateMotion dur="1.5s" repeatCount="indefinite" path={getPath(coords.autoOut, coords.resIn, 0, 0, 0, 0)} />
                        </circle>
                    </g>
                </>
            )}

            {/* 4. Manual -> Severities */}
            {coords.manOut && [coords.critIn, coords.highIn, coords.medIn, coords.lowIn].map((destIn, idx) => {
                if (!destIn) return null;
                const colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];
                const pD = getPath(coords.manOut, destIn, 0, 0, 0, 0);
                return (
                    <g key={`branch-${idx}`}>
                        <path d={pD} stroke={colors[idx]} fill="none" strokeWidth="1.5" className="opacity-40" />
                        <circle r="1.5" fill={colors[idx]} filter={`drop-shadow(0 0 3px ${colors[idx]})`}>
                            <animateMotion dur={`${1.8 + idx * 0.2}s`} repeatCount="indefinite" path={pD} />
                        </circle>
                    </g>
                );
            })}

            {/* 5. Severities -> Resolved */}
            {coords.resIn && [coords.critOut, coords.highOut, coords.medOut, coords.lowOut].map((srcOut, idx) => {
                if (!srcOut) return null;
                const colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];
                const pD = getPath(srcOut, coords.resIn, 0, 0, 0, 0);
                return (
                    <g key={`res-branch-${idx}`}>
                        <path d={pD} stroke={colors[idx]} fill="none" strokeWidth="1.5" className="opacity-30" strokeDasharray="2 3" />
                        <circle r="1.5" fill={colors[idx]} filter={`drop-shadow(0 0 2px ${colors[idx]})`}>
                            <animateMotion dur={`${2 + idx * 0.3}s`} repeatCount="indefinite" path={pD} />
                        </circle>
                    </g>
                );
            })}

        </svg>
    );
}
