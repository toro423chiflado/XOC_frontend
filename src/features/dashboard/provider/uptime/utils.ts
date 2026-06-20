import type { DashboardRangePreset, UptimeMetrics } from '../../../../services/provider.service';
import type {
    UptimeAffectedMonitor,
    UptimeDashboardModel,
    UptimeDistributionDatum,
    UptimeHealthState,
    UptimeImpactGroup,
    UptimeRecentIncident,
    UptimeScanRow,
    UptimeSnapshot
} from './types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toTimestamp = (value: unknown) => {
    const parsed = new Date(String(value || ''));
    const ts = parsed.getTime();
    return Number.isNaN(ts) ? NaN : ts;
};

const formatDateTime = (value?: string) => {
    if (!value) return 'Sin registro';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getHistoryRangeLabel = (preset: DashboardRangePreset, customFrom: string, customTo: string) => {
    if (preset === 'custom' && customFrom && customTo) return `${customFrom} -> ${customTo}`;
    if (preset === 'today') return 'Hoy';
    if (preset === 'yesterday') return 'Ayer';
    if (preset === '30d') return 'Ultimos 30 dias';
    return 'Ultimos 7 dias';
};

const buildServiceRules = (incidents: UptimeRecentIncident[]) => {
    const counts = new Map<string, number>();
    incidents.forEach((incident) => {
        counts.set(incident.service, (counts.get(incident.service) || 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([service, count]) => ({ service, count }))
        .sort((left, right) => right.count - left.count);
};

const inferMonitorCategory = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized.includes('olt')) return 'OLT';
    if (normalized.includes('ccr') || normalized.includes('mikrotik') || normalized.includes('router')) return 'Router';
    if (normalized.includes('loopback')) return 'Loopback';
    if (normalized.includes('ip mgmt') || normalized.includes('management')) return 'Gestion';
    if (normalized.includes('ip enlace') || normalized.includes('enlace')) return 'Enlace';
    return 'Monitor';
};

const inferMonitorSite = (name: string) => {
    const normalized = name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const match = normalized.match(/(?:OLT|CCR\d*|Mikrotik)(?:\s+-)?\s+([A-Za-z0-9+\- ]+?)(?:\s+-|$)/i);
    if (match?.[1]) {
        let site = match[1].trim();
        if (site.toLowerCase().startsWith('mikrotik ')) {
            site = site.substring(9).trim();
        }
        site = site.replace(/^-+|-+$/g, '').trim();
        if (site) return site;
    }
    const trailing = normalized.match(/-\s*([A-Za-z0-9+ ]+)$/);
    if (trailing?.[1] && !/loopback|ip mgmt|ip enlace/i.test(trailing[1])) return trailing[1].trim();
    return 'Sitio no clasificado';
};

const buildImpactGroups = (monitors: UptimeAffectedMonitor[], key: 'category' | 'site'): UptimeImpactGroup[] => {
    const grouped = new Map<string, UptimeImpactGroup>();
    monitors.forEach((monitor) => {
        const label = key === 'category' ? monitor.category : monitor.site;
        const existing = grouped.get(label);
        if (existing) {
            existing.count += 1;
            existing.monitors.push(monitor.name);
            return;
        }

        grouped.set(label, {
            key: `${key}-${label}`,
            label,
            count: 1,
            monitors: [monitor.name]
        });
    });

    return Array.from(grouped.values()).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
};

const buildHealthState = (uptimePercentage: number, down: number, monitored: number): UptimeHealthState => {
    if (monitored === 0) {
        return {
            label: 'Sin datos',
            tone: 'warning',
            summary: 'No hay suficiente telemetria para evaluar el estado del entorno.'
        };
    }

    if (down >= 5 || uptimePercentage < 97) {
        return {
            label: 'Critico',
            tone: 'critical',
            summary: 'Hay degradacion visible y requiere atencion operativa inmediata.'
        };
    }

    if (down > 0 || uptimePercentage < 99.5) {
        return {
            label: 'En riesgo',
            tone: 'warning',
            summary: 'La operacion mantiene cobertura, pero existen servicios afectados.'
        };
    }

    return {
        label: 'Saludable',
        tone: 'stable',
        summary: 'La plataforma monitoreada se mantiene estable en el corte actual.'
    };
};

const buildSnapshots = (trendData: Array<{ date: string; uptime: number; down: number }>): UptimeSnapshot[] => {
    return trendData.slice(-6).map((trend, index) => ({
        id: `snapshot-${index}`,
        label: trend.date,
        uptime: trend.uptime,
        down: trend.down,
        status: trend.uptime >= 99.5 ? 'stable' : trend.uptime >= 97 ? 'warning' : 'critical'
    }));
};

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const generateDateRange = (preset: DashboardRangePreset, fromStr: string, toStr: string) => {
    const dates: Date[] = [];
    const now = new Date();

    if (preset === 'custom' && fromStr && toStr) {
        const start = new Date(`${fromStr}T12:00:00`);
        const end = new Date(`${toStr}T12:00:00`);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d));
        }
        return dates;
    }

    let days = 30;
    if (preset === '7d') days = 7;
    if (preset === 'today') days = 1;
    if (preset === 'yesterday') days = 2;

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d);
    }

    return dates;
};

export const buildUptimeDashboardModel = (
    metrics: UptimeMetrics,
    rangePreset: DashboardRangePreset,
    customFrom: string,
    customTo: string
): UptimeDashboardModel => {
    const monitored = Math.max(0, metrics.servicesMonitored || 0);
    const up = Math.max(0, metrics.servicesUp || 0);
    const down = Math.max(0, metrics.servicesDown || 0);
    const other = Math.max(0, monitored - up - down);
    const uptimePercentage = clamp(Number(metrics.uptimePercentage || 0), 0, 100);

    const distribution: UptimeDistributionDatum[] = [
        { key: 'up', label: 'Operativos', value: up, color: '#22c55e', textClass: 'text-emerald-400', softClass: 'border-emerald-500/20 bg-emerald-500/10' },
        { key: 'down', label: 'Caidos', value: down, color: '#ef4444', textClass: 'text-red-400', softClass: 'border-red-500/20 bg-red-500/10' },
        { key: 'other', label: 'Sin estado', value: other, color: '#a78bfa', textClass: 'text-violet-300', softClass: 'border-violet-500/20 bg-violet-500/10' }
    ];

    const dominantState = [...distribution].sort((left, right) => right.value - left.value)[0] || distribution[0];
    const availabilityPressure = monitored > 0 ? Math.round((down / monitored) * 100) : 0;
    const lowNoiseShare = monitored > 0 ? Math.round((up / monitored) * 100) : 0;
    const avgResponseTimeMs = Number(metrics.avgResponseTimeMs || 0);
    const avgUptime1d = clamp(Number(metrics.avgUptimeRatio1d || uptimePercentage), 0, 100);
    const avgUptime30d = clamp(Number(metrics.avgUptimeRatio30d || uptimePercentage), 0, 100);
    const avgUptime365d = clamp(Number(metrics.avgUptimeRatio365d || uptimePercentage), 0, 100);
    const healthState = buildHealthState(uptimePercentage, down, monitored);

    const baselineDown = Math.round((monitored * (100 - uptimePercentage)) / 100);
    const normalizedTrend = (metrics.trend7Days || [])
        .map((item) => {
            const ts = toTimestamp(item.date);
            return {
                ts,
                date: String(item.date || ''),
                uptime: clamp(Number(item.uptime || 0), 0, 100),
                down: clamp(Number(item.down || 0), 0, monitored || baselineDown + 1)
            };
        })
        .filter((item) => Number.isFinite(item.ts))
        .sort((a, b) => a.ts - b.ts);

    const dateRange = generateDateRange(rangePreset, customFrom, customTo);
    let lastKnownUptime = uptimePercentage || 100;
    const trendMatches = new Set<string>(normalizedTrend.map((item) => String(item.date || '').slice(0, 10)));

    const trendData = dateRange.map((date) => {
        const dateStr = toLocalDateStr(date);
        const matchingScan = normalizedTrend.find((item) => String(item.date || '').slice(0, 10) === dateStr);

        if (matchingScan) {
            lastKnownUptime = matchingScan.uptime;
            return {
                date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
                uptime: matchingScan.uptime,
                down: matchingScan.down
            };
        }

        return {
            date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
            uptime: lastKnownUptime,
            down: 0
        };
    });

    const trendIsProjected = trendMatches.size < Math.min(dateRange.length, 2);

    const incidentsFromDowntime: UptimeRecentIncident[] = (metrics.recentDowntime || []).map((incident, index) => ({
        id: `incident-${index}`,
        service: incident.service || 'Servicio no identificado',
        duration: incident.duration || 'N/A',
        timestamp: incident.timestamp || 'Sin registro'
    }));

    const incidentsFromDownMonitors: UptimeRecentIncident[] = (metrics.downMonitors || []).map((name, index) => ({
        id: `monitor-down-${index}`,
        service: String(name),
        duration: 'Estado DOWN activo',
        timestamp: metrics.lastSync || 'Sin registro'
    }));

    const recentIncidents: UptimeRecentIncident[] = [...incidentsFromDowntime, ...incidentsFromDownMonitors].slice(0, 20);
    const topServices = buildServiceRules(recentIncidents).slice(0, 6);
    const mostCriticalService = topServices[0] || null;

    const affectedMonitors: UptimeAffectedMonitor[] = (metrics.downMonitors || []).map((name, index) => ({
        id: `affected-${index}`,
        name,
        category: inferMonitorCategory(name),
        site: inferMonitorSite(name),
        severityLabel: down >= 5 ? 'Impacto alto' : 'Impacto moderado',
        severityTone: down >= 5 ? 'critical' : 'warning',
        sinceLabel: formatDateTime(metrics.lastSync)
    }));

    const impactByCategory = buildImpactGroups(affectedMonitors, 'category').slice(0, 6);
    const impactBySite = buildImpactGroups(affectedMonitors, 'site').slice(0, 12);
    const snapshots = buildSnapshots(trendData);

    const mappedScans: UptimeScanRow[] = (metrics.scanDetails || []).map((scan, index) => ({
        id: scan.id || `uptime-scan-${index + 1}`,
        target: scan.target || 'Corte de disponibilidad',
        status: (scan.status === 'failed' ? 'failed' : scan.status === 'running' ? 'running' : 'completed') as 'completed' | 'failed' | 'running',
        createdAt: scan.created_at || new Date().toISOString(),
        monitored: Math.max(0, Number(scan.monitored || 0)),
        up: Math.max(0, Number(scan.up || 0)),
        down: Math.max(0, Number(scan.down || 0)),
        uptime: clamp(Number(scan.uptime || 0), 0, 100)
    }));

    const scanRows: UptimeScanRow[] = mappedScans.length > 0
        ? mappedScans
        : snapshots.map((snapshot, index) => ({
            id: snapshot.id || `snapshot-${index + 1}`,
            target: snapshot.label,
            status: (snapshot.status === 'critical' ? 'failed' : snapshot.status === 'warning' ? 'running' : 'completed') as 'completed' | 'failed' | 'running',
            createdAt: snapshot.label,
            monitored,
            up: Math.max(0, monitored - snapshot.down),
            down: snapshot.down,
            uptime: snapshot.uptime
        }));

    return {
        servicesMonitored: monitored,
        servicesUp: up,
        servicesDown: down,
        uptimePercentage,
        avgResponseTimeMs,
        avgUptime1d,
        avgUptime30d,
        avgUptime365d,
        downMonitors: metrics.downMonitors || [],
        availabilityPressure,
        lowNoiseShare,
        dominantState,
        historyRangeLabel: getHistoryRangeLabel(rangePreset, customFrom, customTo),
        trendIsProjected,
        trendLabel: trendIsProjected ? 'Historial parcial del periodo' : 'Serie historica real del periodo',
        dataFreshnessLabel: formatDateTime(metrics.lastSync),
        distribution,
        trendData,
        summaryCards: [
            {
                title: 'Cobertura monitoreada',
                value: monitored.toLocaleString(),
                subtitle: 'Servicios visibles en el rango seleccionado',
                accentClass: 'text-cyan-300',
                glowClass: 'from-cyan-500/12 via-transparent to-transparent'
            },
            {
                title: 'Disponibilidad actual',
                value: `${uptimePercentage.toFixed(2)}%`,
                subtitle: 'Lectura del ultimo corte disponible',
                accentClass: 'text-emerald-300',
                glowClass: 'from-emerald-500/12 via-transparent to-transparent'
            },
            {
                title: 'Monitores afectados',
                value: down.toLocaleString(),
                subtitle: 'Elementos en DOWN reportados por la fuente',
                accentClass: 'text-red-300',
                glowClass: 'from-red-500/12 via-transparent to-transparent'
            },
            {
                title: 'Presion operativa',
                value: `${availabilityPressure}%`,
                subtitle: 'Porcentaje del inventario con afectacion activa',
                accentClass: 'text-violet-300',
                glowClass: 'from-violet-500/12 via-transparent to-transparent'
            }
        ],
        topServices,
        mostCriticalService,
        affectedMonitors,
        impactByCategory,
        impactBySite,
        healthState,
        recentIncidents,
        snapshots,
        scanRows
    };
};
