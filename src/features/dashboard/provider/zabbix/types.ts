export interface ZabbixSeverityDatum {
    key: 'critical' | 'high' | 'medium' | 'low' | 'info';
    label: string;
    value: number;
    color: string;
    textClass: string;
    softClass: string;
    badgeClass: string;
}

export interface ZabbixSummaryCard {
    title: string;
    value: string;
    subtitle: string;
    accentClass: string;
    glowClass: string;
}

export interface ZabbixHostRow {
    id: string;
    name: string;
    status: string;
    statusLabel: string;
    isOnline: boolean;
    isOffline: boolean;
    metaLabel: string;
}

export interface ZabbixRecentAlertItem {
    id: string;
    description: string;
    host: string;
    priority: string;
    severityKey: 'critical' | 'high' | 'medium' | 'low' | 'info';
    severityLabel: string;
}

export interface ZabbixHealthState {
    label: string;
    tone: 'critical' | 'warning' | 'stable';
    summary: string;
}

export interface ZabbixMetaFact {
    label: string;
    value: string;
    helper: string;
}

export interface ZabbixSnapshotTrendDatum {
    date: string;
    hosts: number;
    problems: number;
    events: number;
    triggers: number;
}

export interface ZabbixDashboardModel {
    totalHosts: number;
    alertsActive: number;
    avgAlertsPerHost: number;
    avgCvss: number;
    onlineHosts: number;
    offlineHosts: number;
    availabilityRate: number | null;
    statusLabel: string;
    lastUsedLabel: string;
    severityDistribution: ZabbixSeverityDatum[];
    summaryCards: ZabbixSummaryCard[];
    hostRows: ZabbixHostRow[];
    recentAlerts: ZabbixRecentAlertItem[];
    availabilityIndicator: {
        label: string;
        value: string;
        helper: string;
    };
    hostStateDistribution: Array<{
        key: 'online' | 'offline' | 'detected';
        label: string;
        value: number;
        color: string;
    }>;
    dominantSeverity?: ZabbixSeverityDatum;
    criticalPressure: number;
    problemCount: number;
    eventCount: number;
    triggerCount: number;
    triggerDensity: number;
    healthState: ZabbixHealthState;
    trendData: ZabbixSnapshotTrendDatum[];
    trendLabel: string;
    dataFreshnessLabel: string;
    snapshotFacts: ZabbixMetaFact[];
    snapshotChanged: boolean;
    sendReasonLabel: string;
}
