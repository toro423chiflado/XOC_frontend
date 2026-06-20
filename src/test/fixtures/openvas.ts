import type { OpenvasMetrics } from '../../services/provider.service';
import { cloneFixture } from './helpers';

export interface OpenvasAnalyticsFixture {
    trend_7_days: Array<{ date: string; critical: number; high: number; medium: number; low: number; info: number }>;
    topCVEs: Array<{
        cve?: string;
        cve_id?: string;
        severity: string;
        hosts_affected?: number;
        count?: number;
        cvss?: number;
        cvss_score?: number;
    }>;
    recentFindings: Array<{
        id: string;
        name: string;
        severity: string;
        host: string;
        cve?: string;
        cvss?: number;
        created_at: string;
    }>;
}

const openvasMetricsBase: OpenvasMetrics = {
    vulnerabilities: {
        critical: 2,
        high: 4,
        medium: 6,
        low: 3,
        info: 1
    },
    scansCompleted: 2,
    hostsScanned: 3,
    topCVEs: [
        { cve: 'CVE-2024-30080', severity: 'critical', count: 2 },
        { cve: 'CVE-2023-42793', severity: 'high', count: 2 }
    ],
    trend_7_days: [
        { date: '2026-04-08', critical: 1, high: 2, medium: 2, low: 1, info: 0 },
        { date: '2026-04-09', critical: 2, high: 4, medium: 6, low: 3, info: 1 }
    ],
    scanDetails: [
        {
            id: 'openvas-002',
            target: 'db-core-01',
            status: 'completed',
            scanner_type: 'openvas',
            created_at: '2026-04-09T15:00:00.000Z',
            vulnerabilities: [
                { severity: 'critical', name: 'PostgreSQL privilege escalation', cve: 'CVE-2024-30080', cvss: 9.8, host: 'db-core-01' },
                { severity: 'high', name: 'Outdated SSH package', cve: 'CVE-2023-42793', cvss: 8.4, host: 'db-core-01' },
                { severity: 'medium', name: 'Anonymous FTP enabled', cvss: 5.2, host: 'db-core-01' }
            ]
        },
        {
            id: 'openvas-001',
            target: 'web-core-01',
            status: 'completed',
            scanner_type: 'openvas',
            created_at: '2026-04-08T10:00:00.000Z',
            vulnerabilities: [
                { severity: 'critical', name: 'Apache path traversal', cve: 'CVE-2024-6387', cvss: 9.8, host: 'web-core-01' },
                { severity: 'high', name: 'Weak TLS ciphers supported', cve: 'CVE-2023-38545', cvss: 8.1, host: 'web-core-01' },
                { severity: 'medium', name: 'Directory listing enabled', cvss: 5.5, host: 'web-core-01' },
                { severity: 'low', name: 'Missing security headers', cvss: 3.4, host: 'web-core-01' }
            ]
        }
    ],
    lastUpdate: '2026-04-09T15:00:00.000Z'
};

const openvasAnalyticsBase: OpenvasAnalyticsFixture = {
    trend_7_days: [
        { date: '2026-04-08', critical: 1, high: 2, medium: 2, low: 1, info: 0 },
        { date: '2026-04-09', critical: 2, high: 4, medium: 6, low: 3, info: 1 }
    ],
    topCVEs: [
        { cve_id: 'CVE-2024-30080', severity: 'critical', hosts_affected: 2, cvss_score: 9.8 },
        { cve: 'CVE-2023-42793', severity: 'high', count: 2, cvss: 8.4 }
    ],
    recentFindings: [
        { id: 'openvas-f-1', name: 'PostgreSQL privilege escalation', severity: 'critical', host: 'db-core-01', cve: 'CVE-2024-30080', cvss: 9.8, created_at: '2026-04-09T15:05:00.000Z' },
        { id: 'openvas-f-2', name: 'Apache path traversal', severity: 'critical', host: 'web-core-01', cve: 'CVE-2024-6387', cvss: 9.8, created_at: '2026-04-08T10:05:00.000Z' }
    ]
};

export const createOpenvasMetricsFixture = (overrides: Partial<OpenvasMetrics> = {}): OpenvasMetrics => ({
    ...cloneFixture(openvasMetricsBase),
    ...overrides,
    vulnerabilities: {
        ...cloneFixture(openvasMetricsBase.vulnerabilities),
        ...overrides.vulnerabilities
    },
    topCVEs: overrides.topCVEs ? cloneFixture(overrides.topCVEs) : cloneFixture(openvasMetricsBase.topCVEs),
    trend_7_days: overrides.trend_7_days ? cloneFixture(overrides.trend_7_days) : cloneFixture(openvasMetricsBase.trend_7_days),
    scanDetails: overrides.scanDetails ? cloneFixture(overrides.scanDetails) : cloneFixture(openvasMetricsBase.scanDetails)
});

export const createOpenvasAnalyticsFixture = (
    overrides: Partial<OpenvasAnalyticsFixture> = {}
): OpenvasAnalyticsFixture => ({
    ...cloneFixture(openvasAnalyticsBase),
    ...overrides,
    trend_7_days: overrides.trend_7_days ? cloneFixture(overrides.trend_7_days) : cloneFixture(openvasAnalyticsBase.trend_7_days),
    topCVEs: overrides.topCVEs ? cloneFixture(overrides.topCVEs) : cloneFixture(openvasAnalyticsBase.topCVEs),
    recentFindings: overrides.recentFindings ? cloneFixture(overrides.recentFindings) : cloneFixture(openvasAnalyticsBase.recentFindings)
});

export const openvasMetricsFixture = createOpenvasMetricsFixture();
export const openvasAnalyticsFixture = createOpenvasAnalyticsFixture();
export const openvasEmptyMetricsFixture = createOpenvasMetricsFixture({
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    scansCompleted: 0,
    hostsScanned: 0,
    topCVEs: [],
    trend_7_days: [],
    scanDetails: []
});
