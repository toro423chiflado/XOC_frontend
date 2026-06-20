export interface InsightvmSeverityDatum {
    key: 'critical' | 'high' | 'medium' | 'low' | 'info';
    label: string;
    value: number;
    color: string;
    textClass: string;
    softClass: string;
    badgeClass: string;
}

export interface InsightvmSummaryCard {
    title: string;
    value: string;
    subtitle: string;
    accentClass: string;
    glowClass: string;
}

export interface InsightvmTrendDatum {
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
}

export interface InsightvmCutDatum {
    label: string;
    total: number;
    fullLabel: string;
    tickLabel: string;
}

export interface InsightvmScanRow {
    id: string;
    target: string;
    status: string;
    createdAt?: string;
    totalFindings: number;
    cvssMax?: number;
}

export interface InsightvmDashboardModel {
    totalVulnerabilities: number;
    hostsScanned: number;
    scansCompleted: number;
    avgRiskPerHost: number;
    lastUpdateLabel: string;
    severityDistribution: InsightvmSeverityDatum[];
    trendData: InsightvmTrendDatum[];
    trendIsProjected: boolean;
    cutVolume: InsightvmCutDatum[];
    summaryCards: InsightvmSummaryCard[];
    dominantSeverity?: InsightvmSeverityDatum;
    criticalPressure: number;
    scanRows: InsightvmScanRow[];
    topCVEs: Array<{ cve: string; severity: string; count: number; cvss: number; impactScore: number }>;
    recentFindings: Array<{ id: string; name: string; severity: string; host: string; cve?: string; cvss?: number; detected_at?: string }>;
    mostCriticalHost?: { host: string; criticalCount: number };
    hostCoverage: number;
}
