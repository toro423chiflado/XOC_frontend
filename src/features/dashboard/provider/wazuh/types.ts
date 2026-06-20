import type {
    WazuhAnalyticsSummary,
    WazuhCutRow,
    WazuhIntegrationStatus,
    WazuhSeverityKey,
    WazuhSnapshotSummary
} from '../../../../services/provider.service';

export interface WazuhSeverityDatum {
    key: WazuhSeverityKey;
    label: string;
    value: number;
    color: string;
    textClass: string;
    softClass: string;
}

export interface WazuhMetricCard {
    title: string;
    value: string;
    subtitle: string;
    accentClass: string;
    glowClass: string;
}

export interface WazuhTrendDatum {
    date: string;
    label: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
}

export interface WazuhCutVolumeDatum {
    id: string;
    label: string;
    tickLabel: string;
    fullLabel: string;
    scannedAt?: string | null;
    total: number;
}

export interface WazuhSnapshotListItem {
    name: string;
    count: number;
    sharePct: number;
}

export interface WazuhDashboardModel {
    rangeLabel: string;
    integrationStatus: WazuhIntegrationStatus & {
        managerStatusLabel: string;
        lastSyncLabel: string;
        agentNameLabel: string;
    };
    hero: {
        totalEvents: number;
        criticalPressurePct: number;
        latestCutLabel: string;
        latestCutEvents: number;
        dominantRuleName: string;
        dominantRuleCount: number;
    };
    summaryCards: WazuhMetricCard[];
    historical: {
        totalScans: number;
        totalEvents: number;
        avgEventsPerCut: number;
        peakCutEvents: number;
        medianEventsPerCut: number;
        scanCadenceMinutesMedian: number | null;
        criticalPressurePct: number;
        noiseSharePct: number;
        severityDistribution: WazuhSeverityDatum[];
        cutRows: WazuhCutRow[];
        cutVolume: WazuhCutVolumeDatum[];
        latestComparison?: {
            latestLabel: string;
            previousLabel: string;
            latestTotal: number;
            previousTotal: number;
            deltaEvents: number;
            deltaPct: number | null;
            criticalHighDelta: number;
            latestDominantSeverity: string;
            previousDominantSeverity: string;
        };
    };
    snapshot: WazuhSnapshotSummary & {
        scannedAtLabel: string;
        windowLabel: string;
        severityDistribution: WazuhSeverityDatum[];
        topRules: WazuhSnapshotListItem[];
        topAgents: WazuhSnapshotListItem[];
    };
    analytics: Omit<WazuhAnalyticsSummary, 'trend' | 'recentEvents'> & {
        trend: WazuhTrendDatum[];
        recentEvents: Array<WazuhAnalyticsSummary['recentEvents'][number] & { detectedAtLabel: string }>;
    };
    dominantHistoricalSeverity?: WazuhSeverityDatum;
}

export interface WazuhScanDetailModel {
    scanId: string;
    scanName: string;
    scannedAtLabel: string;
    agentName: string;
    sendReason: string;
    snapshotMode: string;
    windowLabel: string;
    severityDistribution: WazuhSeverityDatum[];
    totalEvents: number;
    criticalPressurePct: number;
    impactedAgents: number;
    uniqueRules: number;
    findings: Array<{
        id: string;
        name: string;
        description: string;
        severity: string;
        host: string;
        reference: string;
        detectedAt?: string;
    }>;
    topRules: WazuhSnapshotListItem[];
    topAgents: WazuhSnapshotListItem[];
}
