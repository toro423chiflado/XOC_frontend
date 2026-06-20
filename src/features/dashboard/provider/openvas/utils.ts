import type { OpenvasMetrics } from '../../../../services/provider.service';
import type {
    OpenvasDashboardModel,
    OpenvasFindingItem,
    OpenvasHostItem,
    OpenvasPriorityBucket,
    OpenvasScanRow,
    OpenvasSeverityDatum,
    OpenvasTopCveItem,
    OpenvasTrendDatum,
    SeverityKey
} from './types';

const severityOrder: SeverityKey[] = ['critical', 'high', 'medium', 'low', 'info'];

const severityConfig: Record<SeverityKey, Omit<OpenvasSeverityDatum, 'value'>> = {
    critical: {
        key: 'critical',
        label: 'Critico',
        shortLabel: 'Crit',
        color: '#ef4444',
        textClass: 'text-red-400',
        softClass: 'border-red-500/20 bg-red-500/10',
        badgeClass: 'border-red-500/30 bg-red-500/10 text-red-300'
    },
    high: {
        key: 'high',
        label: 'Alto',
        shortLabel: 'High',
        color: '#f97316',
        textClass: 'text-orange-400',
        softClass: 'border-orange-500/20 bg-orange-500/10',
        badgeClass: 'border-orange-500/30 bg-orange-500/10 text-orange-300'
    },
    medium: {
        key: 'medium',
        label: 'Medio',
        shortLabel: 'Med',
        color: '#d97706',
        textClass: 'text-amber-400',
        softClass: 'border-amber-500/20 bg-amber-500/10',
        badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    },
    low: {
        key: 'low',
        label: 'Bajo',
        shortLabel: 'Low',
        color: '#10b981',
        textClass: 'text-emerald-400',
        softClass: 'border-emerald-500/20 bg-emerald-500/10',
        badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    },
    info: {
        key: 'info',
        label: 'Info',
        shortLabel: 'Info',
        color: '#3b82f6',
        textClass: 'text-blue-400',
        softClass: 'border-blue-500/20 bg-blue-500/10',
        badgeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-300'
    }
};

const severityWeights: Record<SeverityKey, number> = {
    critical: 20,
    high: 10,
    medium: 4,
    low: 1,
    info: 0.25
};

const toNumber = (value: unknown, fallback = 0) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const safeString = (value: unknown, fallback = '—') => {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    return fallback;
};

export const formatOpenvasDate = (dateString?: string) => {
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

const normalizeSeverity = (severity: unknown, cvss?: unknown): SeverityKey => {
    const value = String(severity || '').toLowerCase();
    if (severityOrder.includes(value as SeverityKey)) return value as SeverityKey;

    const score = toNumber(cvss, NaN);
    if (Number.isFinite(score)) {
        if (score >= 9) return 'critical';
        if (score >= 7) return 'high';
        if (score >= 4) return 'medium';
        if (score > 0) return 'low';
    }

    return 'info';
};

const weightedRiskFromCounts = (counts: Record<SeverityKey, number>) => severityOrder.reduce(
    (total, key) => total + counts[key] * severityWeights[key],
    0
);

const getSeverityCountsFromScan = (scan: any): Record<SeverityKey, number> => {
    const counts = {
        critical: toNumber(scan?.critical_count),
        high: toNumber(scan?.high_count),
        medium: toNumber(scan?.medium_count),
        low: toNumber(scan?.low_count),
        info: toNumber(scan?.info_count)
    } as Record<SeverityKey, number>;

    const hasExplicitCounts = severityOrder.some((key) => counts[key] > 0);
    if (hasExplicitCounts) return counts;

    if (Array.isArray(scan?.vulnerabilities) && scan.vulnerabilities.length > 0) {
        scan.vulnerabilities.forEach((vulnerability: any) => {
            const severity = normalizeSeverity(vulnerability?.severity, vulnerability?.cvss);
            counts[severity] += 1;
        });
    }

    return counts;
};

const buildSeverityDistribution = (metrics: OpenvasMetrics): OpenvasSeverityDatum[] => severityOrder.map((key) => ({
    ...severityConfig[key],
    value: toNumber(metrics.vulnerabilities[key])
}));

const buildTrendData = (metrics: OpenvasMetrics, analytics: any): OpenvasTrendDatum[] => {
    const trendSource = Array.isArray(analytics?.trend_7_days)
        ? analytics.trend_7_days
        : Array.isArray(metrics.trend_7_days)
            ? metrics.trend_7_days
            : [];

    return trendSource.map((item: any) => {
        const critical = toNumber(item?.critical);
        const high = toNumber(item?.high);
        const medium = toNumber(item?.medium);
        const low = toNumber(item?.low);
        const info = toNumber(item?.info);

        return {
            date: new Date(item?.date || '').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
            critical,
            high,
            medium,
            low,
            info,
            total: critical + high + medium + low + info
        };
    });
};

const normalizeFindings = (metrics: OpenvasMetrics, analytics: any): OpenvasFindingItem[] => {
    const analyticsFindings = Array.isArray(analytics?.recentFindings) ? analytics.recentFindings : [];
    const scanFindings = Array.isArray(metrics.scanDetails)
        ? metrics.scanDetails.flatMap((scan: any) =>
            Array.isArray(scan?.vulnerabilities)
                ? scan.vulnerabilities.map((vulnerability: any, index: number) => ({
                    id: String(vulnerability?.id ?? `${scan?.id || scan?.target || 'scan'}-${index}`),
                    name: safeString(vulnerability?.name, `Hallazgo ${index + 1}`),
                    severity: normalizeSeverity(vulnerability?.severity, vulnerability?.cvss),
                    host: safeString(vulnerability?.host, safeString(scan?.target, 'Host no identificado')),
                    cve: typeof vulnerability?.cve === 'string' ? vulnerability.cve : undefined,
                    cvss: toNumber(vulnerability?.cvss, undefined),
                    detectedAt: scan?.created_at
                }))
                : []
        )
        : [];

    const merged = analyticsFindings.length > 0 ? analyticsFindings : scanFindings;

    return merged.map((finding: any, index: number) => ({
        id: String(finding?.id ?? `finding-${index + 1}`),
        name: safeString(finding?.name, `Hallazgo ${index + 1}`),
        severity: normalizeSeverity(finding?.severity, finding?.cvss),
        host: safeString(finding?.host, 'Host no identificado'),
        cve: typeof finding?.cve === 'string'
            ? finding.cve
            : typeof finding?.cve_id === 'string'
                ? finding.cve_id
                : undefined,
        cvss: toNumber(finding?.cvss ?? finding?.cvss_score, undefined),
        detectedAt: typeof finding?.detectedAt === 'string'
            ? finding.detectedAt
            : typeof finding?.detected_at === 'string'
                ? finding.detected_at
                : typeof finding?.created_at === 'string'
                    ? finding.created_at
                    : undefined
    }));
};

const buildHostExposure = (metrics: OpenvasMetrics, recentFindings: OpenvasFindingItem[]): OpenvasHostItem[] => {
    const hostMap = new Map<string, OpenvasHostItem>();

    const registerFinding = (hostName: string, finding: OpenvasFindingItem, scanId?: string, lastSeen?: string) => {
        const current = hostMap.get(hostName) || {
            host: hostName,
            totalFindings: 0,
            weightedRisk: 0,
            maxCvss: 0,
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0,
            hasSeverityBreakdown: false,
            lastSeen,
            scanId,
            topFindings: []
        };

        current.totalFindings += 1;
        current[finding.severity] += 1;
        current.weightedRisk += severityWeights[finding.severity];
        current.maxCvss = Math.max(current.maxCvss, toNumber(finding.cvss));
        current.hasSeverityBreakdown = true;
        current.lastSeen = current.lastSeen || lastSeen;
        current.scanId = current.scanId || scanId;
        current.topFindings.push(finding);
        hostMap.set(hostName, current);
    };

    if (Array.isArray(metrics.scanDetails)) {
        metrics.scanDetails.forEach((scan: any) => {
            const target = safeString(scan?.target, 'Host no identificado');
            if (Array.isArray(scan?.vulnerabilities) && scan.vulnerabilities.length > 0) {
                scan.vulnerabilities.forEach((vulnerability: any, index: number) => {
                    const host = safeString(vulnerability?.host, target);
                    registerFinding(host, {
                        id: String(vulnerability?.id ?? `${scan?.id || target}-${index}`),
                        name: safeString(vulnerability?.name, `Hallazgo ${index + 1}`),
                        severity: normalizeSeverity(vulnerability?.severity, vulnerability?.cvss),
                        host,
                        cve: typeof vulnerability?.cve === 'string' ? vulnerability.cve : undefined,
                        cvss: toNumber(vulnerability?.cvss, undefined),
                        detectedAt: scan?.created_at
                    }, scan?.id, scan?.created_at);
                });
                return;
            }

            const findings = toNumber(scan?.total_findings ?? scan?.vulnerabilities?.length);
            if (!findings) return;

            const counts = getSeverityCountsFromScan(scan);

            const current = hostMap.get(target) || {
                host: target,
                totalFindings: 0,
                weightedRisk: 0,
                maxCvss: 0,
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
                info: 0,
                hasSeverityBreakdown: false,
                lastSeen: scan?.created_at,
                scanId: scan?.id,
                topFindings: []
            };
            current.totalFindings += findings;
            severityOrder.forEach((key) => {
                current[key] += counts[key];
            });
            current.weightedRisk += weightedRiskFromCounts(counts);
            current.maxCvss = Math.max(current.maxCvss, toNumber(scan?.cvss_max, 0));
            current.hasSeverityBreakdown = current.hasSeverityBreakdown || severityOrder.some((key) => counts[key] > 0);
            hostMap.set(target, current);
        });
    }

    // Always register recent findings so we have actual topFindings and cvss details
    // even if the backend only returned summary counts in scanDetails
    recentFindings.forEach((finding) => {
        registerFinding(finding.host, finding, undefined, finding.detectedAt);
    });

    return Array.from(hostMap.values())
        .map((host) => ({
            ...host,
            topFindings: [...host.topFindings]
                .sort((a: OpenvasFindingItem, b: OpenvasFindingItem) => toNumber(b.cvss) - toNumber(a.cvss))
                .slice(0, 3)
        }))
        .sort((a, b) => b.weightedRisk - a.weightedRisk)
        .slice(0, 8);
};

const buildScanRows = (metrics: OpenvasMetrics): OpenvasScanRow[] => {
    if (!Array.isArray(metrics.scanDetails)) return [];

    return metrics.scanDetails
        .map((scan: any) => {
            const counts = getSeverityCountsFromScan(scan);
            const findings = toNumber(scan?.total_findings, NaN);
            const totalFindings = Number.isFinite(findings)
                ? findings
                : severityOrder.reduce((total, key) => total + counts[key], 0);

            return {
                id: String(scan?.id ?? scan?.target ?? Math.random()),
                target: safeString(scan?.target, 'Host no identificado'),
                status: safeString(scan?.status, 'unknown'),
                createdAt: scan?.created_at,
                findings: totalFindings,
                critical: counts.critical,
                high: counts.high,
                medium: counts.medium,
                low: counts.low,
                info: counts.info,
                weightedRisk: weightedRiskFromCounts(counts),
                hasSeverityBreakdown: severityOrder.some((key) => counts[key] > 0)
            };
        })
        .sort((a, b) => b.weightedRisk - a.weightedRisk || toNumber(new Date(b.createdAt || '').getTime()) - toNumber(new Date(a.createdAt || '').getTime()))
        .slice(0, 10);
};

const buildTopCVEs = (metrics: OpenvasMetrics, analytics: any): OpenvasTopCveItem[] => {
    const source = Array.isArray(analytics?.topCVEs)
        ? analytics.topCVEs
        : Array.isArray(metrics.topCVEs)
            ? metrics.topCVEs
            : [];

    return source
        .map((item: any) => {
            const cve = safeString(item?.cve_id ?? item?.cve, 'Sin CVE');
            const hostsAffected = toNumber(item?.hosts_affected ?? item?.count, 0);
            const cvss = toNumber(item?.cvss_score ?? item?.cvss, 0);
            const severity = normalizeSeverity(item?.severity, cvss);
            return {
                cve,
                severity,
                hostsAffected,
                cvss,
                impactScore: Math.round(Math.max(hostsAffected * Math.max(cvss, 1), severityWeights[severity]))
            };
        })
        .sort((a: OpenvasTopCveItem, b: OpenvasTopCveItem) => b.impactScore - a.impactScore)
        .slice(0, 12);
};

const buildRiskNarrative = (
    totalVulnerabilities: number,
    totalHosts: number,
    criticalCount: number,
    highCount: number,
    topHost?: OpenvasHostItem
) => {
    if (totalVulnerabilities === 0) {
        return 'La superficie analizada no muestra hallazgos activos en este momento.';
    }

    if (criticalCount > 0) {
        return `La exposicion actual se concentra en ${criticalCount} hallazgos criticos y ${highCount} altos. ${topHost ? `${topHost.host} lidera la prioridad operativa.` : 'La contencion inmediata debe enfocarse en los activos mas expuestos.'}`;
    }

    return `El riesgo esta distribuido en ${totalHosts} activos con ${highCount} hallazgos altos como foco principal. La prioridad es reducir densidad de findings por host sin perder visibilidad del contexto.`;
};

const buildInsights = (
    severityDistribution: OpenvasSeverityDatum[],
    hostExposure: OpenvasHostItem[],
    scanRows: OpenvasScanRow[],
    topCVEs: OpenvasTopCveItem[]
) => {
    const critical = severityDistribution.find((item) => item.key === 'critical')?.value || 0;
    const high = severityDistribution.find((item) => item.key === 'high')?.value || 0;
    const firstHost = hostExposure[0];
    const firstScan = scanRows[0];
    const firstCve = topCVEs[0];

    const items = [
        critical > 0
            ? `${critical} hallazgos criticos requieren triage inmediato antes de ampliar cobertura.`
            : 'No hay hallazgos criticos visibles; el foco pasa a consolidar la remediacion alta y media.',
        firstHost
            ? `${firstHost.host} concentra ${firstHost.totalFindings} hallazgos y un riesgo ponderado de ${firstHost.weightedRisk}.`
            : 'Aun no hay suficiente detalle por activo para construir un mapa de exposicion.',
        firstCve
            ? `${firstCve.cve} es el indicador tecnico dominante con impacto estimado ${firstCve.impactScore}.`
            : 'Todavia no hay CVEs priorizados para enriquecer la narrativa tecnica.',
        firstScan
            ? `El reporte con mayor carga operativa es ${firstScan.target} con ${firstScan.findings} findings consolidados.`
            : 'No hay historial de scans suficiente para resaltar una corrida dominante.',
        high > 0
            ? `${high} hallazgos altos marcan la segunda capa de prioridad para remediation sprints.`
            : 'La distribucion alta se mantiene contenida y permite enfocar mejoras de hygiene.'
    ];

    return items.slice(0, 4);
};

const buildPriorityBuckets = (severityDistribution: OpenvasSeverityDatum[], totalVulnerabilities: number): OpenvasPriorityBucket[] => {
    const critical = severityDistribution.find((item) => item.key === 'critical')?.value || 0;
    const high = severityDistribution.find((item) => item.key === 'high')?.value || 0;
    const medium = severityDistribution.find((item) => item.key === 'medium')?.value || 0;
    const lowInfo = (severityDistribution.find((item) => item.key === 'low')?.value || 0) + (severityDistribution.find((item) => item.key === 'info')?.value || 0);
    const backlog = Math.max(totalVulnerabilities - critical - high - medium, 0);

    return [
        {
            title: 'Atencion inmediata',
            value: critical + high,
            description: 'Criticos y altos que deben entrar primero al flujo operativo.',
            accentClass: 'text-red-400'
        },
        {
            title: 'Remediacion planificada',
            value: medium,
            description: 'Hallazgos medianos listos para agrupar por sprint o ventana.',
            accentClass: 'text-amber-400'
        },
        {
            title: 'Monitoreo continuo',
            value: lowInfo,
            description: `Backlog visible de baja prioridad para mantener hygiene (${backlog}).`,
            accentClass: 'text-emerald-400'
        }
    ];
};

export const getSeverityMeta = (severity: SeverityKey) => severityConfig[severity];

const buildCutVolumeData = (metrics: OpenvasMetrics): any[] => {
    if (!Array.isArray(metrics.scanDetails)) return [];

    const cuts = metrics.scanDetails
        .filter((scan: any) => scan?.scanned_at || scan?.created_at)
        .map((scan: any) => {
            const dateStr = scan?.scanned_at || scan?.created_at || '';
            const date = new Date(dateStr);
            const counts = getSeverityCountsFromScan(scan);
            const findings = toNumber(scan?.total_findings, NaN);
            const total = Number.isFinite(findings)
                ? findings
                : severityOrder.reduce((sum, key) => sum + counts[key], 0);

            return {
                timestamp: date.getTime(),
                id: scan?.scan_id || scan?.id || `${date.getTime()}-${Math.random()}`,
                label: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                fullLabel: `${safeString(scan?.scan_name || scan?.target, 'Scan')} • ${date.toLocaleString('es-ES')}`,
                tickLabel: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                total
            };
        })
        .sort((a, b) => a.timestamp - b.timestamp);

    return cuts.slice(-30).map(({ timestamp, ...rest }) => rest);
};

export const buildOpenvasDashboardModel = (metrics: OpenvasMetrics, analytics: any): OpenvasDashboardModel => {
    const severityDistribution = buildSeverityDistribution(metrics);
    const trendData = buildTrendData(metrics, analytics);
    const cutVolume = buildCutVolumeData(metrics);
    const recentFindings = normalizeFindings(metrics, analytics)
        .sort((a, b) => toNumber(b.cvss) - toNumber(a.cvss))
        .slice(0, 8);
    const hostExposure = buildHostExposure(metrics, recentFindings);
    const topCVEs = buildTopCVEs(metrics, analytics);
    const scanRows = buildScanRows(metrics);

    const totalVulnerabilities = severityDistribution.reduce((total, item) => total + item.value, 0);
    const totalHosts = Math.max(toNumber(metrics.hostsScanned), hostExposure.length);
    const scansCompleted = toNumber(metrics.scansCompleted);
    const weightedRisk = weightedRiskFromCounts({
        critical: severityDistribution.find((item) => item.key === 'critical')?.value || 0,
        high: severityDistribution.find((item) => item.key === 'high')?.value || 0,
        medium: severityDistribution.find((item) => item.key === 'medium')?.value || 0,
        low: severityDistribution.find((item) => item.key === 'low')?.value || 0,
        info: severityDistribution.find((item) => item.key === 'info')?.value || 0
    });
    const riskScore = Math.min(100, Math.round(weightedRisk / Math.max(totalHosts, 1)));
    const riskLevel = riskScore >= 75 ? 'Critico' : riskScore >= 45 ? 'Elevado' : riskScore >= 20 ? 'Moderado' : 'Controlado';
    const trendDelta = trendData.length >= 2
        ? trendData[trendData.length - 1].total - trendData[trendData.length - 2].total
        : null;

    const summaryCards = [
        {
            title: 'Riesgo severo',
            value: `${(severityDistribution.find((item) => item.key === 'critical')?.value || 0) + (severityDistribution.find((item) => item.key === 'high')?.value || 0)}`,
            subtitle: 'Volumen prioritario a evaluar.',
            accentClass: 'text-red-400',
            glowClass: 'from-red-500/15 via-transparent to-transparent'
        },
        {
            title: 'Activos con contexto',
            value: `${totalHosts}`,
            subtitle: 'Hosts integrados.',
            accentClass: 'text-blue-400',
            glowClass: 'from-blue-500/15 via-transparent to-transparent'
        },
        {
            title: 'Corridas historicas',
            value: `${scansCompleted}`,
            subtitle: 'Historial de tendencias.',
            accentClass: 'text-emerald-400',
            glowClass: 'from-emerald-500/15 via-transparent to-transparent'
        }
    ];

    return {
        totalVulnerabilities,
        totalHosts,
        scansCompleted,
        riskScore,
        riskLevel,
        riskNarrative: buildRiskNarrative(
            totalVulnerabilities,
            totalHosts,
            severityDistribution.find((item) => item.key === 'critical')?.value || 0,
            severityDistribution.find((item) => item.key === 'high')?.value || 0,
            hostExposure[0]
        ),
        trendDelta,
        severityDistribution,
        trendData,
        cutVolume,
        recentFindings,
        hostExposure,
        topCVEs,
        scanRows,
        summaryCards,
        priorityBuckets: buildPriorityBuckets(severityDistribution, totalVulnerabilities),
        insights: buildInsights(severityDistribution, hostExposure, scanRows, topCVEs),
        latestActivity: metrics.lastUpdate
    };
};
