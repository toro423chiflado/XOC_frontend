import type { OpenvasMetrics } from '../../services/provider.service';
import { cloneFixture } from './helpers';

type InsightvmScanFixture = NonNullable<OpenvasMetrics['scanDetails']>[number];

export interface InsightvmAnalyticsFixture {
    hostDistribution?: {
        totalUniqueHosts: number;
        avgVulnerabilitiesPerHost: number;
        mostCriticalHost?: { host: string; criticalCount: number };
    };
    trend_7_days: Array<{ date: string; critical: number; high: number; medium: number; low: number; info: number }>;
    topCVEs: Array<{
        cve_id?: string;
        cve?: string;
        severity: string;
        hosts_affected?: number;
        count?: number;
        cvss_score?: number;
        cvss?: number;
    }>;
    recentFindings: Array<{
        id: string;
        name: string;
        severity: string;
        host: string;
        cve?: string;
        cvss?: number;
        detected_at: string;
    }>;
}

const insightvmMetricsBase: OpenvasMetrics = {
    vulnerabilities: {
        critical: 3,
        high: 5,
        medium: 9,
        low: 6,
        info: 2
    },
    scansCompleted: 3,
    hostsScanned: 4,
    topCVEs: [
        { cve: 'CVE-2024-3094', severity: 'critical', count: 4 },
        { cve: 'CVE-2023-38545', severity: 'high', count: 3 }
    ],
    trend_7_days: [
        { date: '2026-04-08', critical: 1, high: 1, medium: 2, low: 1, info: 0 },
        { date: '2026-04-09', critical: 1, high: 2, medium: 3, low: 2, info: 1 },
        { date: '2026-04-10', critical: 3, high: 5, medium: 9, low: 6, info: 2 }
    ],
    scanDetails: [
        {
            id: 'insightvm-scan-003',
            target: 'srv-db-01',
            status: 'completed',
            scanner_type: 'insightvm',
            created_at: '2026-04-10T10:00:00.000Z',
            vulnerabilities: [
                { severity: 'critical', name: 'Remote code execution in Java service', cve: 'CVE-2024-3094', cvss: 10, host: 'srv-db-01' },
                { severity: 'high', name: 'Weak TLS ciphers supported', cve: 'CVE-2023-38545', cvss: 9.1, host: 'srv-db-01' },
                { severity: 'high', name: 'Outdated OpenSSL package', cve: 'CVE-2024-5535', cvss: 8.7, host: 'srv-db-01' },
                { severity: 'medium', name: 'Directory listing exposed', cvss: 5.4, host: 'srv-db-01' },
                { severity: 'medium', name: 'SMB signing disabled', cvss: 6.1, host: 'srv-db-01' },
                { severity: 'low', name: 'Banner disclosure', cvss: 2.3, host: 'srv-db-01' }
            ]
        },
        {
            id: 'insightvm-scan-002',
            target: 'srv-web-01',
            status: 'completed',
            scanner_type: 'insightvm',
            created_at: '2026-04-09T14:30:00.000Z',
            vulnerabilities: [
                { severity: 'critical', name: 'Apache path traversal', cve: 'CVE-2024-6387', cvss: 9.8, host: 'srv-web-01' },
                { severity: 'high', name: 'OpenSSH username enumeration', cve: 'CVE-2024-6387', cvss: 8.1, host: 'srv-web-01' },
                { severity: 'medium', name: 'Deprecated TLS version detected', cvss: 5.8, host: 'srv-web-01' },
                { severity: 'low', name: 'Missing security headers', cvss: 3.2, host: 'srv-web-01' }
            ]
        },
        {
            id: 'insightvm-scan-001',
            target: 'endpoint-finance-07',
            status: 'completed',
            scanner_type: 'insightvm',
            created_at: '2026-04-08T09:15:00.000Z',
            vulnerabilities: [
                { severity: 'high', name: 'Privilege escalation package pending', cvss: 7.8, host: 'endpoint-finance-07' },
                { severity: 'medium', name: 'Unsupported browser version', cvss: 4.7, host: 'endpoint-finance-07' },
                { severity: 'info', name: 'Inventory metadata outdated', cvss: 0, host: 'endpoint-finance-07' }
            ]
        }
    ] as InsightvmScanFixture[],
    lastUpdate: '2026-04-10T10:00:00.000Z'
};

const insightvmAnalyticsBase: InsightvmAnalyticsFixture = {
    hostDistribution: {
        totalUniqueHosts: 6,
        avgVulnerabilitiesPerHost: 6.25,
        mostCriticalHost: {
            host: 'srv-db-01',
            criticalCount: 2
        }
    },
    trend_7_days: [
        { date: '2026-04-08', critical: 1, high: 1, medium: 2, low: 1, info: 0 },
        { date: '2026-04-09', critical: 2, high: 3, medium: 4, low: 2, info: 1 },
        { date: '2026-04-10', critical: 3, high: 5, medium: 9, low: 6, info: 2 }
    ],
    topCVEs: [
        { cve_id: 'CVE-2024-3094', severity: 'critical', hosts_affected: 4, cvss_score: 10 },
        { cve: 'CVE-2024-6387', severity: 'critical', count: 3, cvss: 9.8 },
        { cve_id: 'CVE-2023-38545', severity: 'high', hosts_affected: 3, cvss_score: 9.1 }
    ],
    recentFindings: [
        {
            id: 'finding-001',
            name: 'OpenSSH username enumeration',
            severity: 'high',
            host: 'srv-web-01',
            cve: 'CVE-2024-6387',
            cvss: 8.1,
            detected_at: '2026-04-10T10:05:00.000Z'
        },
        {
            id: 'finding-002',
            name: 'Remote code execution in Java service',
            severity: 'critical',
            host: 'srv-db-01',
            cve: 'CVE-2024-3094',
            cvss: 10,
            detected_at: '2026-04-10T09:50:00.000Z'
        },
        {
            id: 'finding-003',
            name: 'Weak TLS ciphers supported',
            severity: 'high',
            host: 'edge-gateway-02',
            cve: 'CVE-2023-38545',
            cvss: 9.1,
            detected_at: '2026-04-09T18:20:00.000Z'
        }
    ]
};

const insightvmRawScansResponseBase = {
    scans: [
        {
            id: 'raw-insightvm-001',
            scanner_type: 'insightvm',
            target: 'srv-web-01',
            status: 'completed',
            created_at: '2026-04-08T12:00:00.000Z',
            critical_count: 1,
            high_count: 2,
            medium_count: 4,
            low_count: 1,
            info_count: 0,
            results: {
                vulnerabilities: [
                    { severity: 'critical', name: 'Apache path traversal', cve: 'CVE-2024-6387', cvss: 9.8, host: 'srv-web-01' },
                    { severity: 'high', name: 'OpenSSH username enumeration', cve: 'CVE-2024-6387', cvss: 8.1, host: 'srv-web-01' }
                ]
            }
        },
        {
            id: 'raw-insightvm-002',
            scanner_type: 'insightvm',
            target: 'srv-db-01',
            status: 'completed',
            created_at: '2026-04-09T11:30:00.000Z',
            critical_count: 0,
            high_count: 3,
            medium_count: 1,
            low_count: 2,
            info_count: 1,
            results: {
                vulnerabilities: [
                    { severity: 'high', name: 'Weak TLS ciphers supported', cve: 'CVE-2023-38545', cvss: 9.1, host: 'srv-db-01' }
                ]
            }
        },
        {
            id: 'raw-insightvm-003',
            scanner_type: 'insightvm',
            target: 'srv-web-01',
            status: 'completed',
            created_at: '2026-04-09T18:00:00.000Z',
            critical_count: 2,
            high_count: 0,
            medium_count: 2,
            low_count: 1,
            info_count: 0,
            results: {
                vulnerabilities: [
                    { severity: 'critical', name: 'Java RCE', cve: 'CVE-2024-3094', cvss: 10, host: 'srv-web-01' }
                ]
            }
        }
    ]
};

export const createInsightvmMetricsFixture = (overrides: Partial<OpenvasMetrics> = {}): OpenvasMetrics => ({
    ...cloneFixture(insightvmMetricsBase),
    ...overrides,
    vulnerabilities: {
        ...cloneFixture(insightvmMetricsBase.vulnerabilities),
        ...overrides.vulnerabilities
    },
    topCVEs: overrides.topCVEs ? cloneFixture(overrides.topCVEs) : cloneFixture(insightvmMetricsBase.topCVEs),
    trend_7_days: overrides.trend_7_days ? cloneFixture(overrides.trend_7_days) : cloneFixture(insightvmMetricsBase.trend_7_days),
    scanDetails: overrides.scanDetails ? cloneFixture(overrides.scanDetails) : cloneFixture(insightvmMetricsBase.scanDetails)
});

export const createInsightvmAnalyticsFixture = (
    overrides: Partial<InsightvmAnalyticsFixture> = {}
): InsightvmAnalyticsFixture => ({
    ...cloneFixture(insightvmAnalyticsBase),
    ...overrides,
    hostDistribution: overrides.hostDistribution
        ? {
            ...cloneFixture(insightvmAnalyticsBase.hostDistribution),
            ...overrides.hostDistribution
        }
        : cloneFixture(insightvmAnalyticsBase.hostDistribution),
    trend_7_days: overrides.trend_7_days ? cloneFixture(overrides.trend_7_days) : cloneFixture(insightvmAnalyticsBase.trend_7_days),
    topCVEs: overrides.topCVEs ? cloneFixture(overrides.topCVEs) : cloneFixture(insightvmAnalyticsBase.topCVEs),
    recentFindings: overrides.recentFindings ? cloneFixture(overrides.recentFindings) : cloneFixture(insightvmAnalyticsBase.recentFindings)
});

export const createInsightvmRawScansResponseFixture = () => cloneFixture(insightvmRawScansResponseBase);

export const insightvmMetricsFixture = createInsightvmMetricsFixture();
export const insightvmAnalyticsFixture = createInsightvmAnalyticsFixture();
export const insightvmRawScansResponseFixture = createInsightvmRawScansResponseFixture();
export const insightvmEmptyMetricsFixture = createInsightvmMetricsFixture({
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    scansCompleted: 0,
    hostsScanned: 0,
    topCVEs: [],
    trend_7_days: [],
    scanDetails: []
});
