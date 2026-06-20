import { describe, expect, it } from 'vitest';
import {
    createZabbixConfiguredMetricsFixture,
    zabbixConfiguredMetricsFixture
} from '../../../../test/fixtures/zabbix';
import {
    buildZabbixDashboardModel,
    formatZabbixDate,
    getZabbixSeverityKey,
    getZabbixSeverityLabel
} from './utils';

describe('buildZabbixDashboardModel', () => {
    it('builds the Zabbix dashboard view model from configured metrics', () => {
        const model = buildZabbixDashboardModel(zabbixConfiguredMetricsFixture);

        expect(model.totalHosts).toBe(4);
        expect(model.alertsActive).toBe(5);
        expect(model.avgAlertsPerHost).toBe(1.25);
        expect(model.avgCvss).toBe(6.9);
        expect(model.onlineHosts).toBe(2);
        expect(model.offlineHosts).toBe(1);
        expect(model.availabilityRate).toBe(50);
        expect(model.statusLabel).toBe('Mixta');
        expect(model.criticalPressure).toBe(40);
        expect(model.dominantSeverity?.key).toBe('critical');

        expect(model.summaryCards).toEqual([
            expect.objectContaining({ title: 'Hosts monitoreados', value: '4' }),
            expect.objectContaining({ title: 'Alertas activas', value: '5' }),
            expect.objectContaining({ title: 'Eventos por host', value: '1.3' }),
            expect.objectContaining({ title: 'CVSS promedio', value: '6.9' })
        ]);

        expect(model.hostRows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: 'zbx-app-01', statusLabel: 'ONLINE' }),
                expect.objectContaining({ name: 'zbx-edge-01', statusLabel: 'OFFLINE' }),
                expect.objectContaining({ name: 'zbx-batch-01', statusLabel: 'DETECTADO' })
            ])
        );

        expect(model.recentAlerts[0]).toMatchObject({
            id: 'zb-alert-01',
            description: 'CPU saturation over threshold',
            severityKey: 'critical',
            severityLabel: 'Desastre'
        });
    });

    it('falls back to derived alert averages when summary metrics are missing', () => {
        const metrics = createZabbixConfiguredMetricsFixture({
            summary: {
                alerts: 5,
                hosts: 4,
                avgCpu: 0,
                avgRam: 0
            }
        });

        const model = buildZabbixDashboardModel(metrics);

        expect(model.avgAlertsPerHost).toBe(1.25);
        expect(model.avgCvss).toBeCloseTo(5.58, 2);
    });
});

describe('Zabbix helpers', () => {
    it('maps priorities to stable severity buckets and labels', () => {
        expect(getZabbixSeverityKey('5')).toBe('critical');
        expect(getZabbixSeverityKey('high')).toBe('high');
        expect(getZabbixSeverityKey('average')).toBe('medium');
        expect(getZabbixSeverityKey('warning')).toBe('low');
        expect(getZabbixSeverityKey('0')).toBe('info');

        expect(getZabbixSeverityLabel('5')).toBe('Desastre');
        expect(getZabbixSeverityLabel('4')).toBe('Alta');
        expect(getZabbixSeverityLabel('3')).toBe('Media');
        expect(getZabbixSeverityLabel('2')).toBe('Baja');
        expect(getZabbixSeverityLabel('0')).toBe('Info');
    });

    it('formats missing or invalid dates with a safe placeholder', () => {
        expect(formatZabbixDate()).toBe('—');
        expect(formatZabbixDate('invalid-date')).toBe('—');
        expect(formatZabbixDate(zabbixConfiguredMetricsFixture.agentInfo?.lastUsed)).not.toBe('—');
    });
});
