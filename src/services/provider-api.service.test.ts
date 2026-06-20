import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInsightvmRawScansResponseFixture } from '../test/fixtures/insightvm';

vi.mock('../lib/axios', () => ({
    api: {
        get: vi.fn()
    }
}));

import { api } from '../lib/axios';
import { providerApiService } from './provider-api.service';

describe('providerApiService.getInsightvmMetrics', () => {
    const apiGetMock = vi.mocked(api.get);

    beforeEach(() => {
        apiGetMock.mockReset();
    });

    it('requests InsightVM historical scans and normalizes the response into dashboard metrics', async () => {
        apiGetMock.mockResolvedValueOnce({
            data: createInsightvmRawScansResponseFixture()
        });

        const metrics = await providerApiService.getInsightvmMetrics();

        expect(apiGetMock).toHaveBeenCalledWith('/api/scans', {
            params: {
                scanner_type: 'insightvm',
                days: 30,
                limit: 100
            }
        });

        expect(metrics).toMatchObject({
            vulnerabilities: {
                critical: 3,
                high: 5,
                medium: 7,
                low: 4,
                info: 1
            },
            scansCompleted: 3,
            hostsScanned: 2,
            topCVEs: [],
            lastUpdate: '2026-04-09T18:00:00.000Z'
        });

        expect(metrics.trend_7_days).toEqual([
            { date: '2026-04-08', critical: 1, high: 2, medium: 4, low: 1, info: 0 },
            { date: '2026-04-09', critical: 2, high: 3, medium: 3, low: 3, info: 1 }
        ]);

        expect(metrics.scanDetails).toHaveLength(3);
        expect(metrics.scanDetails?.[0]).toMatchObject({
            id: 'raw-insightvm-001',
            target: 'srv-web-01',
            status: 'completed',
            total_findings: 8
        });
    });

    it('requests InsightVM analytics using the same scanner type namespace', async () => {
        apiGetMock.mockResolvedValueOnce({ data: { ok: true } });

        await providerApiService.getInsightvmAnalytics({ preset: '30d' });

        expect(apiGetMock).toHaveBeenCalledWith('/api/scans/insightvm/analytics', {
            params: {
                days: 30
            }
        });
    });

    it('returns a safe empty shape when the backend has no InsightVM scans yet', async () => {
        apiGetMock.mockResolvedValueOnce({
            data: {
                scans: []
            }
        });

        const metrics = await providerApiService.getInsightvmMetrics();

        expect(metrics.vulnerabilities).toEqual({
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0
        });
        expect(metrics.scansCompleted).toBe(0);
        expect(metrics.hostsScanned).toBe(0);
        expect(metrics.topCVEs).toEqual([]);
        expect(metrics.trend_7_days).toEqual([]);
        expect(metrics.scanDetails).toEqual([]);
    });
});

describe('providerApiService.getWazuhMetrics', () => {
    const apiGetMock = vi.mocked(api.get);

    beforeEach(() => {
        apiGetMock.mockReset();
    });

    it('normalizes historical cuts, severity totals and snapshot data for Wazuh', async () => {
        apiGetMock
            .mockResolvedValueOnce({
                data: {
                    trend_7_days: [
                        { date: '2026-06-04', critical: 0, high: 0, medium: 1208, low: 0, info: 0 }
                    ],
                    hostDistribution: {
                        totalUniqueHosts: 2,
                        avgVulnerabilitiesPerHost: 604
                    }
                }
            })
            .mockResolvedValueOnce({
                data: {
                    current_state_totals: {
                        total_hosts: 2,
                        critical: 0,
                        high: 0,
                        medium: 16,
                        low: 0,
                        info: 6
                    },
                    scans: [
                        {
                            id: 'scan-41',
                            scan_id: 'scan-41',
                            scan_name: 'Wazuh 41',
                            scanned_at: '2026-06-05T23:12:00.000Z',
                            status: 'completed',
                            critical_count: 0,
                            high_count: 0,
                            medium_count: 16,
                            low_count: 0,
                            info_count: 6,
                            agent_name: 'Wazuh MiFibra',
                            meta_info: {
                                send_reason: 'scheduled_snapshot',
                                snapshot_mode: 'deduplicated',
                                tops: {
                                    top_rules: [
                                        { rule: 'Auditd: Device enables promiscuous mode', count: 16 }
                                    ],
                                    top_agents: [
                                        { agent: 'MonEvent', count: 12 }
                                    ]
                                }
                            }
                        }
                    ]
                }
            })
            .mockResolvedValueOnce({
                data: {
                    count: 2,
                    scans: [
                        {
                            id: 'scan-41',
                            scan_id: 'scan-41',
                            scan_name: 'Wazuh 41',
                            scanned_at: '2026-06-05T23:12:00.000Z',
                            status: 'completed',
                            critical_count: 0,
                            high_count: 0,
                            medium_count: 16,
                            low_count: 0,
                            info_count: 6,
                            agent_name: 'Wazuh MiFibra',
                            meta_info: {
                                send_reason: 'scheduled_snapshot',
                                snapshot_mode: 'deduplicated',
                                tops: {
                                    top_rules: [
                                        { rule: 'Auditd: Device enables promiscuous mode', count: 16 }
                                    ],
                                    top_agents: [
                                        { agent: 'MonEvent', count: 12 }
                                    ]
                                }
                            }
                        },
                        {
                            id: 'scan-40',
                            scan_id: 'scan-40',
                            scan_name: 'Wazuh 40',
                            scanned_at: '2026-06-04T23:12:00.000Z',
                            status: 'completed',
                            critical_count: 0,
                            high_count: 0,
                            medium_count: 1208,
                            low_count: 0,
                            info_count: 0,
                            agent_name: 'Wazuh MiFibra',
                            meta_info: {
                                tops: {
                                    top_rules: [
                                        { rule: 'Palo Alto GlobalProtect - Usuario conectado exitosamente', count: 1208 }
                                    ],
                                    top_agents: [
                                        { agent: 'MonVulE', count: 1208 }
                                    ]
                                }
                            }
                        }
                    ]
                }
            })
            .mockResolvedValueOnce({
                data: {
                    findings: [
                        {
                            id: 'finding-1',
                            rule: { description: 'Auditd: Device enables promiscuous mode' },
                            agent: { name: 'MonEvent' },
                            severity: 'medium',
                            created_at: '2026-06-05T23:10:00.000Z'
                        }
                    ]
                }
            });

        const metrics = await providerApiService.getWazuhMetrics({ preset: '7d' });

        expect(metrics.alertsBySeverity).toEqual({
            critical: 0,
            high: 0,
            medium: 1224,
            low: 0,
            info: 6
        });
        expect(metrics.historical).toMatchObject({
            totalScans: 2,
            totalEvents: 1230,
            peakCutEvents: 1208,
            cuts: [
                expect.objectContaining({ id: 'scan-41', totalEvents: 22, topRule: 'Auditd: Device enables promiscuous mode' }),
                expect.objectContaining({ id: 'scan-40', totalEvents: 1208 })
            ]
        });
        expect(metrics.snapshot).toMatchObject({
            scanSummaryId: 'scan-41',
            totalEvents: 22,
            dominantSeverity: 'medium',
            topRules: [
                expect.objectContaining({ name: 'Auditd: Device enables promiscuous mode', count: 16 })
            ]
        });
        expect(metrics.analytics?.trend).toEqual([
            { date: '2026-06-04', critical: 0, high: 0, medium: 1208, low: 0, info: 0, total: 1208 }
        ]);
    });

    it('does not inject the global latest scan into historical cuts when the selected range has no scans', async () => {
        apiGetMock
            .mockResolvedValueOnce({
                data: {
                    trend_7_days: [],
                    hostDistribution: {
                        totalUniqueHosts: 2,
                        avgVulnerabilitiesPerHost: 11
                    }
                }
            })
            .mockResolvedValueOnce({
                data: {
                    current_state_totals: {
                        total_hosts: 2,
                        critical: 0,
                        high: 0,
                        medium: 22,
                        low: 0,
                        info: 0
                    },
                    scans: [
                        {
                            id: 'scan-latest',
                            scan_id: 'scan-latest',
                            scan_name: 'Wazuh latest',
                            scanned_at: '2026-06-05T23:12:00.000Z',
                            status: 'completed',
                            critical_count: 0,
                            high_count: 0,
                            medium_count: 22,
                            low_count: 0,
                            info_count: 0,
                            agent_name: 'Wazuh MiFibra'
                        }
                    ]
                }
            })
            .mockResolvedValueOnce({
                data: {
                    count: 0,
                    scans: []
                }
            })
            .mockResolvedValueOnce({
                data: {
                    findings: []
                }
            });

        const metrics = await providerApiService.getWazuhMetrics({ preset: '7d' });

        expect(metrics.snapshot?.totalEvents).toBe(22);
        expect(metrics.historical).toMatchObject({
            totalScans: 0,
            totalEvents: 0,
            cuts: []
        });
        expect(metrics.scanDetails).toEqual([]);
        expect(metrics.analytics?.trend.every((day) => day.total === 0)).toBe(true);
    });
});
