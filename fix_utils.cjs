const fs = require('fs');

const content = `import type { DashboardRangePreset, NessusMetrics } from '../../../../services/provider.service';
import type { NessusDashboardModel, NessusSeverityDatum, NessusCutDatum } from './types';

const getHistoryRangeLabel = (preset: DashboardRangePreset, customFrom: string, customTo: string) => {
    if (preset === 'custom' && customFrom && customTo) return \`\${customFrom} -> \${customTo}\`;
    if (preset === 'today') return 'Hoy';
    if (preset === 'yesterday') return 'Ayer';
    if (preset === '30d') return 'Ultimos 30 dias';
    return 'Ultimos 7 dias';
};

const toTimestamp = (value: unknown) => {
    const parsed = new Date(String(value || ''));
    const ts = parsed.getTime();
    return Number.isNaN(ts) ? NaN : ts;
};

const formatShortDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
};

export const buildNessusDashboardModel = (
    metrics: NessusMetrics,
    rangePreset: DashboardRangePreset,
    customFrom: string,
    customTo: string
): NessusDashboardModel => {
    const severityDistribution: NessusSeverityDatum[] = [
        { key: 'critical', label: 'Critico', value: metrics.vulnerabilities.critical, color: '#ef4444', textClass: 'text-red-400', softClass: 'border-red-500/20 bg-red-500/10' },
        { key: 'high', label: 'Alto', value: metrics.vulnerabilities.high, color: '#f97316', textClass: 'text-orange-400', softClass: 'border-orange-500/20 bg-orange-500/10' },
        { key: 'medium', label: 'Medio', value: metrics.vulnerabilities.medium, color: '#f59e0b', textClass: 'text-amber-400', softClass: 'border-amber-500/20 bg-amber-500/10' },
        { key: 'low', label: 'Bajo', value: metrics.vulnerabilities.low, color: '#22c55e', textClass: 'text-emerald-400', softClass: 'border-emerald-500/20 bg-emerald-500/10' },
        { key: 'info', label: 'Info', value: metrics.vulnerabilities.info, color: '#38bdf8', textClass: 'text-sky-400', softClass: 'border-sky-500/20 bg-sky-500/10' }
    ];

    const totalFindings = severityDistribution.reduce((sum, item) => sum + item.value, 0);
    const criticalPressure = totalFindings > 0
        ? Math.round(((metrics.vulnerabilities.critical + metrics.vulnerabilities.high) / totalFindings) * 100)
        : 0;
    const lowNoiseShare = totalFindings > 0
        ? Math.round(((metrics.vulnerabilities.low + metrics.vulnerabilities.info) / totalFindings) * 100)
        : 0;
    const dominantSeverity = [...severityDistribution].sort((a, b) => b.value - a.value)[0] || severityDistribution[0];

    const normalizedTrend = (metrics.trend7Days || [])
        .map((day) => {
            const ts = toTimestamp(day.date);
            return {
                ts,
                date: String(day.date || ''),
                critical: Number(day.critical || 0),
                high: Number(day.high || 0),
                medium: Number(day.medium || 0),
                low: Number(day.low || 0),
                info: Number(day.info || 0)
            };
        })
        .filter((day) => Number.isFinite(day.ts))
        .sort((a, b) => a.ts - b.ts);

    const trendIsProjected = normalizedTrend.length < 2;
    const trendData = trendIsProjected
        ? Array.from({ length: 7 }, (_, dayIndex) => {
            const weight = (dayIndex + 1) / 7;
            return {
                date: \`D\${dayIndex + 1}\`,
                critical: Math.round(metrics.vulnerabilities.critical * weight),
                high: Math.round(metrics.vulnerabilities.high * weight),
                medium: Math.round(metrics.vulnerabilities.medium * weight),
                low: Math.round(metrics.vulnerabilities.low * weight),
                info: Math.round(metrics.vulnerabilities.info * weight),
                total: 0
            };
        }).map((item) => ({
            ...item,
            total: item.critical + item.high + item.medium + item.low + item.info
        }))
        : normalizedTrend.map((day) => ({
            date: formatShortDate(day.date),
            critical: day.critical,
            high: day.high,
            medium: day.medium,
            low: day.low,
            info: day.info,
            total: day.critical + day.high + day.medium + day.low + day.info
        }));

    const mappedScans = (metrics.scanDetails || []).map((scan) => ({
        id: scan.id,
        target: scan.target,
        status: scan.status,
        createdAt: scan.created_at,
        totalFindings: Number(scan.total_findings || 0),
        cvssMax: Number(scan.cvss_max || 0)
    }));
    const nonZeroScans = mappedScans.filter((scan) => scan.totalFindings > 0);

    const cutVolume: NessusCutDatum[] = mappedScans.map((scan, index) => {
        return {
            label: \`Corte \${index + 1}\`,
            total: scan.totalFindings,
            fullLabel: \`\${scan.target} (\${formatShortDate(scan.createdAt)})\`,
            tickLabel: \`C\${index + 1}\`
        };
    }).reverse();

    return {
        totalFindings,
        criticalPressure,
        lowNoiseShare,
        dominantSeverity,
        severityDistribution,
        trendData,
        cutVolume,
        historyRangeLabel: getHistoryRangeLabel(rangePreset, customFrom, customTo),
        trendIsProjected,
        summaryCards: [
            {
                title: 'Critico + Alto',
                value: \`\${criticalPressure}%\`,
                subtitle: 'Presion de riesgo que requiere remediacion',
                accentClass: 'text-red-300',
                glowClass: 'from-red-500/12 via-transparent to-transparent',
                iconKey: 'critical'
            },
            {
                title: 'Hosts escaneados',
                value: metrics.hostsScanned.toLocaleString(),
                subtitle: 'Activos incluidos en el periodo',
                accentClass: 'text-blue-300',
                glowClass: 'from-blue-500/12 via-transparent to-transparent',
                iconKey: 'hosts'
            },
            {
                title: 'Escaneos completados',
                value: metrics.scansCompleted.toLocaleString(),
                subtitle: 'Cortes cerrados dentro del rango',
                accentClass: 'text-emerald-300',
                glowClass: 'from-emerald-500/12 via-transparent to-transparent',
                iconKey: 'scans'
            }
        ],
        scanRows: nonZeroScans.length > 0 ? nonZeroScans : mappedScans,
        scansCompleted: metrics.scansCompleted,
        hostsScanned: metrics.hostsScanned
    };
};
`;

fs.writeFileSync('src/features/dashboard/provider/nessus/utils.ts', content);
