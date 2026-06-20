import { useState, useEffect } from 'react';
import { providerApiService } from '../../services/provider-api.service';
import { providerService } from '../../services/provider.service';
import type { DashboardSummary } from '../../types/api';
import { CheckCircle2, XCircle, Loader2, Settings, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const toSafeNumber = (value: unknown, fallback = 0) => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const hasItems = (value: unknown) => Array.isArray(value) && value.length > 0;

const sumSeverities = (vulnerabilities: any) => (
    toSafeNumber(vulnerabilities?.critical)
    + toSafeNumber(vulnerabilities?.high)
    + toSafeNumber(vulnerabilities?.medium)
    + toSafeNumber(vulnerabilities?.low)
    + toSafeNumber(vulnerabilities?.info)
);

const hasScannerTelemetry = (metrics: any) => (
    toSafeNumber(metrics?.scansCompleted) > 0
    || toSafeNumber(metrics?.hostsScanned) > 0
    || sumSeverities(metrics?.vulnerabilities) > 0
    || hasItems(metrics?.scanDetails)
);

const hasWazuhTelemetry = (metrics: any) => (
    metrics?.configured !== false && (
        toSafeNumber(metrics?.activeAgents) > 0
        || sumSeverities(metrics?.alertsBySeverity) > 0
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

type IntegrationSummarySlot = {
    label: string;
    value: number;
    danger?: boolean;
};

export default function IntegrationStatus() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [openvasMetrics, setOpenvasMetrics] = useState<any>(null);
    const [insightvmMetrics, setInsightvmMetrics] = useState<any>(null);
    const [wazuhMetrics, setWazuhMetrics] = useState<any>(null);
    const [zabbixMetrics, setZabbixMetrics] = useState<any>(null);
    const [nessusMetrics, setNessusMetrics] = useState<any>(null);
    const [uptimeMetrics, setUptimeMetrics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAllData = async () => {
            try {
                const [summaryData, openvasData, insightvmData, wazuhData, zabbixData, nessusData, uptimeData] = await Promise.all([
                    providerApiService.getDashboardSummary().catch(() => null),
                    providerService.getOpenvasCurrentState().catch(() => null),
                    providerService.getInsightvmCurrentState().catch(() => null),
                    providerService.getWazuhMetrics().catch(() => null),
                    providerService.getZabbixFullMetrics({ preset: '7d' }).catch(() => null),
                    providerService.getNessusMetrics().catch(() => null),
                    providerService.getUptimeMetrics().catch(() => null)
                ]);

                setSummary(summaryData);
                setOpenvasMetrics(openvasData);
                setInsightvmMetrics(insightvmData);
                setWazuhMetrics(wazuhData);
                setZabbixMetrics(zabbixData);
                setNessusMetrics(nessusData);
                setUptimeMetrics(uptimeData);
            } catch (error) {
                console.error('Failed to load dashboard integration data', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAllData();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-dark-card border border-dark-border rounded-xl p-6">
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
            </div>
        );
    }

    const checkStatus = (globalData: any, specificMetrics: any, hasTelemetry: boolean) => {
        if (hasTelemetry) {
            return { configured: true, metrics: specificMetrics };
        }
        if (globalData?.configured) {
            return { configured: true, metrics: null };
        }
        return { configured: false, metrics: null };
    };

    const isConfigured = (_providerId: string, fallback: boolean) => fallback;

    const openvasFallback = checkStatus((summary as any)?.openvas, openvasMetrics, hasScannerTelemetry(openvasMetrics)).configured;
    const insightvmFallback = checkStatus((summary as any)?.insightvm, insightvmMetrics, hasScannerTelemetry(insightvmMetrics)).configured;
    const wazuhFallback = checkStatus(summary?.wazuh, wazuhMetrics, hasWazuhTelemetry(wazuhMetrics)).configured;
    const zabbixFallback = checkStatus(summary?.zabbix, zabbixMetrics, hasZabbixTelemetry(zabbixMetrics)).configured;
    const nessusFallback = checkStatus(summary?.nessus, nessusMetrics, hasScannerTelemetry(nessusMetrics)).configured;
    const uptimeFallback = checkStatus(summary?.uptime_kuma, uptimeMetrics, hasUptimeTelemetry(uptimeMetrics)).configured;

    const normalizeMetrics = (
        scansCompleted: unknown,
        critical: unknown,
        high: unknown,
        medium: unknown,
        low: unknown,
        info: unknown = 0
    ) => ({
        scansCompleted: toSafeNumber(scansCompleted),
        vulnerabilities: {
            critical: toSafeNumber(critical),
            high: toSafeNumber(high),
            medium: toSafeNumber(medium),
            low: toSafeNumber(low),
            info: toSafeNumber(info)
        }
    });

    const wazuhSummaryMetrics = wazuhMetrics
        ? normalizeMetrics(
            wazuhMetrics?.scanDetails?.length ?? wazuhMetrics?.activeAgents,
            wazuhMetrics?.alertsBySeverity?.critical,
            wazuhMetrics?.alertsBySeverity?.high,
            wazuhMetrics?.alertsBySeverity?.medium,
            wazuhMetrics?.alertsBySeverity?.low
        )
        : null;

    const zabbixSummaryMetrics = zabbixMetrics?.configured
        ? (() => {
            const hostsList = Array.isArray(zabbixMetrics?.hosts) ? zabbixMetrics.hosts : [];
            const alertsList = Array.isArray(zabbixMetrics?.alerts) ? zabbixMetrics.alerts : [];
            const hostsTotal = Math.max(toSafeNumber(zabbixMetrics?.summary?.hosts), hostsList.length);
            const alertsActive = Math.max(toSafeNumber(zabbixMetrics?.summary?.alerts), alertsList.length);
            const onlineHosts = hostsList.filter((host: any) => String(host?.status || '').toLowerCase() === 'online').length;
            const offlineHosts = hostsList.filter((host: any) => String(host?.status || '').toLowerCase() === 'offline').length;
            const detectedHosts = Math.max(hostsTotal - onlineHosts - offlineHosts, 0);

            return {
                hostsTotal,
                alertsActive,
                onlineHosts,
                offlineHosts,
                detectedHosts
            };
        })()
        : null;

    const nessusSummaryMetrics = nessusMetrics
        ? normalizeMetrics(
            nessusMetrics?.scansCompleted,
            nessusMetrics?.vulnerabilities?.critical,
            nessusMetrics?.vulnerabilities?.high,
            nessusMetrics?.vulnerabilities?.medium,
            nessusMetrics?.vulnerabilities?.low,
            nessusMetrics?.vulnerabilities?.info
        )
        : null;

    const uptimeSummaryMetrics = uptimeMetrics
        ? normalizeMetrics(
            uptimeMetrics?.servicesMonitored,
            uptimeMetrics?.servicesDown,
            0,
            0,
            uptimeMetrics?.servicesUp
        )
        : null;

    const integrations = [
        {
            id: 'openvas',
            label: 'OpenVAS Scans',
            status: { configured: isConfigured('openvas', openvasFallback), metrics: openvasMetrics },
            icon: './greenbone_openvass_logo.svg'
        },
        {
            id: 'insightvm',
            label: 'InsightVM / Rapid7',
            status: { configured: isConfigured('insightvm', insightvmFallback), metrics: insightvmMetrics },
            icon: './RPD.svg'
        },
        { id: 'wazuh', label: 'Wazuh SIEM', status: { configured: isConfigured('wazuh', wazuhFallback), metrics: wazuhSummaryMetrics }, icon: './wazuuu.svg' },
        { id: 'zabbix', label: 'Zabbix Monitor', status: { configured: isConfigured('zabbix', zabbixFallback), metrics: zabbixSummaryMetrics }, icon: './Zabbix_logo.svg' },
        { id: 'nessus', label: 'Nessus Scans', status: { configured: isConfigured('nessus', nessusFallback), metrics: nessusSummaryMetrics }, icon: './tenablenesus.svg' },
        { id: 'uptime', label: 'Uptime Kuma', status: { configured: isConfigured('uptime', uptimeFallback), metrics: uptimeSummaryMetrics }, icon: './uptime-kuma.svg' }
    ];

    const getSummarySlots = (integrationId: string, rawMetrics: any): IntegrationSummarySlot[] | null => {
        if (!rawMetrics) return null;

        if (integrationId === 'openvas' || integrationId === 'insightvm' || integrationId === 'nessus') {
            const vulnTotal = Object.values(rawMetrics?.vulnerabilities || {})
                .reduce((acc: number, value) => acc + toSafeNumber(value), 0);
            return [
                { label: 'Escaneos', value: toSafeNumber(rawMetrics?.scansCompleted) },
                { label: 'Vulns', value: vulnTotal },
                { label: 'Criticas', value: toSafeNumber(rawMetrics?.vulnerabilities?.critical), danger: true }
            ];
        }

        if (integrationId === 'wazuh') {
            const critical = toSafeNumber(rawMetrics?.vulnerabilities?.critical);
            const high = toSafeNumber(rawMetrics?.vulnerabilities?.high);
            const medium = toSafeNumber(rawMetrics?.vulnerabilities?.medium);
            const low = toSafeNumber(rawMetrics?.vulnerabilities?.low);
            return [
                { label: 'Agentes', value: toSafeNumber(rawMetrics?.scansCompleted) },
                { label: 'Alertas', value: critical + high + medium + low },
                { label: 'Crit + High', value: critical + high, danger: true }
            ];
        }

        if (integrationId === 'zabbix') {
            const hosts = toSafeNumber(rawMetrics?.hostsTotal);
            const alerts = toSafeNumber(rawMetrics?.alertsActive);
            const online = toSafeNumber(rawMetrics?.onlineHosts);
            return [
                { label: 'Hosts', value: hosts },
                { label: 'Alertas', value: alerts, danger: true },
                { label: 'Online', value: online }
            ];
        }

        if (integrationId === 'uptime') {
            return [
                { label: 'Monitores', value: toSafeNumber(rawMetrics?.scansCompleted) },
                { label: 'Online', value: toSafeNumber(rawMetrics?.vulnerabilities?.low) },
                { label: 'Caidos', value: toSafeNumber(rawMetrics?.vulnerabilities?.critical), danger: true }
            ];
        }

        return null;
    };

    const totalActive = integrations.filter(i => i.status.configured).length;
    const totalRiskDetected =
        toSafeNumber(openvasMetrics?.vulnerabilities?.critical) +
        toSafeNumber(openvasMetrics?.vulnerabilities?.high) +
        toSafeNumber(insightvmMetrics?.vulnerabilities?.critical) +
        toSafeNumber(insightvmMetrics?.vulnerabilities?.high) +
        toSafeNumber(nessusMetrics?.vulnerabilities?.critical) +
        toSafeNumber(nessusMetrics?.vulnerabilities?.high) +
        toSafeNumber(wazuhMetrics?.alertsBySeverity?.critical) +
        toSafeNumber(wazuhMetrics?.alertsBySeverity?.high) +
        toSafeNumber(zabbixSummaryMetrics?.alertsActive) +
        toSafeNumber(uptimeMetrics?.servicesDown);

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Estado de Integraciones</h3>
                <Link to="/settings" className="text-gray-400 hover:text-emerald-500 transition-colors">
                    <Settings className="w-5 h-5" />
                </Link>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {integrations.map((item) => {
                    const summarySlots = getSummarySlots(item.id, item.status.metrics);

                    return (
                        <div
                            key={item.id}
                            className={`flex flex-col p-3 rounded-xl border transition-all ${item.status.configured
                                ? 'bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/20'
                                : 'bg-white/5 border-white/5 opacity-70 hover:opacity-100'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {item.icon ? (
                                        <img src={item.icon} alt={item.label} className="w-5 h-5 rounded-full object-cover" />
                                    ) : (
                                        <ShieldCheck className={`w-5 h-5 ${item.status.configured ? 'text-emerald-500' : 'text-gray-600'}`} />
                                    )}

                                    <div>
                                        <div className="text-sm font-bold text-gray-200">{item.label}</div>
                                        <div className="text-[10px] flex items-center gap-1.5">
                                            {item.status.configured ? (
                                                <>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    <span className="text-emerald-500 font-medium">Activo y Sincronizado</span>
                                                </>
                                            ) : (
                                                <span className="text-gray-500">Pendiente de configurar</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {item.status.configured ? (
                                    <Link
                                        to={`/dashboard/${item.id}`}
                                        className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg transition-colors"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <XCircle className="w-4 h-4 text-gray-600" />
                                )}
                            </div>

                            {item.status.configured && summarySlots && (
                                <div className="mt-3 grid grid-cols-3 gap-2 py-2 border-t border-emerald-500/10">
                                    {summarySlots.map((slot, index) => (
                                        <div key={`${item.id}-${slot.label}`} className={`text-center ${index > 0 ? 'border-l border-emerald-500/10' : ''}`}>
                                            <div className={`text-lg font-bold leading-none ${slot.danger ? 'text-red-500' : 'text-white'}`}>
                                                {slot.value}
                                            </div>
                                            <div className={`text-[9px] uppercase mt-1 ${slot.danger ? 'text-red-500/70' : 'text-gray-500'}`}>
                                                {slot.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-dark-border grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10 text-center">
                    <div className="text-2xl font-bold text-white">{totalActive}</div>
                    <div className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Integraciones Activas</div>
                </div>
                <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10 text-center">
                    <div className="text-2xl font-bold text-white">{totalRiskDetected}</div>
                    <div className="text-[10px] text-red-500 uppercase font-bold tracking-wider">Riesgo Detectado</div>
                </div>
            </div>
        </div>
    );
}
