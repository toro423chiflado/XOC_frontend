import type { WazuhMetrics } from '../../services/provider.service';
import { cloneFixture } from './helpers';

const wazuhMetricsBase: WazuhMetrics = {
    activeAgents: 8,
    inactiveAgents: 1,
    topRules: [
        { rule: 'Authentication failure', count: 9 },
        { rule: 'Suspicious process spawned', count: 6 }
    ],
    alertsBySeverity: {
        critical: 3,
        high: 5,
        medium: 12,
        low: 8,
        info: 4
    },
    configured: true,
    status: 'Operativo',
    message: 'Sincronizacion estable con el ultimo scan procesado.',
    hostsReported: 6,
    avgFindingsPerHost: 4.7,
    mostCriticalHost: {
        host: 'wazuh-agent-db-01',
        criticalCount: 2
    },
    lastSync: '2026-04-10T08:00:00.000Z',
    agentInfo: {
        name: 'Wazuh Manager Lima',
        lastUsed: '2026-04-10T08:00:00.000Z'
    },
    trend7Days: [
        { date: '2026-04-08', critical: 1, high: 2, medium: 4, low: 3, info: 1 },
        { date: '2026-04-09', critical: 2, high: 3, medium: 5, low: 2, info: 1 },
        { date: '2026-04-10', critical: 3, high: 5, medium: 12, low: 8, info: 2 }
    ],
    recentFindings: [
        { id: 'wazuh-f-1', name: 'Multiple failed logins detected', severity: 'high', host: 'wazuh-agent-app-01', detectedAt: '2026-04-10T07:55:00.000Z' },
        { id: 'wazuh-f-2', name: 'Privilege escalation attempt', severity: 'critical', host: 'wazuh-agent-db-01', detectedAt: '2026-04-10T07:50:00.000Z' }
    ],
    scanDetails: [
        { id: 'wazuh-scan-003', target: 'Snapshot 2026-04-10', status: 'completed', created_at: '2026-04-10T08:00:00.000Z', total_findings: 15 },
        { id: 'wazuh-scan-002', target: 'Snapshot 2026-04-09', status: 'completed', created_at: '2026-04-09T08:00:00.000Z', total_findings: 13 },
        { id: 'wazuh-scan-001', target: 'Snapshot 2026-04-08', status: 'completed', created_at: '2026-04-08T08:00:00.000Z', total_findings: 11 }
    ],
    currentSnapshot: {
        scanId: 'wazuh-scan-003',
        scannedAt: '2026-04-10T08:00:00.000Z',
        totalAlerts: 15,
        alertsBySeverity: {
            critical: 2,
            high: 3,
            medium: 6,
            low: 3,
            info: 1
        }
    },
    historyRangeLabel: 'Ultimos 7 dias',
    range: {
        preset: '7d',
        from: null,
        to: null,
        days: 7,
        label: 'Ultimos 7 dias'
    },
    integrationStatus: {
        configured: true,
        managerStatus: 'Operativo',
        activeAgents: 8,
        inactiveAgents: 1,
        lastSync: '2026-04-10T08:00:00.000Z',
        agentName: 'Wazuh Manager Lima'
    },
    historical: {
        totalScans: 3,
        totalEvents: 32,
        severityTotals: {
            critical: 3,
            high: 5,
            medium: 12,
            low: 8,
            info: 4
        },
        criticalPressurePct: 25,
        noiseSharePct: 38,
        avgEventsPerCut: 10.7,
        peakCutEvents: 15,
        medianEventsPerCut: 13,
        scanCadenceMinutesMedian: 1440,
        cuts: [
            {
                id: 'wazuh-scan-003',
                scanId: 'wazuh-scan-003',
                scanName: 'Snapshot 2026-04-10',
                scannedAt: '2026-04-10T08:00:00.000Z',
                status: 'completed',
                agentName: 'MonEvent',
                totalEvents: 15,
                severityTotals: { critical: 2, high: 3, medium: 6, low: 3, info: 1 },
                topRule: 'Authentication failure',
                topAgent: 'MonEvent',
                sendReason: 'scheduled_snapshot',
                snapshotMode: 'deduplicated'
            },
            {
                id: 'wazuh-scan-002',
                scanId: 'wazuh-scan-002',
                scanName: 'Snapshot 2026-04-09',
                scannedAt: '2026-04-09T08:00:00.000Z',
                status: 'completed',
                agentName: 'MonVulE',
                totalEvents: 13,
                severityTotals: { critical: 1, high: 2, medium: 5, low: 3, info: 2 },
                topRule: 'Suspicious process spawned',
                topAgent: 'MonVulE',
                sendReason: 'scheduled_snapshot',
                snapshotMode: 'deduplicated'
            },
            {
                id: 'wazuh-scan-001',
                scanId: 'wazuh-scan-001',
                scanName: 'Snapshot 2026-04-08',
                scannedAt: '2026-04-08T08:00:00.000Z',
                status: 'completed',
                agentName: 'MonVulE',
                totalEvents: 11,
                severityTotals: { critical: 0, high: 0, medium: 4, low: 2, info: 5 },
                topRule: 'Auditd: Device enables promiscuous mode',
                topAgent: 'MonVulE',
                sendReason: 'scheduled_snapshot',
                snapshotMode: 'deduplicated'
            }
        ]
    },
    snapshot: {
        scanSummaryId: 'wazuh-scan-003',
        scanId: 'wazuh-scan-003',
        scanName: 'Snapshot 2026-04-10',
        agentName: 'MonEvent',
        scannedAt: '2026-04-10T08:00:00.000Z',
        windowStart: '2026-04-10T07:00:00.000Z',
        windowEnd: '2026-04-10T08:00:00.000Z',
        totalEvents: 15,
        severityTotals: {
            critical: 2,
            high: 3,
            medium: 6,
            low: 3,
            info: 1
        },
        dominantSeverity: 'medium',
        topRules: [
            { name: 'Authentication failure', count: 9, sharePct: 60 },
            { name: 'Suspicious process spawned', count: 4, sharePct: 27 }
        ],
        topAgents: [
            { name: 'MonEvent', count: 8, sharePct: 53 },
            { name: 'MonVulE', count: 4, sharePct: 27 }
        ],
        sendReason: 'scheduled_snapshot',
        snapshotMode: 'deduplicated'
    },
    analytics: {
        trend: [
            { date: '2026-04-08', critical: 1, high: 2, medium: 4, low: 3, info: 1, total: 11 },
            { date: '2026-04-09', critical: 2, high: 3, medium: 5, low: 2, info: 1, total: 13 },
            { date: '2026-04-10', critical: 3, high: 5, medium: 12, low: 8, info: 2, total: 30 }
        ],
        uniqueAgentsInRange: 6,
        avgEventsPerAgentInRange: 4.7,
        mostPressuredAgent: {
            name: 'wazuh-agent-db-01',
            criticalCount: 2
        },
        recentEvents: [
            { id: 'wazuh-f-1', name: 'Multiple failed logins detected', severity: 'high', host: 'wazuh-agent-app-01', detectedAt: '2026-04-10T07:55:00.000Z' },
            { id: 'wazuh-f-2', name: 'Privilege escalation attempt', severity: 'critical', host: 'wazuh-agent-db-01', detectedAt: '2026-04-10T07:50:00.000Z' }
        ]
    }
};

export const createWazuhMetricsFixture = (overrides: Partial<WazuhMetrics> = {}): WazuhMetrics => {
    const base = cloneFixture(wazuhMetricsBase);
    return {
        ...base,
        ...overrides,
        alertsBySeverity: {
            ...base.alertsBySeverity,
            ...overrides.alertsBySeverity
        },
        topRules: overrides.topRules ? cloneFixture(overrides.topRules) : base.topRules,
        trend7Days: overrides.trend7Days ? cloneFixture(overrides.trend7Days) : base.trend7Days,
        recentFindings: overrides.recentFindings ? cloneFixture(overrides.recentFindings) : base.recentFindings,
        scanDetails: overrides.scanDetails ? cloneFixture(overrides.scanDetails) : base.scanDetails,
        currentSnapshot: overrides.currentSnapshot
            ? {
                ...base.currentSnapshot,
                ...overrides.currentSnapshot,
                alertsBySeverity: {
                    ...base.currentSnapshot!.alertsBySeverity,
                    ...(overrides.currentSnapshot.alertsBySeverity || {})
                }
            }
            : base.currentSnapshot,
        range: overrides.range ? { ...base.range!, ...overrides.range } : base.range,
        integrationStatus: overrides.integrationStatus ? { ...base.integrationStatus!, ...overrides.integrationStatus } : base.integrationStatus,
        historical: overrides.historical
            ? {
                ...base.historical!,
                ...overrides.historical,
                severityTotals: {
                    ...base.historical!.severityTotals,
                    ...(overrides.historical.severityTotals || {})
                },
                cuts: overrides.historical.cuts ? cloneFixture(overrides.historical.cuts) : base.historical!.cuts
            }
            : base.historical,
        snapshot: overrides.snapshot
            ? {
                ...base.snapshot!,
                ...overrides.snapshot,
                severityTotals: {
                    ...base.snapshot!.severityTotals,
                    ...(overrides.snapshot.severityTotals || {})
                },
                topRules: overrides.snapshot.topRules ? cloneFixture(overrides.snapshot.topRules) : base.snapshot!.topRules,
                topAgents: overrides.snapshot.topAgents ? cloneFixture(overrides.snapshot.topAgents) : base.snapshot!.topAgents
            }
            : base.snapshot,
        analytics: overrides.analytics
            ? {
                ...base.analytics!,
                ...overrides.analytics,
                trend: overrides.analytics.trend ? cloneFixture(overrides.analytics.trend) : base.analytics!.trend,
                recentEvents: overrides.analytics.recentEvents ? cloneFixture(overrides.analytics.recentEvents) : base.analytics!.recentEvents
            }
            : base.analytics
    };
};

export const wazuhMetricsFixture = createWazuhMetricsFixture();
export const wazuhEmptyMetricsFixture = createWazuhMetricsFixture({
    activeAgents: 0,
    inactiveAgents: 0,
    topRules: [],
    alertsBySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
    },
    configured: false,
    status: 'Sin confirmar',
    message: 'No hay historicos disponibles de Wazuh.',
    hostsReported: 0,
    avgFindingsPerHost: 0,
    mostCriticalHost: undefined,
    recentFindings: [],
    scanDetails: [],
    currentSnapshot: {
        scanId: undefined,
        scannedAt: undefined,
        totalAlerts: 0,
        alertsBySeverity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
        }
    },
    integrationStatus: {
        configured: false,
        managerStatus: null,
        activeAgents: 0,
        inactiveAgents: 0,
        lastSync: null,
        agentName: null
    },
    historical: {
        totalScans: 0,
        totalEvents: 0,
        severityTotals: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        criticalPressurePct: 0,
        noiseSharePct: 0,
        avgEventsPerCut: 0,
        peakCutEvents: 0,
        medianEventsPerCut: 0,
        scanCadenceMinutesMedian: null,
        cuts: []
    },
    snapshot: {
        scanSummaryId: null,
        scanId: null,
        scanName: null,
        agentName: null,
        scannedAt: null,
        windowStart: null,
        windowEnd: null,
        totalEvents: 0,
        severityTotals: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        dominantSeverity: 'none',
        topRules: [],
        topAgents: [],
        sendReason: null,
        snapshotMode: null
    },
    analytics: {
        trend: [],
        uniqueAgentsInRange: 0,
        avgEventsPerAgentInRange: 0,
        mostPressuredAgent: undefined,
        recentEvents: []
    }
});
