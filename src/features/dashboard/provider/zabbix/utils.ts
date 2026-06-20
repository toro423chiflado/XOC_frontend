import type { ZabbixFullMetrics } from '../../../../types/api';
import type { ZabbixDashboardModel, ZabbixHealthState, ZabbixSeverityDatum } from './types';

const toSafeNumber = (value: unknown, fallback = 0) => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
};

export const formatZabbixDate = (dateString?: string): string => {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '—';
    }
};

const formatShortDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
};

const toPriorityValue = (priority: string) => {
    const numeric = toSafeNumber(priority, NaN);
    if (Number.isFinite(numeric)) return numeric;
    const label = String(priority).toLowerCase();
    if (label.includes('crit') || label.includes('disaster')) return 5;
    if (label.includes('high') || label.includes('alta')) return 4;
    if (label.includes('med') || label.includes('average')) return 3;
    if (label.includes('low') || label.includes('baja') || label.includes('warning')) return 2;
    if (label.includes('info')) return 1;
    return 0;
};

export const getZabbixSeverityKey = (priority: string): ZabbixSeverityDatum['key'] => {
    const value = Math.max(0, Math.min(5, Math.floor(toPriorityValue(priority))));
    if (value >= 5) return 'critical';
    if (value >= 4) return 'high';
    if (value >= 3) return 'medium';
    if (value >= 2) return 'low';
    return 'info';
};

export const getZabbixSeverityLabel = (priority: string) => {
    const key = getZabbixSeverityKey(priority);
    return key === 'critical' ? 'Desastre' : key === 'high' ? 'Alta' : key === 'medium' ? 'Media' : key === 'low' ? 'Baja' : 'Info';
};

export const severityStyles: Record<ZabbixSeverityDatum['key'], string> = {
    critical: 'bg-red-600/90 text-white border-red-500',
    high: 'bg-orange-600/90 text-white border-orange-500',
    medium: 'bg-amber-600/90 text-white border-amber-500',
    low: 'bg-emerald-600/90 text-white border-emerald-500',
    info: 'bg-blue-600/90 text-white border-blue-500'
};

const severityMetaBase: ZabbixSeverityDatum[] = [
    { key: 'critical', label: 'Critico', value: 0, color: '#ef4444', textClass: 'text-red-400', softClass: 'border-red-500/20 bg-red-500/10', badgeClass: severityStyles.critical },
    { key: 'high', label: 'Alto', value: 0, color: '#f97316', textClass: 'text-orange-400', softClass: 'border-orange-500/20 bg-orange-500/10', badgeClass: severityStyles.high },
    { key: 'medium', label: 'Medio', value: 0, color: '#d97706', textClass: 'text-amber-400', softClass: 'border-amber-500/20 bg-amber-500/10', badgeClass: severityStyles.medium },
    { key: 'low', label: 'Bajo', value: 0, color: '#10b981', textClass: 'text-emerald-400', softClass: 'border-emerald-500/20 bg-emerald-500/10', badgeClass: severityStyles.low },
    { key: 'info', label: 'Info', value: 0, color: '#3b82f6', textClass: 'text-blue-400', softClass: 'border-blue-500/20 bg-blue-500/10', badgeClass: severityStyles.info }
];

const buildHealthState = (problemCount: number, eventCount: number, snapshotChanged: boolean, availabilityRate: number | null): ZabbixHealthState => {
    if (problemCount > 0) {
        return {
            label: 'Con incidentes',
            tone: 'critical',
            summary: 'Hay problemas activos en el snapshot actual y requieren atencion operativa.'
        };
    }

    if (eventCount > 0 || snapshotChanged || availabilityRate === null) {
        return {
            label: 'En observacion',
            tone: 'warning',
            summary: 'No hay problemas activos, pero el ultimo corte registra cambio o cobertura parcial de telemetria.'
        };
    }

    return {
        label: 'Estable',
        tone: 'stable',
        summary: 'El ultimo snapshot no reporta problemas ni eventos activos y la telemetria luce estable.'
    };
};

export const buildZabbixDashboardModel = (metrics: Exclude<ZabbixFullMetrics, { configured: false }>): ZabbixDashboardModel => {
    const totalHostsFromSummary = toSafeNumber(metrics.summary?.hosts);
    const totalHosts = Math.max(totalHostsFromSummary, metrics.hosts.length, toSafeNumber(metrics.snapshotMeta?.hostCount));
    const alertsActive = Math.max(toSafeNumber(metrics.summary?.alerts), metrics.alerts.length);
    const avgPerHostRaw = toSafeNumber(metrics.summary?.avgCpu ?? metrics.metrics?.cpu);
    const cvssValues = metrics.alerts.map((alert) => toSafeNumber(alert.cvss, NaN)).filter((value) => Number.isFinite(value));
    const avgCvssFromAlerts = cvssValues.length > 0 ? cvssValues.reduce((total, value) => total + value, 0) / cvssValues.length : 0;
    const avgCvssRaw = toSafeNumber(metrics.summary?.avgRam ?? metrics.metrics?.ram, NaN);
    const avgCvss = avgCvssRaw > 0 ? avgCvssRaw : (avgCvssFromAlerts || 0);
    const onlineHosts = metrics.hosts.filter((host) => host.status?.toLowerCase() === 'online').length;
    const offlineHosts = metrics.hosts.filter((host) => host.status?.toLowerCase() === 'offline').length;
    const detectedHosts = Math.max(totalHosts - onlineHosts - offlineHosts, 0);
    const hasAvailabilityData = onlineHosts + offlineHosts > 0;
    const availabilityRate = hasAvailabilityData && totalHosts > 0 ? Math.round((onlineHosts / totalHosts) * 100) : null;
    const avgAlertsPerHost = avgPerHostRaw > 0 ? avgPerHostRaw : (totalHosts > 0 ? alertsActive / totalHosts : 0);
    const coverageRate = totalHosts > 0 ? Math.round(((onlineHosts + offlineHosts) / totalHosts) * 100) : 0;
    const problemCount = toSafeNumber(metrics.snapshotMeta?.problemCount);
    const eventCount = toSafeNumber(metrics.snapshotMeta?.eventCount);
    const triggerCount = toSafeNumber(metrics.snapshotMeta?.triggerCount);
    const triggerDensity = totalHosts > 0 ? Number((triggerCount / totalHosts).toFixed(1)) : 0;
    const snapshotChanged = Boolean(metrics.snapshotMeta?.snapshotChanged);
    const healthState = buildHealthState(problemCount, eventCount, snapshotChanged, availabilityRate);

    const alertCounts = metrics.alerts.reduce(
        (acc, alert) => {
            const key = getZabbixSeverityKey(alert.priority);
            acc[key] += 1;
            return acc;
        },
        { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    );

    const severityDistribution = severityMetaBase.map((item) => ({ ...item, value: alertCounts[item.key] }));
    const dominantSeverity = [...severityDistribution].sort((a, b) => b.value - a.value)[0];
    const criticalPressure = alertsActive > 0 ? Math.round(((alertCounts.critical + alertCounts.high) / alertsActive) * 100) : 0;
    const availabilityIndicator = availabilityRate === null
        ? {
            label: 'Cobertura de estado',
            value: `${coverageRate}%`,
            helper: `Sin online/offline confiable. ${totalHosts} hosts visibles en el inventario actual.`
        }
        : {
            label: 'Disponibilidad',
            value: `${availabilityRate}%`,
            helper: `${onlineHosts} online de ${totalHosts} hosts visibles.`
        };

    const trendBase = (metrics.trendPoints && metrics.trendPoints.length > 0
        ? metrics.trendPoints
        : [{
            date: metrics.snapshotMeta?.scannedAt || metrics.agentInfo?.lastUsed || new Date().toISOString(),
            hosts: totalHosts,
            problems: problemCount,
            events: eventCount,
            triggers: triggerCount
        }]).map((item) => ({
        date: formatShortDate(String(item.date || '')),
        hosts: toSafeNumber(item.hosts),
        problems: toSafeNumber(item.problems),
        events: toSafeNumber(item.events),
        triggers: toSafeNumber(item.triggers)
    }));

    const dataFreshnessLabel = formatZabbixDate(metrics.snapshotMeta?.collectedAt || metrics.snapshotMeta?.scannedAt || metrics.agentInfo?.lastUsed);
    const sendReasonLabel = metrics.snapshotMeta?.sendReason || (snapshotChanged ? 'snapshot_changed' : 'telemetria_periodica');

    return {
        totalHosts,
        alertsActive,
        avgAlertsPerHost,
        avgCvss,
        onlineHosts,
        offlineHosts,
        availabilityRate,
        statusLabel: healthState.label,
        lastUsedLabel: formatZabbixDate(metrics.agentInfo?.lastUsed),
        severityDistribution,
        availabilityIndicator,
        hostStateDistribution: [
            { key: 'online', label: 'Online', value: onlineHosts, color: '#10b981' },
            { key: 'offline', label: 'Offline', value: offlineHosts, color: '#ef4444' },
            { key: 'detected', label: 'Detectados', value: detectedHosts, color: '#f59e0b' }
        ],
        summaryCards: [
            {
                title: 'Hosts monitoreados',
                value: `${totalHosts}`,
                subtitle: availabilityRate === null ? 'Cobertura visible sin estado online/offline consolidado.' : `${onlineHosts} online y ${offlineHosts} offline en el ultimo corte.`,
                accentClass: 'text-white',
                glowClass: 'from-red-500/12 via-transparent to-transparent'
            },
            {
                title: 'Problemas activos',
                value: `${problemCount}`,
                subtitle: problemCount > 0 ? 'Incidentes activos detectados en el snapshot actual.' : 'Sin problemas activos en el ultimo snapshot.',
                accentClass: problemCount > 0 ? 'text-red-400' : 'text-emerald-400',
                glowClass: 'from-orange-500/12 via-transparent to-transparent'
            },
            {
                title: 'Eventos activos',
                value: `${eventCount}`,
                subtitle: eventCount > 0 ? 'Actividad operativa abierta que requiere seguimiento.' : 'Sin eventos activos visibles en este corte.',
                accentClass: eventCount > 0 ? 'text-amber-400' : 'text-emerald-400',
                glowClass: 'from-emerald-500/12 via-transparent to-transparent'
            },
            {
                title: 'Triggers vigilados',
                value: `${triggerCount}`,
                subtitle: `${triggerDensity.toFixed(1)} triggers por host como densidad de monitoreo.`,
                accentClass: 'text-blue-400',
                glowClass: 'from-blue-500/12 via-transparent to-transparent'
            }
        ],
        hostRows: metrics.hosts.slice(0, 12).map((host) => {
            const statusValue = host.status?.toLowerCase() || '';
            const isOnline = statusValue === 'online';
            const isOffline = statusValue === 'offline';
            return {
                id: host.id,
                name: host.name,
                status: host.status,
                statusLabel: isOnline ? 'ONLINE' : isOffline ? 'OFFLINE' : 'DETECTADO',
                isOnline,
                isOffline,
                metaLabel: host.id && host.id !== host.name ? `ID: ${host.id}` : 'Detectado por analitica'
            };
        }),
        recentAlerts: [...metrics.alerts]
            .sort((a, b) => toPriorityValue(b.priority) - toPriorityValue(a.priority))
            .slice(0, 10)
            .map((alert) => ({
                id: alert.id,
                description: alert.description,
                host: alert.host,
                priority: alert.priority,
                severityKey: getZabbixSeverityKey(alert.priority),
                severityLabel: getZabbixSeverityLabel(alert.priority)
            })),
        dominantSeverity,
        criticalPressure,
        problemCount,
        eventCount,
        triggerCount,
        triggerDensity,
        healthState,
        trendData: trendBase,
        trendLabel: trendBase.length > 1 ? 'Serie historica de salud NOC' : 'Historial parcial del periodo',
        dataFreshnessLabel,
        snapshotFacts: [
            {
                label: 'Motivo del envio',
                value: sendReasonLabel,
                helper: snapshotChanged ? 'El colector detecto un cambio real en el snapshot.' : 'Envio periodico de telemetria.'
            },
            {
                label: 'Modo de snapshot',
                value: metrics.snapshotMeta?.snapshotMode || 'N/A',
                helper: metrics.snapshotMeta?.summaryType || 'noc_health'
            },
            {
                label: 'Versiones',
                value: `MAD ${metrics.snapshotMeta?.madVersion || 'N/A'}`,
                helper: `Integration ${metrics.snapshotMeta?.integrationVersion || 'N/A'} · Schema ${metrics.snapshotMeta?.schemaVersion || 'N/A'}`
            },
            {
                label: 'Fuente',
                value: metrics.snapshotMeta?.source || 'zabbix',
                helper: `Snapshot ${snapshotChanged ? 'con cambio' : 'estable'} al ${dataFreshnessLabel}`
            }
        ],
        snapshotChanged,
        sendReasonLabel
    };
};
