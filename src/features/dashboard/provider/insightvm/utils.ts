import type { OpenvasMetrics } from '../../../../services/provider.service';
import type { InsightvmDashboardModel, InsightvmSeverityDatum, InsightvmCutDatum } from './types';

export const formatInsightvmDate = (dateString?: string): string => {
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

export const getInsightvmSeverityKey = (severity: string) => {
    const label = String(severity || 'info').toLowerCase();
    if (label.includes('critical')) return 'critical';
    if (label.includes('high')) return 'high';
    if (label.includes('medium')) return 'medium';
    if (label.includes('low')) return 'low';
    return 'info';
};

const severityBase: InsightvmSeverityDatum[] = [
    { key: 'critical', label: 'Critico', value: 0, color: '#ef4444', textClass: 'text-red-400', softClass: 'border-red-500/20 bg-red-500/10', badgeClass: 'border-red-500/20 bg-red-500/10 text-red-300' },
    { key: 'high', label: 'Alto', value: 0, color: '#f97316', textClass: 'text-orange-400', softClass: 'border-orange-500/20 bg-orange-500/10', badgeClass: 'border-orange-500/20 bg-orange-500/10 text-orange-300' },
    { key: 'medium', label: 'Medio', value: 0, color: '#f59e0b', textClass: 'text-amber-400', softClass: 'border-amber-500/20 bg-amber-500/10', badgeClass: 'border-amber-500/20 bg-amber-500/10 text-amber-300' },
    { key: 'low', label: 'Bajo', value: 0, color: '#10b981', textClass: 'text-emerald-400', softClass: 'border-emerald-500/20 bg-emerald-500/10', badgeClass: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' },
    { key: 'info', label: 'Info', value: 0, color: '#3b82f6', textClass: 'text-blue-400', softClass: 'border-blue-500/20 bg-blue-500/10', badgeClass: 'border-blue-500/20 bg-blue-500/10 text-blue-300' }
];

export const getInsightvmSeverityMeta = (severity: string) => {
    const key = getInsightvmSeverityKey(severity);
    return severityBase.find((item) => item.key === key) || severityBase[4];
};

export const buildInsightvmDashboardModel = (metrics: OpenvasMetrics, analytics: any): InsightvmDashboardModel => {
    const severityDistribution = severityBase.map((item) => ({ ...item, value: metrics.vulnerabilities[item.key] || 0 }));
    const totalVulnerabilities = severityDistribution.reduce((sum, item) => sum + item.value, 0);
    const dominantSeverity = [...severityDistribution].sort((a, b) => b.value - a.value)[0];
    const criticalPressure = totalVulnerabilities > 0
        ? Math.round(((metrics.vulnerabilities.critical + metrics.vulnerabilities.high) / totalVulnerabilities) * 100)
        : 0;
    const hostCoverage = analytics?.hostDistribution?.totalUniqueHosts || metrics.hostsScanned;
    const avgRiskPerHost = analytics?.hostDistribution?.avgVulnerabilitiesPerHost || (metrics.hostsScanned > 0 ? totalVulnerabilities / metrics.hostsScanned : 0);

    const rawTrend = (analytics?.trend_7_days || metrics.trend_7_days || []).map((day: any) => ({
        date: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        critical: Number(day.critical || 0),
        high: Number(day.high || 0),
        medium: Number(day.medium || 0),
        low: Number(day.low || 0),
        info: Number(day.info || 0),
        total: Number(day.critical || 0) + Number(day.high || 0) + Number(day.medium || 0) + Number(day.low || 0) + Number(day.info || 0)
    }));

    const hasValidTrendData = rawTrend.length >= 2 && rawTrend.some((item: any) => item.total > 0);
    const trendIsProjected = !hasValidTrendData;
    const trendData = rawTrend;

    const scanDetails = (metrics.scanDetails || []);
    const topCVEsSource = Array.isArray(analytics?.topCVEs) && analytics.topCVEs.length > 0
        ? analytics.topCVEs
        : (metrics.topCVEs || []);
    const topCVEs = topCVEsSource.map((item: any) => {
        const cve = String(item?.cve_id || item?.cve || '').trim();
        const count = Number(item?.hosts_affected ?? item?.count ?? 0);
        const cvss = Number(item?.cvss_score ?? item?.cvss ?? 0);
        return {
            cve,
            severity: String(item?.severity || 'info').toLowerCase(),
            count,
            cvss,
            impactScore: cvss > 0 ? Math.round(count * cvss) : count
        };
    }).filter((item: { cve: string }) => item.cve);
    const recentFindings = Array.isArray(analytics?.recentFindings)
        ? analytics.recentFindings.map((item: any) => ({
            id: String(item?.id || ''),
            name: String(item?.name || 'Hallazgo'),
            severity: String(item?.severity || 'info').toLowerCase(),
            host: String(item?.host || '—'),
            cve: item?.cve ? String(item.cve) : undefined,
            cvss: typeof item?.cvss === 'number' ? item.cvss : Number.isFinite(Number(item?.cvss)) ? Number(item.cvss) : undefined,
            detected_at: item?.detected_at ? String(item.detected_at) : undefined
        }))
        : [];
    
    const mappedScans = scanDetails.map((scan) => ({
        vulnerabilities: Array.isArray((scan as any).vulnerabilities)
            ? (scan as any).vulnerabilities
            : Array.isArray((scan as any).results?.vulnerabilities)
                ? (scan as any).results.vulnerabilities
                : [],
        id: scan.id,
        target: scan.target,
        status: scan.status,
        createdAt: scan.created_at,
        totalFindings: Number((scan as any).total_findings || 0),
        cvssMax: Number((scan as any).cvss_max || 0)
    })).map((scan) => ({
        ...scan,
        totalFindings: Number(scan.totalFindings || scan.vulnerabilities.length || 0),
        cvssMax: Number(scan.cvssMax || scan.vulnerabilities.reduce((max: number, vuln: any) => Math.max(max, Number(vuln?.cvss || 0)), 0))
    }));

    const cutVolume: InsightvmCutDatum[] = mappedScans.map((scan, index) => {
        return {
            label: `Corte ${index + 1}`,
            total: scan.totalFindings,
            fullLabel: `${scan.target} (${formatInsightvmDate(scan.createdAt)})`,
            tickLabel: `C${index + 1}`
        };
    }).reverse();

    return {
        totalVulnerabilities,
        hostsScanned: metrics.hostsScanned,
        scansCompleted: metrics.scansCompleted,
        avgRiskPerHost,
        lastUpdateLabel: formatInsightvmDate(metrics.lastUpdate),
        severityDistribution,
        trendData,
        trendIsProjected,
        cutVolume,
        summaryCards: [
            {
                title: 'Total vulnerabilidades',
                value: `${totalVulnerabilities}`,
                subtitle: 'Hallazgos totales.',
                accentClass: 'text-white',
                glowClass: 'from-blue-500/12 via-transparent to-transparent'
            },
            {
                title: 'Riesgo severo',
                value: `${metrics.vulnerabilities.critical + metrics.vulnerabilities.high}`,
                subtitle: `${criticalPressure}% requiere atencion.`,
                accentClass: 'text-orange-400',
                glowClass: 'from-orange-500/12 via-transparent to-transparent'
            },
            {
                title: 'Activos cubiertos',
                value: `${metrics.hostsScanned}`,
                subtitle: `${hostCoverage} endpoints unicos.`,
                accentClass: 'text-blue-400',
                glowClass: 'from-sky-500/12 via-transparent to-transparent'
            },
            {
                title: 'Escaneos',
                value: `${metrics.scansCompleted}`,
                subtitle: 'Base historica activa.',
                accentClass: 'text-emerald-400',
                glowClass: 'from-emerald-500/12 via-transparent to-transparent'
            }
        ],
        dominantSeverity,
        criticalPressure,
        scanRows: mappedScans.slice(0, 10),
        topCVEs,
        recentFindings,
        mostCriticalHost: analytics?.hostDistribution?.mostCriticalHost,
        hostCoverage
    };
};
