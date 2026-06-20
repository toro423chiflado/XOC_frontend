import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UptimeMetrics } from '../../../../services/provider.service';
import { buildUptimeDashboardModel } from './utils';

describe('buildUptimeDashboardModel', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('anchors preset trend ranges to backend data instead of the device clock', () => {
        vi.setSystemTime(new Date('2026-05-25T12:00:00.000Z'));

        const metrics: UptimeMetrics = {
            servicesMonitored: 120,
            servicesUp: 112,
            servicesDown: 8,
            uptimePercentage: 93.33,
            recentDowntime: [],
            trend7Days: [
                { date: '2026-06-12', uptime: 100, down: 0 },
                { date: '2026-06-13', uptime: 93.33, down: 8 }
            ],
            lastSync: '2026-06-16T09:30:00.000Z'
        };

        const model = buildUptimeDashboardModel(metrics, '7d', '', '');

        expect(model.trendData).toHaveLength(7);
        expect(model.trendData.map((item) => item.down)).toEqual([0, 0, 0, 8, 0, 0, 0]);
        expect(model.trendLabel).toBe('Serie historica real del periodo');
    });
});
