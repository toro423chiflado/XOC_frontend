export type SeverityKey = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface OpenvasSeverityDatum {
    key: SeverityKey;
    label: string;
    shortLabel: string;
    value: number;
    color: string;
    textClass: string;
    softClass: string;
    badgeClass: string;
}

export interface OpenvasTrendDatum {
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
}

export interface OpenvasFindingItem {
    id: string;
    name: string;
    severity: SeverityKey;
    host: string;
    cve?: string;
    cvss?: number;
    detectedAt?: string;
}

export interface OpenvasHostItem {
    host: string;
    totalFindings: number;
    weightedRisk: number;
    maxCvss: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    hasSeverityBreakdown: boolean;
    lastSeen?: string;
    scanId?: string;
    topFindings: OpenvasFindingItem[];
}

export interface OpenvasScanRow {
    id: string;
    target: string;
    status: string;
    createdAt?: string;
    findings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    weightedRisk: number;
    hasSeverityBreakdown: boolean;
}

export interface OpenvasTopCveItem {
    cve: string;
    severity: SeverityKey;
    hostsAffected: number;
    cvss: number;
    impactScore: number;
}

export interface OpenvasSummaryCard {
    title: string;
    value: string;
    subtitle: string;
    accentClass: string;
    glowClass: string;
}

export interface OpenvasPriorityBucket {
    title: string;
    value: number;
    description: string;
    accentClass: string;
}

export interface OpenvasCutVolumeDatum {
    id: string;
    label: string;
    fullLabel: string;
    tickLabel: string;
    total: number;
}

export interface OpenvasDashboardModel {
    totalVulnerabilities: number;
    totalHosts: number;
    scansCompleted: number;
    riskScore: number;
    riskLevel: string;
    riskNarrative: string;
    trendDelta: number | null;
    severityDistribution: OpenvasSeverityDatum[];
    trendData: OpenvasTrendDatum[];
    cutVolume: OpenvasCutVolumeDatum[];
    recentFindings: OpenvasFindingItem[];
    hostExposure: OpenvasHostItem[];
    topCVEs: OpenvasTopCveItem[];
    scanRows: OpenvasScanRow[];
    summaryCards: OpenvasSummaryCard[];
    priorityBuckets: OpenvasPriorityBucket[];
    insights: string[];
    latestActivity?: string;
}
