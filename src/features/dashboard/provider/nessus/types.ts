export type NessusSeverityKey = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface NessusSeverityDatum {
    key: NessusSeverityKey;
    label: string;
    value: number;
    color: string;
    textClass: string;
    softClass: string;
}

export interface NessusTrendDatum {
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
}

export interface NessusSummaryCard {
    title: string;
    value: string;
    subtitle: string;
    accentClass: string;
    glowClass: string;
    iconKey?: string;
}

export interface NessusCutDatum {
    label: string;
    total: number;
    fullLabel: string;
    tickLabel: string;
}

export interface NessusScanRow {
    id: string;
    target: string;
    status: string;
    createdAt: string;
    totalFindings: number;
    cvssMax?: number;
}

export interface NessusDashboardModel {
    totalFindings: number;
    criticalPressure: number;
    lowNoiseShare: number;
    dominantSeverity: NessusSeverityDatum;
    severityDistribution: NessusSeverityDatum[];
    trendData: NessusTrendDatum[];
    cutVolume: NessusCutDatum[];
    historyRangeLabel: string;
    trendIsProjected: boolean;
    summaryCards: NessusSummaryCard[];
    scanRows: NessusScanRow[];
    scansCompleted: number;
    hostsScanned: number;
}
