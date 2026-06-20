// Service for fetching provider-specific metrics
import { providerApiService } from './provider-api.service';
import type { ZabbixFullMetrics } from '../types/api';

export type ProviderType = 'wazuh' | 'zabbix' | 'nessus' | 'openvas' | 'insightvm' | 'uptime' | 'paloalto' | 'splunk' | 'meraki';
export type DashboardRangePreset = 'today' | 'yesterday' | '7d' | '30d' | 'custom';
export type WazuhRangePreset = DashboardRangePreset;

export type WazuhSeverityKey = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface WazuhSeverityTotals {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
}

export interface WazuhMetricsQuery {
    preset: DashboardRangePreset;
    from?: string;
    to?: string;
}

export interface WazuhSnapshot {
    scanId?: string;
    scannedAt?: string;
    totalAlerts: number;
    alertsBySeverity: WazuhSeverityTotals;
}

export interface WazuhRangeInfo {
    preset: DashboardRangePreset;
    from?: string | null;
    to?: string | null;
    days: number;
    label: string;
}

export interface WazuhIntegrationStatus {
    configured: boolean;
    managerStatus?: string | null;
    activeAgents?: number | null;
    inactiveAgents?: number | null;
    lastSync?: string | null;
    agentName?: string | null;
}

export interface WazuhCutRow {
    id: string;
    scanId?: string | null;
    scanName: string;
    scannedAt?: string | null;
    status: string;
    agentName?: string | null;
    totalEvents: number;
    severityTotals: WazuhSeverityTotals;
    topRule?: string | null;
    topAgent?: string | null;
    sendReason?: string | null;
    snapshotMode?: string | null;
}

export interface WazuhSnapshotTopItem {
    name: string;
    count: number;
    sharePct: number;
}

export interface WazuhHistoricalSummary {
    totalScans: number;
    totalEvents: number;
    severityTotals: WazuhSeverityTotals;
    criticalPressurePct: number;
    noiseSharePct: number;
    avgEventsPerCut: number;
    peakCutEvents: number;
    medianEventsPerCut: number;
    scanCadenceMinutesMedian: number | null;
    cuts: WazuhCutRow[];
}

export interface WazuhSnapshotSummary {
    scanSummaryId?: string | null;
    scanId?: string | null;
    scanName?: string | null;
    agentName?: string | null;
    scannedAt?: string | null;
    windowStart?: string | null;
    windowEnd?: string | null;
    totalEvents: number;
    severityTotals: WazuhSeverityTotals;
    dominantSeverity: WazuhSeverityKey | 'none';
    topRules: WazuhSnapshotTopItem[];
    topAgents: WazuhSnapshotTopItem[];
    sendReason?: string | null;
    snapshotMode?: string | null;
}

export interface WazuhAnalyticsSummary {
    trend: Array<{ date: string; critical: number; high: number; medium: number; low: number; info: number; total: number }>;
    uniqueAgentsInRange: number;
    avgEventsPerAgentInRange: number;
    mostPressuredAgent?: { name: string | null; criticalCount: number };
    recentEvents: Array<{ id: string; name: string; severity: string; host?: string; detectedAt?: string }>;
}

export interface WazuhMetrics {
    activeAgents: number;
    inactiveAgents: number;
    topRules: Array<{ rule: string; count: number }>;
    alertsBySeverity: WazuhSeverityTotals;
    configured?: boolean;
    status?: string;
    message?: string;
    hostsReported?: number;
    avgFindingsPerHost?: number;
    mostCriticalHost?: { host: string; criticalCount: number };
    lastSync?: string;
    agentInfo?: { name: string; lastUsed: string };
    trend7Days?: Array<{ date: string; critical: number; high: number; medium: number; low: number; info: number }>;
    recentFindings?: Array<{ id: string; name: string; severity: string; host?: string; detectedAt?: string }>;
    scanDetails?: Array<{ id: string; target: string; status: string; created_at: string; total_findings: number }>;
    currentSnapshot?: WazuhSnapshot;
    historyRangeLabel?: string;
    range?: WazuhRangeInfo;
    integrationStatus?: WazuhIntegrationStatus;
    historical?: WazuhHistoricalSummary;
    snapshot?: WazuhSnapshotSummary;
    analytics?: WazuhAnalyticsSummary;
}

export interface ZabbixMetrics {
    hostsMonitored: number;
    problemsActive: number;
    cpuUsage: Array<{ host: string; usage: number }>;
    memoryUsage: Array<{ host: string; usage: number }>;
}

export interface NessusMetrics {
    vulnerabilities: { critical: number; high: number; medium: number; low: number; info: number };
    scansCompleted: number;
    hostsScanned: number;
    scanDetails?: Array<{
        id: string;
        target: string;
        status: 'completed' | 'failed' | 'running';
        scanner_type: string;
        created_at: string;
        total_findings?: number;
        cvss_max?: number;
    }>;
    trend7Days?: Array<{ date: string; critical: number; high: number; medium: number; low: number; info: number }>;
    lastSync?: string;
}

export interface OpenvasMetrics {
    vulnerabilities: { critical: number; high: number; medium: number; low: number; info: number };
    scansCompleted: number;
    hostsScanned: number;
    topCVEs: Array<{ cve: string; severity: string; count: number }>;
    trend_7_days?: Array<{ date: string; critical: number; high: number; medium: number; low: number; info: number }>;
    scanDetails?: Array<{
        id: string;
        target: string;
        status: 'completed' | 'failed' | 'running';
        scanner_type: string;
        created_at: string;
        vulnerabilities?: Array<{
            cve?: string;
            cvss?: number;
            severity: string;
            name: string;
            host?: string;
        }>;
    }>;
    lastUpdate?: string;
}


export interface UptimeMetrics {
    servicesMonitored: number;
    servicesUp: number;
    servicesDown: number;
    uptimePercentage: number;
    recentDowntime: Array<{ service: string; duration: string; timestamp: string }>;
    scanDetails?: Array<{
        id: string;
        target: string;
        status: 'completed' | 'failed' | 'running';
        scanner_type: string;
        created_at: string;
        monitored?: number;
        up?: number;
        down?: number;
        uptime?: number;
    }>;
    trend7Days?: Array<{ date: string; uptime: number; down: number }>;
    downMonitors?: string[];
    avgResponseTimeMs?: number;
    avgResponseTimeMs30d?: number;
    avgResponseTimeMs365d?: number;
    avgUptimeRatio1d?: number;
    avgUptimeRatio30d?: number;
    avgUptimeRatio365d?: number;
    lastSync?: string;
}

// Mock data removed to ensure proper empty state handling

export const providerService = {
    getWazuhMetrics: async (query?: WazuhMetricsQuery): Promise<WazuhMetrics> => {
        return await providerApiService.getWazuhMetrics(query);
    },

    getWazuhScanDetail: async (id: string): Promise<any> => {
        try {
            const [summary, findings] = await Promise.all([
                providerApiService.getScanDetail(id, { domain: 'soc' }),
                providerApiService.getScanFindings(id, { domain: 'soc' }).catch(err => {
                    console.error('Error fetching Wazuh findings for ID', id, err);
                    return [];
                })
            ]);

            const scanObj = summary.scan || summary;

            if (scanObj) {
                const hasSummaryCounts = (scanObj.critical_count || 0)
                    + (scanObj.high_count || 0)
                    + (scanObj.medium_count || 0)
                    + (scanObj.low_count || 0)
                    + (scanObj.info_count || 0) > 0;

                if (!hasSummaryCounts && findings.length > 0) {
                    let crit = 0, high = 0, med = 0, low = 0, info = 0;
                    findings.forEach((finding: any) => {
                        const severity = String(finding?.severity || finding?.priority || finding?.level || 'info').toLowerCase();
                        if (severity === 'critical') crit += 1;
                        else if (severity === 'high') high += 1;
                        else if (severity === 'medium') med += 1;
                        else if (severity === 'low') low += 1;
                        else info += 1;
                    });
                    scanObj.critical_count = crit;
                    scanObj.high_count = high;
                    scanObj.medium_count = med;
                    scanObj.low_count = low;
                    scanObj.info_count = info;
                }

                scanObj.results = Array.isArray(scanObj.results)
                    ? { vulnerabilities: findings }
                    : { ...(scanObj.results || {}), vulnerabilities: findings };
                scanObj.findings = findings;
            }

            return summary;
        } catch (error) {
            console.warn('Failed to fetch Wazuh scan detail from API', error);
            throw error;
        }
    },

    getZabbixMetrics: async (): Promise<ZabbixMetrics> => {
        return await providerApiService.getZabbixMetrics();
    },

    getZabbixFullMetrics: async (query?: WazuhMetricsQuery): Promise<ZabbixFullMetrics> => {
        return await providerApiService.getZabbixFullMetrics(query);
    },

    getNessusMetrics: async (query?: WazuhMetricsQuery): Promise<NessusMetrics> => {
        return await providerApiService.getNessusMetrics(query);
    },

    getNessusScanDetail: async (id: string): Promise<any> => {
        try {
            const [summary, findings] = await Promise.all([
                providerApiService.getScanDetail(id),
                providerApiService.getScanFindings(id).catch(err => {
                    console.error('Error fetching Nessus findings for ID', id, err);
                    return [];
                })
            ]);

            const scanObj = summary.scan || summary;

            if (scanObj) {
                const hasSummaryCounts = (scanObj.critical_count || 0) + (scanObj.high_count || 0) + (scanObj.medium_count || 0) + (scanObj.low_count || 0) > 0;
                if (!hasSummaryCounts && findings.length > 0) {
                    let crit = 0, high = 0, med = 0, low = 0, info = 0;
                    findings.forEach((f: any) => {
                        const s = String(f.severity || f.threat || 'info').toLowerCase();
                        if (s === 'critical') crit++;
                        else if (s === 'high') high++;
                        else if (s === 'medium') med++;
                        else if (s === 'low') low++;
                        else info++;
                    });
                    scanObj.critical_count = crit;
                    scanObj.high_count = high;
                    scanObj.medium_count = med;
                    scanObj.low_count = low;
                    scanObj.info_count = info;
                }

                if (Array.isArray(scanObj.results)) {
                    scanObj.results = { vulnerabilities: findings };
                } else {
                    scanObj.results = { ...(scanObj.results || {}), vulnerabilities: findings };
                }
                scanObj.findings = findings;
            }

            return summary;
        } catch (error) {
            console.warn('Failed to fetch Nessus scan detail from API', error);
            throw error;
        }
    },

    getUptimeMetrics: async (query?: WazuhMetricsQuery): Promise<UptimeMetrics> => {
        return await providerApiService.getUptimeMetrics(query);
    },

    getOpenvasMetrics: async (query?: WazuhMetricsQuery): Promise<OpenvasMetrics> => {
        return await providerApiService.getOpenvasMetrics(query);
    },

    getOpenvasCurrentState: async (): Promise<OpenvasMetrics> => {
        return await providerApiService.getOpenvasCurrentState();
    },

    getScanDetail: async (id: string): Promise<any> => {
        try {
            const [summary, findings] = await Promise.all([
                providerApiService.getScanDetail(id),
                providerApiService.getScanFindings(id).catch(err => {
                    console.error('❌ Error fetching findings for ID', id, err);
                    return [];
                })
            ]);

            console.log('📦 Scan Summary:', summary);
            console.log('🔍 Scan Findings:', findings);

            // Merge findings into the summary object
            const scanObj = summary.scan || summary;

            if (scanObj) {
                // Ensure the component finds the data where it expects it
                // Component looks for: results = scan.results?.vulnerabilities || scan.results
                scanObj.results = {
                    vulnerabilities: findings
                };

                // Also attach directly as a backup
                scanObj.findings = findings;

                // IMPORTANT: If summary counts are 0 but we have findings, 
                // we can patch the summary object here in the frontend too
                if (findings.length > 0 && (scanObj.high_count || 0) === 0) {
                    scanObj.high_count = findings.filter((f: any) => f.severity?.toLowerCase() === 'high' || (f.cvss || 0) >= 7).length;
                    scanObj.medium_count = findings.filter((f: any) => f.severity?.toLowerCase() === 'medium' || ((f.cvss || 0) >= 4 && (f.cvss || 0) < 7)).length;
                    scanObj.low_count = findings.filter((f: any) => f.severity?.toLowerCase() === 'low' || ((f.cvss || 0) > 0 && (f.cvss || 0) < 4)).length;
                    scanObj.info_count = findings.filter((f: any) => f.severity?.toLowerCase() === 'info' || (f.cvss || 0) === 0).length;
                }
            }

            return summary;
        } catch (error) {
            console.warn('Failed to fetch scan detail from API', error);
            throw error;
        }
    },

    getAllScanFindings: async (
        query?: WazuhMetricsQuery,
        options?: {
            concurrency?: number;
            onChunk?: (chunk: any[], meta: { processed: number; total: number }) => void;
        }
    ): Promise<any[]> => {
        return await providerApiService.getAllScanFindings(query, options);
    },

    // InsightVM Methods (Similar to OpenVAS but specific for Rapid7)
    getInsightvmMetrics: async (query?: WazuhMetricsQuery): Promise<OpenvasMetrics> => {
        return providerApiService.getInsightvmMetrics(query);
    },

    getInsightvmCurrentState: async (): Promise<OpenvasMetrics> => {
        return providerApiService.getInsightvmCurrentState();
    },

    getInsightvmScanDetail: async (id: string): Promise<any> => {
        try {
            const [summary, findings] = await Promise.all([
                providerApiService.getScanDetail(id),
                providerApiService.getScanFindings(id).catch(err => {
                    console.error('❌ Error fetching findings for ID', id, err);
                    return [];
                })
            ]);

            console.log('📦 InsightVM Scan Summary:', summary);
            console.log('🔍 InsightVM Scan Findings:', findings);

            // Merge findings into the summary object
            const scanObj = summary.scan || summary;

            if (scanObj) {
                // Ensure we recalculate counts if they are 0
                const hasSummaryCounts = (scanObj.high_count || 0) + (scanObj.medium_count || 0) + (scanObj.critical_count || 0) > 0;

                if (!hasSummaryCounts && findings.length > 0) {
                    console.log('⚠️ Re-calculating counts from findings list for InsightVM (Summary was 0)');
                    let crit = 0, high = 0, med = 0, low = 0, info = 0;
                    findings.forEach((f: any) => {
                        const s = (f.severity || f.threat || 'info').toLowerCase();
                        if (s === 'critical') crit++;
                        else if (s === 'high') high++;
                        else if (s === 'medium') med++;
                        else if (s === 'low') low++;
                        else info++;
                    });
                    scanObj.critical_count = crit;
                    scanObj.high_count = high;
                    scanObj.medium_count = med;
                    scanObj.low_count = low;
                    scanObj.info_count = info;
                }

                if (!scanObj.results) scanObj.results = [];
                if (Array.isArray(scanObj.results)) {
                    scanObj.results = findings;
                } else {
                    scanObj.results = { vulnerabilities: findings };
                }
                scanObj.findings = findings;
            }

            return summary;
        } catch (error) {
            console.warn('Failed to fetch InsightVM scan detail from API', error);
            throw error;
        }
    },

    // Get OpenVAS Analytics
    getOpenvasAnalytics: async (query?: WazuhMetricsQuery) => {
        return await providerApiService.getOpenvasAnalytics(query);
    },

    // Get InsightVM Analytics
    getInsightvmAnalytics: async (query?: WazuhMetricsQuery) => {
        return await providerApiService.getInsightvmAnalytics(query);
    },
};
