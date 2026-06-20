import { describe, expect, it } from 'vitest';
import { createWazuhMetricsFixture, wazuhMetricsFixture } from '../../../../test/fixtures/wazuh';
import { buildWazuhDashboardModel, getWazuhSeverityMeta } from './utils';

describe('buildWazuhDashboardModel', () => {
    it('creates a predictable dashboard model from normalized Wazuh metrics', () => {
        const model = buildWazuhDashboardModel(wazuhMetricsFixture);

        expect(model.hero.totalEvents).toBe(32);
        expect(model.hero.latestCutEvents).toBe(15);
        expect(model.hero.criticalPressurePct).toBe(25);
        expect(model.snapshot.topRules[0]).toEqual(expect.objectContaining({ name: 'Authentication failure', count: 9 }));
        expect(model.historical.cutRows).toHaveLength(3);
        expect(model.dominantHistoricalSeverity?.key).toBe('medium');
        expect(model.summaryCards).toEqual([
            expect.objectContaining({ title: 'Eventos totales', value: '32' }),
            expect.objectContaining({ title: 'Critico + Alto %', value: '25%' }),
            expect.objectContaining({ title: 'Promedio por corte' }),
            expect.objectContaining({ title: 'Pico por corte' })
        ]);
    });

    it('maps severities to stable visual metadata', () => {
        expect(getWazuhSeverityMeta('critical')).toEqual(
            expect.objectContaining({
                key: 'critical',
                label: 'Critico'
            })
        );
        expect(getWazuhSeverityMeta('unknown')).toEqual(
            expect.objectContaining({
                label: 'Info'
            })
        );
    });

    it('falls back to historical cuts when analytics trend is empty', () => {
        const metrics = createWazuhMetricsFixture({
            trend7Days: [],
            analytics: {
                ...wazuhMetricsFixture.analytics!,
                trend: []
            }
        });

        const model = buildWazuhDashboardModel(metrics, 'custom', '2026-04-08', '2026-04-10');

        expect(model.analytics.trend).toEqual([
            expect.objectContaining({ date: '2026-04-08', total: 11 }),
            expect.objectContaining({ date: '2026-04-09', total: 13 }),
            expect.objectContaining({ date: '2026-04-10', total: 15 })
        ]);
    });
});
