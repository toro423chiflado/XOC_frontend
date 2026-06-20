import type { ZabbixConfiguredMetrics, ZabbixFullMetrics } from '../../types/api';
import { cloneFixture } from './helpers';

const zabbixConfiguredMetricsBase: ZabbixConfiguredMetrics = {
    configured: true,
    summary: {
        alerts: 5,
        hosts: 4,
        avgCpu: 1.25,
        avgRam: 6.9
    },
    hosts: [
        { id: 'zb-host-01', name: 'zbx-app-01', status: 'online' },
        { id: 'zb-host-02', name: 'zbx-db-01', status: 'online' },
        { id: 'zb-host-03', name: 'zbx-edge-01', status: 'offline' },
        { id: 'zb-host-04', name: 'zbx-batch-01', status: 'unknown' }
    ],
    alerts: [
        { id: 'zb-alert-01', description: 'CPU saturation over threshold', priority: '5', host: 'zbx-app-01', cvss: 9.5, detectedAt: '2026-04-10T09:15:00.000Z' },
        { id: 'zb-alert-02', description: 'Memory pressure sustained', priority: '4', host: 'zbx-db-01', cvss: 8.1, detectedAt: '2026-04-10T09:00:00.000Z' },
        { id: 'zb-alert-03', description: 'Disk latency high', priority: '3', host: 'zbx-edge-01', cvss: 6.2, detectedAt: '2026-04-10T08:50:00.000Z' },
        { id: 'zb-alert-04', description: 'Package update pending', priority: '2', host: 'zbx-batch-01', cvss: 3.1, detectedAt: '2026-04-09T23:20:00.000Z' },
        { id: 'zb-alert-05', description: 'Informational inventory event', priority: '1', host: 'zbx-app-01', cvss: 1.0, detectedAt: '2026-04-09T22:15:00.000Z' }
    ],
    metrics: {
        cpu: 1.25,
        ram: 6.9,
        uptime: '14d 02h'
    },
    snapshotMeta: {
        summaryType: 'noc_health',
        scannedAt: '2026-04-10T09:20:00.000Z',
        collectedAt: '2026-04-10T09:20:00.000Z',
        hostCount: 4,
        problemCount: 2,
        eventCount: 3,
        triggerCount: 96,
        snapshotChanged: true,
        sendReason: 'snapshot_changed',
        snapshotMode: 'delta_with_periodic_forced',
        schemaVersion: '1.2',
        integrationVersion: '1.0.0',
        madVersion: '2.3.0',
        source: 'mad-collector'
    },
    trendPoints: [
        { date: '2026-04-07T09:20:00.000Z', hosts: 4, problems: 1, events: 2, triggers: 96 },
        { date: '2026-04-08T09:20:00.000Z', hosts: 4, problems: 0, events: 1, triggers: 96 },
        { date: '2026-04-09T09:20:00.000Z', hosts: 4, problems: 2, events: 3, triggers: 96 },
        { date: '2026-04-10T09:20:00.000Z', hosts: 4, problems: 2, events: 3, triggers: 96 }
    ],
    agentInfo: {
        name: 'Zabbix Primary Lima',
        lastUsed: '2026-04-10T09:20:00.000Z'
    }
};

const zabbixNotConfiguredBase: ZabbixFullMetrics = {
    configured: false,
    message: 'Zabbix integration not configured.'
};

export const createZabbixConfiguredMetricsFixture = (
    overrides: Partial<ZabbixConfiguredMetrics> = {}
): ZabbixConfiguredMetrics => ({
    ...cloneFixture(zabbixConfiguredMetricsBase),
    ...overrides,
    summary: {
        ...cloneFixture(zabbixConfiguredMetricsBase.summary),
        ...overrides.summary
    },
    hosts: overrides.hosts ? cloneFixture(overrides.hosts) : cloneFixture(zabbixConfiguredMetricsBase.hosts),
    alerts: overrides.alerts ? cloneFixture(overrides.alerts) : cloneFixture(zabbixConfiguredMetricsBase.alerts),
    metrics: {
        ...cloneFixture(zabbixConfiguredMetricsBase.metrics),
        ...overrides.metrics
    },
    snapshotMeta: overrides.snapshotMeta
        ? {
            ...cloneFixture(zabbixConfiguredMetricsBase.snapshotMeta),
            ...overrides.snapshotMeta
        }
        : cloneFixture(zabbixConfiguredMetricsBase.snapshotMeta),
    trendPoints: overrides.trendPoints ? cloneFixture(overrides.trendPoints) : cloneFixture(zabbixConfiguredMetricsBase.trendPoints),
    agentInfo: overrides.agentInfo
        ? {
            ...cloneFixture(zabbixConfiguredMetricsBase.agentInfo),
            ...overrides.agentInfo
        }
        : cloneFixture(zabbixConfiguredMetricsBase.agentInfo)
});

export const createZabbixNotConfiguredFixture = (
    overrides: Partial<typeof zabbixNotConfiguredBase> = {}
): ZabbixFullMetrics => ({
    ...cloneFixture(zabbixNotConfiguredBase),
    ...overrides
});

export const zabbixConfiguredMetricsFixture = createZabbixConfiguredMetricsFixture();
export const zabbixNotConfiguredFixture = createZabbixNotConfiguredFixture();
