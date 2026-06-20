import { describe, expect, it } from 'vitest';
import {
    createInsightvmAnalyticsFixture,
    createInsightvmMetricsFixture,
    insightvmAnalyticsFixture,
    insightvmMetricsFixture
} from '../../../../test/fixtures/insightvm';
import {
    buildInsightvmDashboardModel,
    formatInsightvmDate,
    getInsightvmSeverityKey,
    getInsightvmSeverityMeta
} from './utils';

describe('buildInsightvmDashboardModel', () => {
    it('builds the InsightVM dashboard view model from metrics and analytics', () => {
        const model = buildInsightvmDashboardModel(insightvmMetricsFixture, insightvmAnalyticsFixture);

        expect(model.totalVulnerabilities).toBe(25);
        expect(model.criticalPressure).toBe(32);
        expect(model.hostCoverage).toBe(6);
        expect(model.avgRiskPerHost).toBe(6.25);
        expect(model.dominantSeverity?.key).toBe('medium');

        expect(model.summaryCards).toEqual([
            expect.objectContaining({ title: 'Total vulnerabilidades', value: '25' }),
            expect.objectContaining({ title: 'Riesgo severo', value: '8' }),
            expect.objectContaining({ title: 'Activos cubiertos', value: '4' }),
            expect.objectContaining({ title: 'Escaneos', value: '3' })
        ]);

        expect(model.severityDistribution.map((item) => ({ key: item.key, value: item.value }))).toEqual([
            { key: 'critical', value: 3 },
            { key: 'high', value: 5 },
            { key: 'medium', value: 9 },
            { key: 'low', value: 6 },
            { key: 'info', value: 2 }
        ]);

        expect(model.topCVEs[0]).toMatchObject({
            cve: 'CVE-2024-3094',
            severity: 'critical',
            count: 4,
            cvss: 10,
            impactScore: 40
        });
        expect(model.topCVEs[1]).toMatchObject({
            cve: 'CVE-2024-6387',
            count: 3,
            impactScore: 29
        });

        expect(model.recentFindings).toEqual([
            expect.objectContaining({
                id: 'finding-001',
                name: 'OpenSSH username enumeration',
                severity: 'high',
                host: 'srv-web-01'
            }),
            expect.objectContaining({
                id: 'finding-002',
                severity: 'critical',
                cve: 'CVE-2024-3094'
            }),
            expect.objectContaining({
                id: 'finding-003',
                host: 'edge-gateway-02'
            })
        ]);

        expect(model.scanRows).toEqual([
            expect.objectContaining({ id: 'insightvm-scan-003', target: 'srv-db-01', totalFindings: 6 }),
            expect.objectContaining({ id: 'insightvm-scan-002', target: 'srv-web-01', totalFindings: 4 }),
            expect.objectContaining({ id: 'insightvm-scan-001', target: 'endpoint-finance-07', totalFindings: 3 })
        ]);
    });

    it('falls back to raw metrics when analytics is not available', () => {
        const metrics = createInsightvmMetricsFixture({
            hostsScanned: 5,
            topCVEs: [{ cve: 'CVE-2024-9999', severity: 'high', count: 2 }]
        });

        const model = buildInsightvmDashboardModel(metrics, null);

        expect(model.hostCoverage).toBe(5);
        expect(model.avgRiskPerHost).toBe(5);
        expect(model.topCVEs).toEqual([
            expect.objectContaining({
                cve: 'CVE-2024-9999',
                severity: 'high',
                count: 2,
                impactScore: 2
            })
        ]);
        expect(model.recentFindings).toEqual([]);
    });

    it('does not fabricate projected trend points when history is insufficient', () => {
        const analytics = createInsightvmAnalyticsFixture({
            trend_7_days: [
                { date: '2026-04-10', critical: 1, high: 2, medium: 3, low: 0, info: 0 }
            ]
        });

        const model = buildInsightvmDashboardModel(insightvmMetricsFixture, analytics);

        expect(model.trendIsProjected).toBe(true);
        expect(model.trendData).toEqual([
            expect.objectContaining({ date: expect.any(String), critical: 1, high: 2, medium: 3, low: 0, info: 0, total: 6 })
        ]);
    });
});

describe('InsightVM helpers', () => {
    it('normalizes severities into the expected buckets', () => {
        expect(getInsightvmSeverityKey('Critical Risk')).toBe('critical');
        expect(getInsightvmSeverityKey('HIGH')).toBe('high');
        expect(getInsightvmSeverityKey('Medium')).toBe('medium');
        expect(getInsightvmSeverityKey('low')).toBe('low');
        expect(getInsightvmSeverityKey('unknown')).toBe('info');

        expect(getInsightvmSeverityMeta('critical')).toEqual(
            expect.objectContaining({
                key: 'critical',
                label: 'Critico'
            })
        );
        expect(getInsightvmSeverityMeta('unexpected')).toEqual(
            expect.objectContaining({
                key: 'info',
                label: 'Info'
            })
        );
    });

    it('formats missing or invalid dates with a safe placeholder', () => {
        expect(formatInsightvmDate()).toBe('—');
        expect(formatInsightvmDate('not-a-date')).toBe('—');
        expect(formatInsightvmDate(createInsightvmAnalyticsFixture().recentFindings[0].detected_at)).not.toBe('—');
    });
});
