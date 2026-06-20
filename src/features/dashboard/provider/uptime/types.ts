export type UptimeDistributionKey = 'up' | 'down' | 'other';

export interface UptimeDistributionDatum {
    key: UptimeDistributionKey;
    label: string;
    value: number;
    color: string;
    textClass: string;
    softClass: string;
}

export interface UptimeTrendDatum {
    date: string;
    uptime: number;
    down: number;
}

export interface UptimeSummaryCard {
    title: string;
    value: string;
    subtitle: string;
    accentClass: string;
    glowClass: string;
    iconKey?: string;
}

export interface UptimeServiceRule {
    service: string;
    count: number;
}

export interface UptimeAffectedMonitor {
    id: string;
    name: string;
    category: string;
    site: string;
    severityLabel: string;
    severityTone: 'critical' | 'warning' | 'stable';
    sinceLabel: string;
}

export interface UptimeImpactGroup {
    key: string;
    label: string;
    count: number;
    monitors: string[];
}

export interface UptimeHealthState {
    label: string;
    tone: 'critical' | 'warning' | 'stable';
    summary: string;
}

export interface UptimeRecentIncident {
    id: string;
    service: string;
    duration: string;
    timestamp: string;
}

export interface UptimeSnapshot {
    id: string;
    label: string;
    uptime: number;
    down: number;
    status: 'stable' | 'warning' | 'critical';
}

export interface UptimeScanRow {
    id: string;
    target: string;
    status: 'completed' | 'failed' | 'running';
    createdAt: string;
    monitored: number;
    up: number;
    down: number;
    uptime: number;
}

export interface UptimeDashboardModel {
    servicesMonitored: number;
    servicesUp: number;
    servicesDown: number;
    uptimePercentage: number;
    avgResponseTimeMs: number;
    avgUptime1d: number;
    avgUptime30d: number;
    avgUptime365d: number;
    downMonitors: string[];
    availabilityPressure: number;
    lowNoiseShare: number;
    dominantState: UptimeDistributionDatum;
    historyRangeLabel: string;
    trendIsProjected: boolean;
    trendLabel: string;
    dataFreshnessLabel: string;
    distribution: UptimeDistributionDatum[];
    trendData: UptimeTrendDatum[];
    summaryCards: UptimeSummaryCard[];
    topServices: UptimeServiceRule[];
    mostCriticalService: UptimeServiceRule | null;
    affectedMonitors: UptimeAffectedMonitor[];
    impactByCategory: UptimeImpactGroup[];
    impactBySite: UptimeImpactGroup[];
    healthState: UptimeHealthState;
    recentIncidents: UptimeRecentIncident[];
    snapshots: UptimeSnapshot[];
    scanRows: UptimeScanRow[];
}
