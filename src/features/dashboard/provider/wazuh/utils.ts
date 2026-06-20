import type {
    WazuhMetrics,
    WazuhSeverityKey,
    WazuhSeverityTotals
} from '../../../../services/provider.service';
import type {
    WazuhDashboardModel,
    WazuhScanDetailModel,
    WazuhSeverityDatum,
    WazuhSnapshotListItem
} from './types';

export const formatWazuhDate = (dateString?: string | null) => {
    if (!dateString) return 'Sin registro';
    const asDate = new Date(dateString);
    if (Number.isNaN(asDate.getTime())) return dateString;
    return asDate.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatShortDay = (dateString: string) => {
    const asDate = new Date(dateString);
    if (Number.isNaN(asDate.getTime())) return dateString;
    return asDate.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
};

const formatShortDayTime = (dateString: string) => {
    const asDate = new Date(dateString);
    if (Number.isNaN(asDate.getTime())) return dateString;
    return asDate.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const severityConfig: Array<Omit<WazuhSeverityDatum, 'value'>> = [
    { key: 'critical', label: 'Critico', color: '#ef4444', textClass: 'text-red-400', softClass: 'border-red-500/20 bg-red-500/10' },
    { key: 'high', label: 'Alto', color: '#f97316', textClass: 'text-orange-400', softClass: 'border-orange-500/20 bg-orange-500/10' },
    { key: 'medium', label: 'Medio', color: '#f59e0b', textClass: 'text-amber-400', softClass: 'border-amber-500/20 bg-amber-500/10' },
    { key: 'low', label: 'Bajo', color: '#22c55e', textClass: 'text-emerald-400', softClass: 'border-emerald-500/20 bg-emerald-500/10' },
    { key: 'info', label: 'Info', color: '#38bdf8', textClass: 'text-sky-400', softClass: 'border-sky-500/20 bg-sky-500/10' }
];

const emptySeverityTotals = (): WazuhSeverityTotals => ({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
});

const sumSeverityTotals = (totals: WazuhSeverityTotals) => (
    Number(totals.critical || 0)
    + Number(totals.high || 0)
    + Number(totals.medium || 0)
    + Number(totals.low || 0)
    + Number(totals.info || 0)
);

const buildSeverityDistribution = (totals: WazuhSeverityTotals) => (
    severityConfig.map((item) => ({
        ...item,
        value: totals[item.key] || 0
    }))
);

const getDominantSeverityLabel = (totals: WazuhSeverityTotals) => {
    const dominant = [...buildSeverityDistribution(totals)].sort((a, b) => b.value - a.value)[0];
    return dominant?.value > 0 ? dominant.label : 'Sin dato';
};

const parseSignature = (raw: unknown): Record<string, unknown> => {
    if (typeof raw !== 'string' || raw.trim().length === 0) return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed as Record<string, unknown>
            : {};
    } catch {
        return {};
    }
};

const countShare = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

const normalizeCount = (value: unknown) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
};

const severityFromValue = (value: unknown): WazuhSeverityKey => {
    const normalized = String(value || 'info').toLowerCase();
    if (normalized === 'critical' || normalized === 'high' || normalized === 'medium' || normalized === 'low' || normalized === 'info') {
        return normalized;
    }
    return 'info';
};

const buildGroupedList = (pairs: Array<{ label: string; count: number }>, total: number): WazuhSnapshotListItem[] => {
    return pairs
        .filter((item) => item.label)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item) => ({
            name: item.label,
            count: item.count,
            sharePct: countShare(item.count, total)
        }));
};

export const getWazuhSeverityMeta = (severity: string) => {
    const key = severityFromValue(severity);
    return buildSeverityDistribution(emptySeverityTotals()).find((item) => item.key === key) || {
        key: 'info',
        label: 'Info',
        value: 0,
        color: '#38bdf8',
        textClass: 'text-sky-400',
        softClass: 'border-sky-500/20 bg-sky-500/10'
    };
};

export const buildWazuhDashboardModel = (
    metrics: WazuhMetrics,
    rangePreset: string = '7d',
    customFrom: string = '',
    customTo: string = ''
): WazuhDashboardModel => {
    const historical = metrics.historical || {
        totalScans: metrics.scanDetails?.length || 0,
        totalEvents: sumSeverityTotals(metrics.alertsBySeverity || emptySeverityTotals()),
        severityTotals: metrics.alertsBySeverity || emptySeverityTotals(),
        criticalPressurePct: 0,
        noiseSharePct: 0,
        avgEventsPerCut: 0,
        peakCutEvents: 0,
        medianEventsPerCut: 0,
        scanCadenceMinutesMedian: null,
        cuts: []
    };
    const snapshot = metrics.snapshot || {
        scanSummaryId: metrics.currentSnapshot?.scanId || null,
        scanId: metrics.currentSnapshot?.scanId || null,
        scanName: null,
        agentName: metrics.agentInfo?.name || null,
        scannedAt: metrics.currentSnapshot?.scannedAt || null,
        windowStart: null,
        windowEnd: null,
        totalEvents: metrics.currentSnapshot?.totalAlerts || 0,
        severityTotals: metrics.currentSnapshot?.alertsBySeverity || emptySeverityTotals(),
        dominantSeverity: 'none' as const,
        topRules: (metrics.topRules || []).map((rule) => ({ name: rule.rule, count: rule.count, sharePct: countShare(rule.count, metrics.currentSnapshot?.totalAlerts || 0) })),
        topAgents: [],
        sendReason: null,
        snapshotMode: null
    };

    const generateDateRange = (preset: string, fromStr: string, toStr: string) => {
        const dates: Date[] = [];
        const now = new Date();
        if (preset === 'custom' && fromStr && toStr) {
            const start = new Date(fromStr);
            const end = new Date(toStr);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                dates.push(new Date(d));
            }
        } else {
            let days = 30;
            if (preset === '7d') days = 7;
            if (preset === 'today') days = 1;
            if (preset === 'yesterday') days = 2;
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                dates.push(d);
            }
        }
        return dates;
    };

    const fallbackTrendFromCuts = (historical.cuts || []).reduce((acc, cut) => {
        if (!cut.scannedAt) return acc;

        const asDate = new Date(cut.scannedAt);
        if (Number.isNaN(asDate.getTime())) return acc;

        const dateKey = asDate.toISOString().split('T')[0];
        const previous = acc.get(dateKey) || emptySeverityTotals();

        acc.set(dateKey, {
            critical: previous.critical + normalizeCount(cut.severityTotals.critical),
            high: previous.high + normalizeCount(cut.severityTotals.high),
            medium: previous.medium + normalizeCount(cut.severityTotals.medium),
            low: previous.low + normalizeCount(cut.severityTotals.low),
            info: previous.info + normalizeCount(cut.severityTotals.info)
        });

        return acc;
    }, new Map<string, WazuhSeverityTotals>());

    const dateRange = generateDateRange(rangePreset, customFrom, customTo);
    const rawTrend = (metrics.trend7Days && metrics.trend7Days.length > 0)
        ? metrics.trend7Days
        : Array.from(fallbackTrendFromCuts.entries()).map(([date, totals]) => ({
            date,
            ...totals
        }));
    const computedTrend = dateRange.map((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const matchingDay = rawTrend.find((t: any) => {
            const d = new Date(t.date);
            return !Number.isNaN(d.getTime()) && d.toISOString().split('T')[0] === dateStr;
        });

        if (matchingDay) {
            return {
                ...matchingDay,
                date: dateStr,
                total: matchingDay.critical + matchingDay.high + matchingDay.medium + matchingDay.low + matchingDay.info
            };
        }

        return {
            date: dateStr,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0,
            total: 0
        };
    });

    const analytics = {
        trend: metrics.analytics?.trend?.length ? metrics.analytics.trend : computedTrend,
        uniqueAgentsInRange: metrics.analytics?.uniqueAgentsInRange ?? metrics.hostsReported ?? metrics.activeAgents ?? 0,
        avgEventsPerAgentInRange: metrics.analytics?.avgEventsPerAgentInRange ?? metrics.avgFindingsPerHost ?? 0,
        mostPressuredAgent: metrics.analytics?.mostPressuredAgent ?? (metrics.mostCriticalHost ? { name: metrics.mostCriticalHost.host, criticalCount: metrics.mostCriticalHost.criticalCount } : undefined),
        recentEvents: metrics.analytics?.recentEvents?.length ? metrics.analytics.recentEvents : (metrics.recentFindings || [])
    };

    const historicalDistribution = buildSeverityDistribution(historical.severityTotals || emptySeverityTotals());
    const snapshotDistribution = buildSeverityDistribution(snapshot.severityTotals || emptySeverityTotals());
    const dominantHistoricalSeverity = [...historicalDistribution].sort((a, b) => b.value - a.value)[0];
    const dominantRule = snapshot.topRules[0];
    const latestCut = historical.cuts[0];
    const previousCut = historical.cuts[1];
    const latestComparison = latestCut && previousCut
        ? {
            latestLabel: formatWazuhDate(latestCut.scannedAt),
            previousLabel: formatWazuhDate(previousCut.scannedAt),
            latestTotal: latestCut.totalEvents,
            previousTotal: previousCut.totalEvents,
            deltaEvents: latestCut.totalEvents - previousCut.totalEvents,
            deltaPct: previousCut.totalEvents > 0
                ? Math.round(((latestCut.totalEvents - previousCut.totalEvents) / previousCut.totalEvents) * 100)
                : null,
            criticalHighDelta: (latestCut.severityTotals.critical + latestCut.severityTotals.high)
                - (previousCut.severityTotals.critical + previousCut.severityTotals.high),
            latestDominantSeverity: getDominantSeverityLabel(latestCut.severityTotals),
            previousDominantSeverity: getDominantSeverityLabel(previousCut.severityTotals)
        }
        : undefined;

    return {
        rangeLabel: metrics.range?.label || metrics.historyRangeLabel || 'Ultimos 7 dias',
        integrationStatus: {
            ...(metrics.integrationStatus || {
                configured: metrics.configured !== false,
                managerStatus: metrics.status || 'Operativo',
                activeAgents: metrics.activeAgents,
                inactiveAgents: metrics.inactiveAgents,
                lastSync: metrics.lastSync || null,
                agentName: metrics.agentInfo?.name || null
            }),
            managerStatusLabel: metrics.integrationStatus?.managerStatus || metrics.status || 'Operativo',
            lastSyncLabel: formatWazuhDate(metrics.integrationStatus?.lastSync || metrics.lastSync),
            agentNameLabel: metrics.integrationStatus?.agentName || metrics.agentInfo?.name || 'Manager no identificado'
        },
        hero: {
            totalEvents: historical.totalEvents,
            criticalPressurePct: historical.criticalPressurePct,
            latestCutLabel: formatWazuhDate(snapshot.scannedAt),
            latestCutEvents: snapshot.totalEvents,
            dominantRuleName: dominantRule?.name || 'Sin regla dominante',
            dominantRuleCount: dominantRule?.count || 0
        },
        summaryCards: [
            {
                title: 'Eventos totales',
                value: historical.totalEvents.toLocaleString(),
                subtitle: `Acumulado visible en ${metrics.range?.label || metrics.historyRangeLabel || 'el rango seleccionado'}.`,
                accentClass: 'text-white',
                glowClass: 'from-sky-500/15 via-transparent to-transparent'
            },
            {
                title: 'Critico + Alto %',
                value: `${historical.criticalPressurePct}%`,
                subtitle: 'Presion prioritaria dentro del volumen historico.',
                accentClass: 'text-red-400',
                glowClass: 'from-red-500/15 via-transparent to-transparent'
            },
            {
                title: 'Promedio por corte',
                value: historical.avgEventsPerCut.toLocaleString('es-ES', { maximumFractionDigits: 1 }),
                subtitle: 'Carga operativa media por sincronizacion.',
                accentClass: 'text-orange-300',
                glowClass: 'from-orange-500/15 via-transparent to-transparent'
            },
            {
                title: 'Pico por corte',
                value: historical.peakCutEvents.toLocaleString(),
                subtitle: 'Mayor volumen registrado en un solo corte.',
                accentClass: 'text-amber-300',
                glowClass: 'from-amber-500/15 via-transparent to-transparent'
            }
        ],
        historical: {
            totalScans: historical.totalScans || 0,
            totalEvents: historical.totalEvents || 0,
            avgEventsPerCut: historical.avgEventsPerCut || 0,
            peakCutEvents: historical.peakCutEvents || 0,
            medianEventsPerCut: historical.medianEventsPerCut || 0,
            scanCadenceMinutesMedian: historical.scanCadenceMinutesMedian || 0,
            criticalPressurePct: historical.criticalPressurePct || 0,
            noiseSharePct: historical.noiseSharePct || 0,
            severityDistribution: historicalDistribution,
            cutRows: historical.cuts,
            cutVolume: historical.cuts.map((cut, index) => {
                const fullLabel = cut.scannedAt ? formatWazuhDate(cut.scannedAt) : cut.scanName;
                const tickLabel = cut.scannedAt ? formatShortDayTime(cut.scannedAt) : `Corte ${index + 1}`;
                return {
                    id: cut.id,
                    label: cut.scannedAt || `${cut.id}-${index + 1}`,
                    tickLabel,
                    fullLabel,
                    scannedAt: cut.scannedAt,
                    total: cut.totalEvents
                };
            }),
            latestComparison
        },
        snapshot: {
            ...snapshot,
            scannedAtLabel: formatWazuhDate(snapshot.scannedAt),
            windowLabel: snapshot.windowStart && snapshot.windowEnd
                ? `${formatWazuhDate(snapshot.windowStart)} -> ${formatWazuhDate(snapshot.windowEnd)}`
                : 'Ventana no informada',
            severityDistribution: snapshotDistribution,
            topRules: snapshot.topRules,
            topAgents: snapshot.topAgents
        },
        analytics: {
            ...analytics,
            trend: analytics.trend.map((day) => ({
                ...day,
                label: formatShortDay(day.date)
            })),
            recentEvents: analytics.recentEvents.map((event) => ({
                ...event,
                detectedAtLabel: formatWazuhDate(event.detectedAt)
            }))
        },
        dominantHistoricalSeverity
    };
};

export const buildWazuhScanDetailModel = (scanData: any): WazuhScanDetailModel => {
    const scan = scanData?.scan || scanData || {};
    const findings = Array.isArray(scan?.results?.vulnerabilities)
        ? scan.results.vulnerabilities
        : Array.isArray(scan?.findings)
            ? scan.findings
            : [];
    const meta = scan?.meta_info || scan?.meta || {};
    const signature = parseSignature(meta?.snapshot_signature);
    const initialSeverityTotals: WazuhSeverityTotals = {
        critical: normalizeCount(scan?.critical_count),
        high: normalizeCount(scan?.high_count),
        medium: normalizeCount(scan?.medium_count),
        low: normalizeCount(scan?.low_count),
        info: normalizeCount(scan?.info_count)
    };

    const severityTotals = sumSeverityTotals(initialSeverityTotals) > 0
        ? initialSeverityTotals
        : findings.reduce((acc: WazuhSeverityTotals, finding: any) => {
            const severity = severityFromValue(finding?.severity || finding?.priority || finding?.level);
            acc[severity] += 1;
            return acc;
        }, emptySeverityTotals());

    const totalEvents = sumSeverityTotals(severityTotals);
    const mappedFindings = findings.map((finding: any, index: number) => ({
        id: String(finding?.id ?? `${scan?.id || 'scan'}-${index + 1}`),
        name: String(finding?.name || finding?.description || finding?.rule?.description || `Evento ${index + 1}`),
        description: String(finding?.description || finding?.impact || 'Sin descripcion adicional'),
        severity: severityFromValue(finding?.severity || finding?.priority || finding?.level),
        host: String(finding?.host || finding?.agent?.name || finding?.hostname || '—'),
        reference: String(finding?.scan_id || finding?.rule?.id || finding?.cve || finding?.oid || '—'),
        detectedAt: finding?.created_at || finding?.timestamp || finding?.detected_at || scan?.scanned_at || scan?.created_at
    }));

    const ruleCounter = new Map<string, number>();
    const agentCounter = new Map<string, number>();

    mappedFindings.forEach((finding: WazuhScanDetailModel['findings'][number]) => {
        ruleCounter.set(finding.name, (ruleCounter.get(finding.name) || 0) + 1);
        if (finding.host && finding.host !== '—') {
            agentCounter.set(finding.host, (agentCounter.get(finding.host) || 0) + 1);
        }
    });

    const topRules = buildGroupedList(
        Array.from(ruleCounter.entries()).map(([label, count]) => ({ label, count })),
        totalEvents
    );
    const topAgents = buildGroupedList(
        Array.from(agentCounter.entries()).map(([label, count]) => ({ label, count })),
        totalEvents
    );

    return {
        scanId: String(scan?.scan_id || scan?.id || '—'),
        scanName: String(scan?.scan_name || scan?.target || 'Wazuh scan'),
        scannedAtLabel: formatWazuhDate(scan?.scanned_at || scan?.created_at),
        agentName: String(scan?.agent_name || meta?.agent_name || 'Agente no identificado'),
        sendReason: String(meta?.send_reason || scan?.send_reason || 'No informado'),
        snapshotMode: String(meta?.snapshot_mode || scan?.snapshot_mode || 'No informado'),
        windowLabel: signature.window_start && signature.window_end
            ? `${formatWazuhDate(String(signature.window_start))} -> ${formatWazuhDate(String(signature.window_end))}`
            : 'Ventana no informada',
        severityDistribution: buildSeverityDistribution(severityTotals),
        totalEvents,
        criticalPressurePct: countShare(severityTotals.critical + severityTotals.high, totalEvents),
        impactedAgents: new Set(mappedFindings.map((finding: WazuhScanDetailModel['findings'][number]) => finding.host).filter((host: string) => host && host !== '—')).size,
        uniqueRules: ruleCounter.size,
        findings: mappedFindings,
        topRules,
        topAgents
    };
};
