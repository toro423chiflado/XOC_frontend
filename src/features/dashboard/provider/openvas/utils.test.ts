import { describe, expect, it } from 'vitest';
import { openvasAnalyticsFixture, openvasMetricsFixture } from '../../../../test/fixtures/openvas';
import { buildOpenvasDashboardModel, getSeverityMeta } from './utils';

describe('buildOpenvasDashboardModel', () => {
    it('builds a stable model for the OpenVAS dashboard from reusable fixtures', () => {
        const model = buildOpenvasDashboardModel(openvasMetricsFixture, openvasAnalyticsFixture);

        expect(model.totalVulnerabilities).toBe(16);
        expect(model.totalHosts).toBe(3);
        expect(model.scansCompleted).toBe(2);
        expect(model.riskScore).toBe(36);
        expect(model.riskLevel).toBe('Moderado');

        expect(model.topCVEs[0]).toMatchObject({
            cve: 'CVE-2024-30080',
            severity: 'critical',
            hostsAffected: 2,
            impactScore: 20
        });

        expect(model.hostExposure).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    host: 'db-core-01',
                    critical: 1
                }),
                expect.objectContaining({
                    host: 'web-core-01',
                    high: 1
                })
            ])
        );

        expect(model.summaryCards).toEqual([
            expect.objectContaining({ title: 'Exposicion total', value: '16' }),
            expect.objectContaining({ title: 'Riesgo critico + alto', value: '6' }),
            expect.objectContaining({ title: 'Activos con contexto', value: '3' }),
            expect.objectContaining({ title: 'Corridas historicas', value: '2' })
        ]);
    });

    it('returns the correct UI metadata for severity badges', () => {
        expect(getSeverityMeta('critical')).toEqual(
            expect.objectContaining({
                key: 'critical',
                label: 'Critico'
            })
        );
    });
});
