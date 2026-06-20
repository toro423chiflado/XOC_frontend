import { api } from '../lib/axios';
import type { DashboardSummary, ZabbixFullMetrics } from '../types/api';
import type {
    WazuhMetrics,
    WazuhMetricsQuery,
    DashboardRangePreset,
    ZabbixMetrics,
    NessusMetrics,
    UptimeMetrics,
    OpenvasMetrics
} from './provider.service';

export const providerApiService = {
    // Get consolidated dashboard summary
    getDashboardSummary: async (): Promise<DashboardSummary> => {
        const { data } = await api.get<DashboardSummary>('/api/integrations/dashboard/summary');
        return data;
    },

    // Get Wazuh metrics
    getWazuhMetrics: async (query?: WazuhMetricsQuery): Promise<WazuhMetrics> => {
        const rangeParams = buildRangeParams(query);

        const [{ data: analyticsData }, { data: latestStateData }, { data: historicalScansData }] = await Promise.all([
            api.get('/api/scans/wazuh/analytics', { params: rangeParams }),
            api.get('/api/scans/latest', {
                params: {
                    scanner_type: 'wazuh'
                }
            }),
            api.get('/api/scans', {
                params: {
                    scanner_type: 'wazuh',
                    limit: 200,
                    ...rangeParams
                }
            })
        ]);

        const latestScans = Array.isArray(latestStateData?.scans) ? latestStateData.scans : [];
        const historicalScans = Array.isArray(historicalScansData?.scans) ? historicalScansData.scans : [];
        const preferredCurrentScan = [
            ...latestScans.filter((scan: any) => getScanFindingTotal(scan) > 0),
            ...historicalScans.filter((scan: any) => getScanFindingTotal(scan) > 0)
        ].sort(sortScansByRecency)[0] || latestScans[0] || historicalScans[0] || null;

        const preferredScanId = preferredCurrentScan?.id ?? preferredCurrentScan?.scan_id;
        const latestFindings = preferredScanId
            ? await providerApiService.getScanFindings(preferredScanId).catch(() => [])
            : [];

        return normalizeWazuhAnalytics({
            analyticsData,
            latestStateData,
            latestFindings,
            historicalScansData,
            preferredCurrentScan,
            query
        });
    },

    // Get Zabbix metrics
    getZabbixMetrics: async (): Promise<ZabbixMetrics> => {
        const { data } = await api.get('/api/integrations/zabbix/summary');

        return {
            hostsMonitored: data.hosts || 0,
            problemsActive: data.alerts || 0,
            cpuUsage: data.cpu_usage || [],
            memoryUsage: data.memory_usage || []
        };
    },

    // Get Zabbix Detailed metrics (On-Prem Analytics)
    getZabbixFullMetrics: async (query?: WazuhMetricsQuery): Promise<ZabbixFullMetrics> => {
        const rangeParams = buildRangeParams(query);
        const [analyticsResponse, latestStateResponse, scansResponse] = await Promise.all([
            api.get('/api/scans/zabbix/analytics', { params: rangeParams }).catch(() => ({ data: {} })),
            api.get('/api/scans/latest', {
                params: {
                    scanner_type: 'zabbix'
                }
            }).catch(() => ({ data: {} })),
            api.get('/api/scans', {
                params: {
                    scanner_type: 'zabbix',
                    limit: 200,
                    ...rangeParams
                }
            }).catch(() => ({ data: {} }))
        ]);

        const latestScans = Array.isArray(latestStateResponse?.data?.scans) ? latestStateResponse.data.scans : [];
        const historicalScans = Array.isArray(scansResponse?.data?.scans) ? scansResponse.data.scans : [];
        const mergedScans = dedupeScansById([...latestScans, ...historicalScans]).sort(sortScansByRecency);
        const preferredScan = mergedScans[0];
        const preferredScanId = pickId(preferredScan?.id, preferredScan?.scan_id);
        const latestFindings = preferredScanId
            ? await providerApiService.getScanFindings(preferredScanId).catch(() => [])
            : [];

        return normalizeZabbixFullMetrics({
            analyticsData: analyticsResponse?.data,
            latestStateData: latestStateResponse?.data,
            historicalScansData: scansResponse?.data,
            preferredScan,
            latestFindings
        });
    },

    // Get Nessus metrics (aligned with MAD ingest -> /api/scans)
    getNessusMetrics: async (query?: WazuhMetricsQuery): Promise<NessusMetrics> => {
        const rangeParams = buildRangeParams(query);

        const [nessusScansResponse, tenableScansResponse, summaryResponse] = await Promise.all([
            api.get('/api/scans', {
                params: {
                    scanner_type: 'nessus',
                    limit: 200,
                    ...rangeParams
                }
            }).catch(() => ({ data: {} })),
            api.get('/api/scans', {
                params: {
                    scanner_type: 'tenable',
                    limit: 200,
                    ...rangeParams
                }
            }).catch(() => ({ data: {} })),
            api.get('/api/integrations/nessus/summary', { params: rangeParams }).catch(() => ({ data: {} }))
        ]);

        const nessusScans = Array.isArray(nessusScansResponse?.data?.scans) ? nessusScansResponse.data.scans : [];
        const tenableScans = Array.isArray(tenableScansResponse?.data?.scans) ? tenableScansResponse.data.scans : [];
        const mergedScans = dedupeScansById([...nessusScans, ...tenableScans]).sort(sortScansByRecency);
        const latestScan = mergedScans[0];
        const latestScanId = pickId(latestScan?.id, latestScan?.scan_id);
        const latestFindings = latestScanId
            ? await providerApiService.getScanFindings(latestScanId).catch(() => [])
            : [];

        const vulnerabilities = mergedScans.reduce(
            (acc: { critical: number; high: number; medium: number; low: number; info: number }, scan: any) => {
                acc.critical += pickNumber(scan?.critical_count, scan?.results?.critical);
                acc.high += pickNumber(scan?.high_count, scan?.results?.high);
                acc.medium += pickNumber(scan?.medium_count, scan?.results?.medium);
                acc.low += pickNumber(scan?.low_count, scan?.results?.low);
                acc.info += pickNumber(scan?.info_count, scan?.results?.info);
                return acc;
            },
            { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
        );

        const summaryData = summaryResponse?.data?.data ?? summaryResponse?.data ?? {};
        const summaryVulnerabilities = summaryData?.vulnerabilities || {};
        const mergedVulnerabilities = {
            critical: vulnerabilities.critical || pickNumber(summaryVulnerabilities?.critical),
            high: vulnerabilities.high || pickNumber(summaryVulnerabilities?.high),
            medium: vulnerabilities.medium || pickNumber(summaryVulnerabilities?.medium),
            low: vulnerabilities.low || pickNumber(summaryVulnerabilities?.low),
            info: vulnerabilities.info || pickNumber(summaryVulnerabilities?.info)
        };

        const scansCompletedFromScans = mergedScans.filter((scan: any) => (scan?.status || 'completed') === 'completed').length;
        const scansCompletedFromMeta = mergedScans.reduce((maxValue: number, scan: any) => {
            const meta = scan?.meta_info || scan?.meta || {};
            return Math.max(maxValue, pickNumber(meta?.completed_scans, meta?.scans_in_payload));
        }, 0);
        const scansCompleted = Math.max(
            scansCompletedFromScans,
            scansCompletedFromMeta,
            pickNumber(summaryData?.scans, summaryData?.scans_completed, summaryData?.total_scans)
        );

        const hostsFromScans = new Set<string>();
        mergedScans.forEach((scan: any) => {
            const hostKey = pickString(scan?.target, scan?.scan_name, scan?.host);
            if (hostKey) hostsFromScans.add(hostKey);
        });
        const hostsFromScanTotals = mergedScans.reduce((maxValue: number, scan: any) => {
            return Math.max(maxValue, pickNumber(scan?.total_hosts, scan?.hosts_scanned, scan?.hosts_total));
        }, 0);
        const topCVEsFromFindings = mapNessusTopCVEsFromFindings(latestFindings);
        const recentFindings = mapNessusRecentFindings(latestFindings);
        const scanDetails = mergedScans.map((scan: any) => ({
            id: String(pickId(scan?.id, scan?.scan_id) || ''),
            target: pickString(scan?.target, scan?.scan_name, scan?.host) || 'Activo no identificado',
            status: (String(scan?.status || 'completed').toLowerCase() === 'failed'
                ? 'failed'
                : String(scan?.status || 'completed').toLowerCase() === 'running'
                    ? 'running'
                    : 'completed') as 'completed' | 'failed' | 'running',
            scanner_type: pickString(scan?.scanner_type, scan?.source_scanner_type) || 'nessus',
            created_at: pickString(scan?.created_at, scan?.scanned_at) || new Date().toISOString(),
            total_findings: pickNumber(
                scan?.critical_count, 0
            ) + pickNumber(scan?.high_count) + pickNumber(scan?.medium_count) + pickNumber(scan?.low_count) + pickNumber(scan?.info_count)
        })).filter((scan: any) => scan.id);

        return {
            vulnerabilities: mergedVulnerabilities,
            scansCompleted,
            hostsScanned: hostsFromScanTotals
                || hostsFromScans.size
                || pickNumber(summaryData?.hosts_scanned, summaryData?.hostsScanned, summaryData?.total_hosts),
            topCVEs: topCVEsFromFindings.length > 0
                ? topCVEsFromFindings
                : Array.isArray(summaryData?.top_cves)
                    ? summaryData.top_cves
                    : Array.isArray(summaryData?.topCVEs)
                        ? summaryData.topCVEs
                        : [],
            recentFindings,
            scanDetails: scanDetails.slice(0, 30),
            trend7Days: calculateTrend7Days(mergedScans),
            lastSync: pickString(latestScan?.scanned_at, latestScan?.created_at)
        };
    },

    // Get Uptime Kuma metrics (aligned with MAD ingest -> /api/scans)
    getUptimeMetrics: async (query?: WazuhMetricsQuery): Promise<UptimeMetrics> => {
        const rangeParams = buildRangeParams(query);

        const [uptimeKumaScansResponse, summaryResponse] = await Promise.all([
            api.get('/api/scans', {
                params: {
                    scanner_type: 'uptime_kuma',
                    limit: 200,
                    ...rangeParams
                }
            }).catch(() => ({ data: {} })),
            api.get('/api/integrations/uptime_kuma/summary', { params: rangeParams }).catch(() => ({ data: {} }))
        ]);

        const uptimeKumaScans = Array.isArray(uptimeKumaScansResponse?.data?.scans) ? uptimeKumaScansResponse.data.scans : [];
        const mergedScans = dedupeScansById([...uptimeKumaScans]).sort(sortScansByRecency);
        const latestScan = mergedScans[0];
        const latestScanId = pickId(latestScan?.id, latestScan?.scan_id);
        const latestFindings = latestScanId
            ? await providerApiService.getScanFindings(latestScanId, { domain: 'noc' }).catch(() => [])
            : [];

        const summaryData = summaryResponse?.data?.data ?? summaryResponse?.data ?? {};
        const latestMeta = latestScan?.meta_info || latestScan?.meta || {};
        const summaryServices = summaryData?.services || {};

        let servicesMonitored = pickNumber(
            latestScan?.total_hosts,
            latestScan?.services_total,
            latestScan?.services?.total,
            latestScan?.results?.total,
            latestScan?.results?.services_total,
            latestScan?.results?.monitored,
            latestScan?.metrics?.total,
            summaryServices?.total,
            summaryServices?.monitored,
            summaryData?.total_services,
            summaryData?.services_total
        );

        const downMonitorsFromMeta = Array.isArray(latestMeta?.down_monitors) ? latestMeta.down_monitors.length : 0;

        let servicesDown = pickNumber(
            latestMeta?.down_count,
            latestScan?.meta_info?.down_count,
            latestScan?.down_count,
            latestScan?.services?.down,
            latestScan?.results?.down,
            latestScan?.results?.down_count,
            latestScan?.metrics?.down,
            summaryServices?.down
        );
        if (servicesDown === 0) {
            servicesDown = pickNumber(latestScan?.critical_count) || downMonitorsFromMeta;
        }

        let servicesUp = pickNumber(
            latestMeta?.up_count,
            latestScan?.meta_info?.up_count,
            latestScan?.up_count,
            latestScan?.services?.up,
            latestScan?.results?.up,
            latestScan?.results?.up_count,
            latestScan?.metrics?.up,
            summaryServices?.up
        );
        if (servicesUp === 0 && servicesMonitored > 0) {
            servicesUp = Math.max(0, servicesMonitored - servicesDown);
        }
        if (servicesUp === 0) {
            servicesUp = pickNumber(latestScan?.low_count, latestScan?.info_count);
        }

        let uptimePercentage = normalizeUptimePercentage(pickNumber(
            latestMeta?.avg_uptime_ratio_1d,
            latestScan?.meta_info?.avg_uptime_ratio_1d,
            latestScan?.uptime_percentage,
            latestScan?.uptime,
            latestScan?.results?.uptime_percentage,
            latestScan?.results?.uptime,
            latestScan?.metrics?.uptime,
            summaryData?.uptime_percentage,
            summaryData?.uptimePercentage
        ));
        if (uptimePercentage === 0 && servicesMonitored > 0 && servicesUp > 0) {
            uptimePercentage = Math.round((servicesUp / servicesMonitored) * 10000) / 100;
        }

        if (servicesMonitored === 0 && (servicesUp > 0 || servicesDown > 0)) {
            servicesMonitored = servicesUp + servicesDown;
        }

        if (servicesMonitored > 0 && servicesUp === 0 && servicesDown === 0 && uptimePercentage > 0) {
            servicesUp = Math.round((servicesMonitored * uptimePercentage) / 100);
            servicesDown = Math.max(0, servicesMonitored - servicesUp);
        }

        const summaryRecentDowntime = Array.isArray(summaryData?.recent_downtime)
            ? summaryData.recent_downtime
            : Array.isArray(summaryData?.recentDowntime)
                ? summaryData.recentDowntime
                : [];
        const findingsDowntime = mapUptimeIncidentsFromFindings(latestFindings);
        const downMonitors = Array.isArray(latestMeta?.down_monitors)
            ? latestMeta.down_monitors.filter((name: unknown) => typeof name === 'string' && name.trim().length > 0)
            : [];
        const recentDowntime = summaryRecentDowntime.length > 0
            ? summaryRecentDowntime
            : findingsDowntime;
        const trend7Days = buildUptimeTrendFromScans(mergedScans);
        const scanDetails = mergedScans.map((scan: any, index: number) => {
            const meta = scan?.meta_info || scan?.meta || {};
            const monitored = pickNumber(
                scan?.total_hosts,
                scan?.services_total,
                scan?.services?.total,
                scan?.results?.total,
                scan?.results?.services_total,
                scan?.results?.monitored,
                scan?.metrics?.total,
                meta?.total_services,
                meta?.monitor_count
            );
            const up = pickNumber(
                meta?.up_count,
                scan?.up_count,
                scan?.services?.up,
                scan?.results?.up,
                scan?.results?.up_count,
                scan?.metrics?.up
            );
            const down = pickNumber(
                meta?.down_count,
                scan?.down_count,
                scan?.services?.down,
                scan?.results?.down,
                scan?.results?.down_count,
                scan?.metrics?.down
            );
            const uptime = normalizeUptimePercentage(pickNumber(
                meta?.avg_uptime_ratio_1d,
                scan?.uptime_percentage,
                scan?.uptime,
                scan?.results?.uptime_percentage,
                scan?.results?.uptime,
                scan?.metrics?.uptime
            ));

            return {
                id: String(pickId(scan?.id, scan?.scan_id) || `uptime-scan-${index + 1}`),
                target: pickString(scan?.scan_name, scan?.target, scan?.host) || 'Corte de disponibilidad',
                status: (String(scan?.status || 'completed').toLowerCase() === 'failed'
                    ? 'failed'
                    : String(scan?.status || 'completed').toLowerCase() === 'running'
                        ? 'running'
                        : 'completed') as 'completed' | 'failed' | 'running',
                scanner_type: pickString(scan?.scanner_type, scan?.source_scanner_type) || 'uptime_kuma',
                created_at: pickString(scan?.created_at, scan?.scanned_at) || new Date().toISOString(),
                monitored,
                up,
                down,
                uptime
            };
        });

        return {
            servicesMonitored,
            servicesUp,
            servicesDown,
            uptimePercentage,
            recentDowntime,
            scanDetails: scanDetails.slice(0, 30),
            trend7Days,
            downMonitors,
            avgResponseTimeMs: pickNumber(latestMeta?.avg_response_time_ms),
            avgResponseTimeMs30d: pickNumber(latestMeta?.avg_response_time_ms_30d),
            avgResponseTimeMs365d: pickNumber(latestMeta?.avg_response_time_ms_365d),
            avgUptimeRatio1d: normalizeUptimePercentage(pickNumber(latestMeta?.avg_uptime_ratio_1d)),
            avgUptimeRatio30d: normalizeUptimePercentage(pickNumber(latestMeta?.avg_uptime_ratio_30d)),
            avgUptimeRatio365d: normalizeUptimePercentage(pickNumber(latestMeta?.avg_uptime_ratio_365d)),
            lastSync: pickString(latestScan?.scanned_at, latestScan?.created_at)
        };
    },

    // Get OpenVAS metrics (HISTORICAL - for overview/trends)
    getOpenvasMetrics: async (query?: WazuhMetricsQuery): Promise<OpenvasMetrics> => {
        const { data } = await api.get('/api/scans', {
            params: {
                scanner_type: 'openvas',
                limit: 100,
                ...buildRangeParams(query)
            }
        });

        // Transform scan results into metrics (HISTORICAL aggregation)
        const scans = data.scans || [];
        const vulnerabilities = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
        const cveMap = new Map<string, { severity: string; count: number; name: string }>();
        const uniqueHosts = new Set<string>();

        scans.forEach((scan: any) => {
            if (scan.status === 'completed') {
                // Use target if exists, fallback to scan_name or taskId
                const hostId = scan.target || scan.scan_name || (scan.meta_info?.taskId);
                if (hostId) uniqueHosts.add(hostId);

                // Use direct counts if available (new backend format)
                if (scan.high_count !== undefined) {
                    vulnerabilities.critical += (scan.critical_count || 0); // Keep for safety
                    vulnerabilities.high += (scan.high_count || 0);
                    vulnerabilities.medium += (scan.medium_count || 0);
                    vulnerabilities.low += (scan.low_count || 0);
                    vulnerabilities.info += (scan.info_count || 0);
                }

                // Fallback to detailed results if available
                const results = scan.results?.vulnerabilities || scan.results || [];
                if (Array.isArray(results) && results.length > 0 && scan.high_count === undefined) {
                    results.forEach((vuln: any) => {
                        const severity = (vuln.severity || vuln.threat || 'info').toLowerCase();
                        if (severity === 'critical' || severity === 'high' || severity === 'medium' || severity === 'low') {
                            vulnerabilities[severity as keyof typeof vulnerabilities]++;
                        } else {
                            vulnerabilities.info++;
                        }

                        const cveId = vuln.cve || vuln.nvt?.cve || vuln.id;
                        if (cveId && cveId.startsWith('CVE-')) {
                            const existing = cveMap.get(cveId);
                            if (existing) {
                                existing.count++;
                            } else {
                                cveMap.set(cveId, {
                                    severity: severity === 'critical' || severity === 'high' || severity === 'medium' || severity === 'low' ? severity : 'info',
                                    count: 1,
                                    name: vuln.name || vuln.nvt?.name || cveId
                                });
                            }
                        }
                    });
                }
            }
        });

        const topCVEs = Array.from(cveMap.entries())
            .map(([cve, data]) => ({ cve, severity: data.severity, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const scanDetails = scans.map((scan: any) => ({
            id: scan.id || scan.scan_id,
            target: scan.target || scan.scan_name,
            status: scan.status || 'completed',
            scanner_type: scan.scanner_type || 'openvas',
            created_at: scan.created_at || scan.scanned_at,
            cvss_max: typeof scan.cvss_max === 'number' ? scan.cvss_max : Number(scan.cvss_max) || undefined,
            total_findings: (scan.critical_count || 0) + (scan.high_count || 0) + (scan.medium_count || 0) + (scan.low_count || 0) + (scan.info_count || 0),
            critical_count: scan.critical_count,
            high_count: scan.high_count,
            medium_count: scan.medium_count,
            low_count: scan.low_count,
            info_count: scan.info_count,
            vulnerabilities: scan.results?.vulnerabilities || []
        }));

        const scansCompleted = scans.filter((s: any) => s.status === 'completed').length;
        const trend_7_days = calculateTrend7Days(scans);

        // If high-level vulnerabilities aggregation didn't work (returned all 0s), 
        // fallback to summing the individual scan totals
        const totalVulnerabilities = Object.values(vulnerabilities).reduce((a, b) => a + b, 0);
        if (totalVulnerabilities === 0 && scanDetails.length > 0) {
            scanDetails.forEach((sd: any) => {
                // We use the count logic from the scan summary fields
                const s = scans.find((os: any) => (os.id || os.scan_id) === sd.id);
                if (s) {
                    vulnerabilities.critical += (s.critical_count || 0);
                    vulnerabilities.high += (s.high_count || 0);
                    vulnerabilities.medium += (s.medium_count || 0);
                    vulnerabilities.low += (s.low_count || 0);
                    vulnerabilities.info += (s.info_count || 0);
                }
            });
        }

        const mostRecentScan = scans.reduce((latest: any, scan: any) => {
            if (!latest || new Date(scan.created_at) > new Date(latest.created_at)) {
                return scan;
            }
            return latest;
        }, null);

        return {
            vulnerabilities,
            scansCompleted,
            hostsScanned: uniqueHosts.size,
            topCVEs,
            trend_7_days,
            scanDetails: scanDetails.slice(0, 20),
            lastUpdate: mostRecentScan?.created_at || new Date().toISOString()
        };
    },

    // Get OpenVAS CURRENT STATE (NO duplicates - uses /api/scans/latest)
    getOpenvasCurrentState: async (): Promise<OpenvasMetrics> => {
        const { data } = await api.get('/api/scans/latest', {
            params: {
                scanner_type: 'openvas'
            }
        });

        // Backend already deduplicates, just transform the response
        const scans = data.scans || [];
        const vulnerabilities = {
            critical: data.totals?.critical || 0,
            high: data.totals?.high || 0,
            medium: data.totals?.medium || 0,
            low: data.totals?.low || 0,
            info: data.totals?.info || 0
        };

        const cveMap = new Map<string, { severity: string; count: number }>();
        const uniqueHosts = new Set<string>();

        scans.forEach((scan: any) => {
            if (scan.target) uniqueHosts.add(scan.target);

            const results = scan.results?.vulnerabilities || scan.results || [];
            if (Array.isArray(results)) {
                results.forEach((vuln: any) => {
                    const cveId = vuln.cve || vuln.nvt?.cve || vuln.id;
                    if (cveId && cveId.startsWith('CVE-')) {
                        const severity = (vuln.severity || vuln.threat || 'info').toLowerCase();
                        const existing = cveMap.get(cveId);
                        if (existing) {
                            existing.count++;
                        } else {
                            cveMap.set(cveId, {
                                severity: severity === 'critical' || severity === 'high' || severity === 'medium' || severity === 'low' ? severity : 'info',
                                count: 1
                            });
                        }
                    }
                });
            }
        });

        const topCVEs = Array.from(cveMap.entries())
            .map(([cve, data]) => ({ cve, severity: data.severity, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const scanDetails = scans.map((scan: any) => ({
            id: scan.id || scan.scan_id,
            target: scan.target || scan.scan_name,
            status: scan.status || 'completed',
            scanner_type: scan.scanner_type || 'openvas',
            created_at: scan.created_at || scan.scanned_at,
            cvss_max: typeof scan.cvss_max === 'number' ? scan.cvss_max : Number(scan.cvss_max) || undefined,
            total_findings: (scan.critical_count || 0) + (scan.high_count || 0) + (scan.medium_count || 0) + (scan.low_count || 0) + (scan.info_count || 0),
            critical_count: scan.critical_count,
            high_count: scan.high_count,
            medium_count: scan.medium_count,
            low_count: scan.low_count,
            info_count: scan.info_count,
            vulnerabilities: scan.results?.vulnerabilities || []
        }));

        const mostRecentScan = scans.reduce((latest: any, scan: any) => {
            if (!latest || new Date(scan.created_at) > new Date(latest.created_at)) {
                return scan;
            }
            return latest;
        }, null);

        return {
            vulnerabilities,
            scansCompleted: scans.length,
            hostsScanned: data.totals?.total_hosts || uniqueHosts.size,
            topCVEs,
            scanDetails,
            lastUpdate: mostRecentScan?.created_at || new Date().toISOString()
        };
    },

    // Get Single Scan Detail
    getScanDetail: async (id: string): Promise<any> => {
        const { data } = await api.get(`/api/scans/${id}`);
        return data; // Returns summary info
    },

    // Get Scan Findings (New Endpoint)
    getScanFindings: async (id: string | number, options?: { domain?: string }): Promise<any[]> => {
        // Ensure we handle both numerical IDs and UUIDs correctly
        const isNumericString = typeof id === 'string' && /^\d+$/.test(id);
        const finalId = isNumericString ? parseInt(id as string, 10) : id;

        if (finalId === undefined || finalId === null || finalId === '' || (typeof finalId === 'number' && isNaN(finalId))) {
            console.error('Invalid ID provided to getScanFindings:', id);
            return [];
        }

        const params: Record<string, string> = {};
        if (options?.domain) {
            params.domain = options.domain;
        }

        const { data } = await api.get<{ findings: any[] }>(`/api/scans/${finalId}/findings`, { params });
        return data.findings || [];
    },

    // Get all findings across scans for incidents panel
    getAllScanFindings: async (
        query?: WazuhMetricsQuery,
        options?: {
            concurrency?: number;
            onChunk?: (chunk: any[], meta: { processed: number; total: number }) => void;
        }
    ): Promise<any[]> => {
        const { data } = await api.get('/api/scans', {
            params: {
                limit: 1000,
                ...buildRangeParams(query)
            }
        });

        const scans = Array.isArray(data?.scans) ? data.scans : [];
        if (scans.length === 0) return [];

        const scansSorted = [...scans].sort(sortScansByRecency);
        const concurrency = Math.max(1, Math.min(12, Number(options?.concurrency) || 6));
        const deduped = new Map<string, any>();
        const allFindings: any[] = [];

        const normalizeFindingsFromScan = async (scan: any) => {
                const scanId = pickId(scan?.id, scan?.scan_id);
                if (!scanId) return [];

                const embeddedFindings = extractEmbeddedFindings(scan);
                const findings = embeddedFindings.length > 0
                    ? embeddedFindings
                    : await providerApiService.getScanFindings(scanId).catch(() => []);
                const scannerType = normalizeScannerType(pickString(scan?.scanner_type, scan?.source_scanner_type) || 'other');
                const scannedAt = pickString(scan?.scanned_at, scan?.created_at);
                const logicalScanId = pickString(scan?.scan_id, scan?.external_scan_id) || String(scanId);

                return findings.map((finding: any, index: number) => ({
                    id: String(finding?.id ?? `${scanId}-${index + 1}`),
                    scanSummaryId: String(scanId),
                    scanId: logicalScanId,
                    scannerType,
                    name: pickString(finding?.name, finding?.title, finding?.description) || `Finding ${index + 1}`,
                    severity: normalizeSeverity(pickString(finding?.severity, finding?.priority, finding?.level)),
                    cve: pickString(finding?.cve) || 'N/A',
                    host: pickString(finding?.host, finding?.hostname, finding?.ip, finding?.target) || 'N/A',
                    port: pickString(finding?.port) || 'N/A',
                    protocol: pickString(finding?.protocol) || 'N/A',
                    description: pickString(finding?.description),
                    solution: pickString(finding?.solution),
                    impact: pickString(finding?.impact),
                    detectedAt: pickString(finding?.created_at, finding?.detected_at, finding?.timestamp, scannedAt) || new Date().toISOString()
                }));
        };

        for (let index = 0; index < scansSorted.length; index += concurrency) {
            const batch = scansSorted.slice(index, index + concurrency);
            const normalizedBatch = await Promise.all(batch.map(normalizeFindingsFromScan));
            const batchChunk: any[] = [];

            normalizedBatch.flat().forEach((finding: any) => {
                const key = `${finding.scanId}:${finding.id}`;
                if (!deduped.has(key)) {
                    deduped.set(key, finding);
                    batchChunk.push(finding);
                    allFindings.push(finding);
                }
            });

            if (batchChunk.length > 0) {
                options?.onChunk?.(batchChunk, {
                    processed: Math.min(index + batch.length, scansSorted.length),
                    total: scansSorted.length
                });
            }
        }

        return allFindings.sort((a, b) => {
            const left = new Date(a.detectedAt).getTime();
            const right = new Date(b.detectedAt).getTime();
            return right - left;
        });
    },

    // InsightVM Methods
    getInsightvmMetrics: async (query?: WazuhMetricsQuery): Promise<OpenvasMetrics> => {
        const { data } = await api.get('/api/scans', {
            params: {
                scanner_type: 'insightvm',
                limit: 100,
                ...buildRangeParams(query)
            }
        });

        const scans = data.scans || [];
        const vulnerabilities = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
        const cveMap = new Map<string, { severity: string; count: number; name: string }>();
        const uniqueHosts = new Set<string>();

        scans.forEach((scan: any) => {
            if (scan.status === 'completed') {
                const hostId = scan.target || scan.scan_name || (scan.meta_info?.taskId);
                if (hostId) uniqueHosts.add(hostId);

                if (scan.high_count !== undefined) {
                    vulnerabilities.critical += (scan.critical_count || 0);
                    vulnerabilities.high += (scan.high_count || 0);
                    vulnerabilities.medium += (scan.medium_count || 0);
                    vulnerabilities.low += (scan.low_count || 0);
                    vulnerabilities.info += (scan.info_count || 0);
                }
            }
        });

        const scanDetails = scans.map((scan: any) => ({
            id: scan.id || scan.scan_id,
            target: scan.target || scan.scan_name,
            status: scan.status || 'completed',
            scanner_type: scan.scanner_type || 'insightvm',
            created_at: scan.created_at || scan.scanned_at,
            cvss_max: typeof scan.cvss_max === 'number' ? scan.cvss_max : Number(scan.cvss_max) || undefined,
            total_findings: (scan.critical_count || 0) + (scan.high_count || 0) + (scan.medium_count || 0) + (scan.low_count || 0) + (scan.info_count || 0),
            vulnerabilities: scan.results?.vulnerabilities || []
        }));

        const topCVEs = Array.from(cveMap.entries())
            .map(([cve, data]) => ({ cve, severity: data.severity, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const scansCompleted = scans.filter((s: any) => s.status === 'completed').length;
        const trend_7_days = calculateTrend7Days(scans);

        // Aggregate totals if backend sent 0
        const totalVulnerabilities = Object.values(vulnerabilities).reduce((a, b) => a + b, 0);
        if (totalVulnerabilities === 0 && scanDetails.length > 0) {
            scanDetails.forEach((sd: any) => {
                const s = scans.find((os: any) => (os.id || os.scan_id) === sd.id);
                if (s) {
                    vulnerabilities.critical += (s.critical_count || 0);
                    vulnerabilities.high += (s.high_count || 0);
                    vulnerabilities.medium += (s.medium_count || 0);
                    vulnerabilities.low += (s.low_count || 0);
                    vulnerabilities.info += (s.info_count || 0);
                }
            });
        }

        const mostRecentScan = scans.reduce((latest: any, scan: any) => {
            if (!latest || new Date(scan.created_at) > new Date(latest.created_at)) {
                return scan;
            }
            return latest;
        }, null);

        return {
            vulnerabilities,
            scansCompleted,
            hostsScanned: uniqueHosts.size,
            topCVEs,
            trend_7_days,
            scanDetails: scanDetails.slice(0, 20),
            lastUpdate: mostRecentScan?.created_at || new Date().toISOString()
        };
    },

    getInsightvmCurrentState: async (): Promise<OpenvasMetrics> => {
        const { data } = await api.get('/api/scans/latest', {
            params: {
                scanner_type: 'insightvm'
            }
        });

        const scans = data.scans || [];
        const vulnerabilities = {
            critical: data.totals?.critical || 0,
            high: data.totals?.high || 0,
            medium: data.totals?.medium || 0,
            low: data.totals?.low || 0,
            info: data.totals?.info || 0
        };

        const uniqueHosts = new Set<string>();
        scans.forEach((scan: any) => {
            if (scan.target) uniqueHosts.add(scan.target);
        });

        const scanDetails = scans.map((scan: any) => ({
            id: scan.id,
            target: scan.target,
            status: scan.status,
            scanner_type: scan.scanner_type || 'insightvm',
            created_at: scan.created_at,
            total_findings: (scan.critical_count || 0) + (scan.high_count || 0) + (scan.medium_count || 0) + (scan.low_count || 0) + (scan.info_count || 0),
            vulnerabilities: scan.results?.vulnerabilities || []
        }));

        const mostRecentScan = scans.reduce((latest: any, scan: any) => {
            if (!latest || new Date(scan.created_at) > new Date(latest.created_at)) {
                return scan;
            }
            return latest;
        }, null);

        return {
            vulnerabilities,
            scansCompleted: scans.length,
            hostsScanned: data.totals?.total_hosts || uniqueHosts.size,
            topCVEs: [],
            scanDetails,
            lastUpdate: mostRecentScan?.created_at || new Date().toISOString()
        };
    },

    // Get OpenVAS Analytics (NEW - from dedicated analytics endpoint)
    getOpenvasAnalytics: async (query?: WazuhMetricsQuery): Promise<any> => {
        const { data } = await api.get('/api/scans/openvas/analytics', { params: buildRangeParams(query) });
        return data;
    },

    // Get InsightVM Analytics (NEW - from dedicated analytics endpoint)
    getInsightvmAnalytics: async (query?: WazuhMetricsQuery): Promise<any> => {
        const { data } = await api.get('/api/scans/insightvm/analytics', { params: buildRangeParams(query) });
        return data;
    }
};

const toSafeNumber = (value: unknown, fallback = 0) => {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const pickNumber = (...values: unknown[]) => {
    for (const value of values) {
        const num = typeof value === 'number' ? value : Number(value);
        if (Number.isFinite(num)) return num;
    }
    return 0;
};

const CANONICAL_SCANNERS = new Set([
    'openvas',
    'insightvm',
    'nessus',
    'qualys',
    'tenable',
    'rapid7',
    'zabbix',
    'uptime_kuma',
    'wazuh',
    'nmap',
    'other'
]);

const normalizeScannerType = (value: unknown) => {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'uptimekuma' || raw === 'uptime-kuma' || raw === 'uptime') return 'uptime_kuma';
    if (CANONICAL_SCANNERS.has(raw)) return raw;
    return 'other';
};

const normalizeSeverity = (value: unknown): 'critical' | 'high' | 'medium' | 'low' | 'info' => {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'critical' || raw === 'high' || raw === 'medium' || raw === 'low' || raw === 'info') {
        return raw;
    }
    return 'info';
};

const extractEmbeddedFindings = (scan: any): any[] => {
    const candidates = [
        scan?.results?.vulnerabilities,
        scan?.results?.findings,
        scan?.results,
        scan?.findings
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate) && candidate.length > 0) {
            return candidate;
        }
    }

    return [];
};

const dedupeScansById = (scans: any[]) => {
    const seen = new Set<string>();
    const unique: any[] = [];

    scans.forEach((scan) => {
        const id = pickId(scan?.id, scan?.scan_id, scan?.external_scan_id);
        if (!id) return;
        if (seen.has(id)) return;
        seen.add(id);
        unique.push(scan);
    });

    return unique;
};

const mapNessusTopCVEsFromFindings = (findings: any[]) => {
    const cveCounter = new Map<string, { severity: string; count: number }>();

    findings.forEach((finding: any) => {
        const rawCve = String(finding?.cve || '').trim();
        const normalized = /^CVE-\d{4}-\d+/i.test(rawCve) ? rawCve.toUpperCase() : '';
        if (!normalized) return;

        const severity = String(finding?.severity || 'info').toLowerCase();
        const current = cveCounter.get(normalized);
        if (current) {
            current.count += 1;
        } else {
            cveCounter.set(normalized, { severity, count: 1 });
        }
    });

    return Array.from(cveCounter.entries())
        .map(([cve, data]) => ({ cve, severity: data.severity, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
};

const mapNessusRecentFindings = (findings: any[]) => {
    return findings.slice(0, 16).map((finding: any, index: number) => ({
        id: String(finding?.id || finding?.oid || `nessus-finding-${index + 1}`),
        name: pickString(finding?.name, finding?.title, finding?.description) || `Finding ${index + 1}`,
        severity: String(finding?.severity || 'info').toLowerCase(),
        host: pickString(finding?.host, finding?.ip, finding?.target) || 'Activo no identificado',
        detectedAt: pickString(finding?.created_at, finding?.detected_at, finding?.timestamp) || new Date().toISOString()
    }));
};

const parseSnapshotSignatureMeta = (raw: unknown): Record<string, unknown> => {
    if (typeof raw !== 'string' || raw.trim().length === 0) return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? parsed as Record<string, unknown>
            : {};
    } catch {
        return {};
    }
};

const buildZabbixSnapshotTrend = (scans: any[]) => {
    const scansByDate = new Map<string, { hosts: number; problems: number; events: number; triggers: number }>();

    scans.forEach((scan: any) => {
        const meta = scan?.meta_info || scan?.meta || {};
        const signature = parseSnapshotSignatureMeta(meta?.snapshot_signature);
        const dateSource = scan?.scanned_at || scan?.created_at || meta?.collection_window_end || meta?.collection_window_start;
        if (!dateSource) return;

        const scanDate = new Date(dateSource).toISOString().split('T')[0];
        const current = scansByDate.get(scanDate);
        const point = {
            hosts: pickNumber(signature?.host_count, scan?.total_hosts, meta?.host_count),
            problems: pickNumber(signature?.problem_count),
            events: pickNumber(signature?.event_count),
            triggers: pickNumber(signature?.trigger_count)
        };

        if (!current) {
            scansByDate.set(scanDate, point);
            return;
        }

        scansByDate.set(scanDate, {
            hosts: Math.max(current.hosts, point.hosts),
            problems: Math.max(current.problems, point.problems),
            events: Math.max(current.events, point.events),
            triggers: Math.max(current.triggers, point.triggers)
        });
    });

    return Array.from(scansByDate.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const deriveHostsFromZabbixFindings = (findings: any[]) => {
    const set = new Set<string>();
    findings.forEach((finding: any) => {
        const rawHost = String(finding?.host || '').trim();
        if (!rawHost) return;
        rawHost
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .forEach((host) => set.add(host));
    });
    return Array.from(set);
};

const normalizeUptimePercentage = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    if (value <= 1) return Number((value * 100).toFixed(2));
    return Number(value.toFixed(2));
};

const parseUptimeFindingStatus = (finding: any): 'up' | 'down' | 'unknown' => {
    const fromFields = String(
        pickString(
            finding?.status,
            finding?.state,
            finding?.monitor_status,
            finding?.monitorState
        ) || ''
    ).toLowerCase();

    if (fromFields.includes('down')) return 'down';
    if (fromFields.includes('up')) return 'up';

    const text = `${String(finding?.name || '').toLowerCase()} ${String(finding?.description || '').toLowerCase()}`;
    if (/\bis down\b/.test(text) || /->\s*down/.test(text)) return 'down';
    if (/\bis up\b/.test(text) || /->\s*up/.test(text)) return 'up';

    const severity = String(finding?.severity || '').toLowerCase();
    if (severity === 'critical' || severity === 'high') return 'down';
    if (severity === 'low' || severity === 'info') return 'up';

    return 'unknown';
};

const extractUptimeMonitorName = (value: unknown) => {
    const raw = typeof value === 'string' ? value : '';
    if (!raw) return 'Servicio no identificado';
    const match = raw.match(/monitor\s+'([^']+)'/i);
    if (match?.[1]) return match[1];
    return raw.trim();
};

const mapUptimeIncidentsFromFindings = (findings: any[]) => {
    const incidents = findings
        .map((finding: any) => {
            const status = parseUptimeFindingStatus(finding);
            if (status !== 'down') return null;

            return {
                service: extractUptimeMonitorName(finding?.name),
                duration: 'Evento detectado',
                timestamp: pickString(finding?.created_at, finding?.timestamp, finding?.detected_at) || 'Sin registro'
            };
        })
        .filter(Boolean) as Array<{ service: string; duration: string; timestamp: string }>;

    const uniqueByService = new Map<string, { service: string; duration: string; timestamp: string }>();
    incidents.forEach((incident) => {
        if (!uniqueByService.has(incident.service)) {
            uniqueByService.set(incident.service, incident);
        }
    });

    return Array.from(uniqueByService.values()).slice(0, 20);
};

const buildUptimeTrendFromScans = (scans: any[]) => {
    const byDate = new Map<string, { ts: number; uptime: number; down: number }>();

    scans.forEach((scan: any) => {
        const dateSource = pickString(scan?.scanned_at, scan?.created_at);
        if (!dateSource) return;

        const scanDate = new Date(dateSource);
        if (Number.isNaN(scanDate.getTime())) return;

        const dayKey = scanDate.toISOString().slice(0, 10);
        const total = pickNumber(scan?.total_hosts, scan?.services_total, scan?.results?.total, scan?.results?.services_total);
        const meta = scan?.meta_info || scan?.meta || {};
        const downMonitorsCount = Array.isArray(meta?.down_monitors) ? meta.down_monitors.length : 0;
        let down = pickNumber(meta?.down_count, scan?.down_count, scan?.results?.down, scan?.results?.down_count, scan?.critical_count, downMonitorsCount);
        
        let up = pickNumber(meta?.up_count, scan?.up_count, scan?.results?.up, scan?.results?.up_count);
        if (up === 0 && total > 0) {
            up = Math.max(0, total - down);
        }
        if (up === 0) {
            up = pickNumber(scan?.low_count, scan?.info_count);
        }
        const uptimeFromRatio = normalizeUptimePercentage(pickNumber(scan?.meta_info?.avg_uptime_ratio_1d));
        const uptimeFromFields = normalizeUptimePercentage(
            pickNumber(scan?.uptime_percentage, scan?.uptime, scan?.results?.uptime_percentage, scan?.results?.uptime)
        );
        const computedUptime = total > 0 ? Number(((up / total) * 100).toFixed(2)) : 0;
        const uptime = uptimeFromRatio || uptimeFromFields || computedUptime;

        const current = byDate.get(dayKey);
        if (!current || scanDate.getTime() > current.ts) {
            byDate.set(dayKey, {
                ts: scanDate.getTime(),
                uptime,
                down
            });
        }
    });

    return Array.from(byDate.entries())
        .map(([date, data]) => ({
            date,
            uptime: data.uptime,
            down: data.down
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
};

const pickString = (...values: unknown[]) => {
    for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value;
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            return `${value.toFixed(1)}%`;
        }
    }
    return undefined;
};

const normalizeStatus = (status: unknown) => {
    if (typeof status === 'string') return status;
    if (typeof status === 'number') return status === 1 ? 'Online' : 'Offline';
    if (typeof status === 'boolean') return status ? 'Online' : 'Offline';
    return 'Unknown';
};

const pickId = (...values: unknown[]) => {
    for (const value of values) {
        if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            return String(value);
        }
    }
    return undefined;
};

const getScanFindingTotal = (scan: any) => {
    if (!scan) return 0;
    return pickNumber(scan?.critical_count, scan?.disaster_count, 0)
        + pickNumber(scan?.high_count)
        + pickNumber(scan?.medium_count, scan?.average_count)
        + pickNumber(scan?.low_count, scan?.warning_count)
        + pickNumber(scan?.info_count);
};

const sortScansByRecency = (left: any, right: any) => {
    const leftDate = new Date(String(left?.scanned_at || left?.created_at || 0)).getTime();
    const rightDate = new Date(String(right?.scanned_at || right?.created_at || 0)).getTime();
    return rightDate - leftDate;
};

const toDayBounds = (base: Date) => {
    const start = new Date(base);
    start.setHours(0, 0, 0, 0);
    const end = new Date(base);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

const getRangeLabel = (preset: DashboardRangePreset, from?: string, to?: string) => {
    if (preset === 'today') return 'Hoy';
    if (preset === 'yesterday') return 'Ayer';
    if (preset === '7d') return 'Ultimos 7 dias';
    if (preset === '30d') return 'Ultimos 30 dias';
    if (preset === 'custom' && from && to) return `${from} -> ${to}`;
    return 'Ultimos 30 dias';
};

const buildRangeParams = (query?: WazuhMetricsQuery) => {
    const preset = query?.preset || '30d';
    const params: Record<string, unknown> = {};

    if (preset === 'today') {
        const { start, end } = toDayBounds(new Date());
        params.start_date = start.toISOString();
        params.end_date = end.toISOString();
        params.days = 1;
        return params;
    }

    if (preset === 'yesterday') {
        const base = new Date();
        base.setDate(base.getDate() - 1);
        const { start, end } = toDayBounds(base);
        params.start_date = start.toISOString();
        params.end_date = end.toISOString();
        params.days = 1;
        return params;
    }

    if (preset === '30d') {
        params.days = 30;
        return params;
    }

    if (preset === 'custom' && query?.from && query?.to) {
        const start = new Date(`${query.from}T00:00:00`);
        const end = new Date(`${query.to}T23:59:59.999`);
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            params.start_date = start.toISOString();
            params.end_date = end.toISOString();
            const diff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            params.days = diff;
            return params;
        }
    }

    params.days = 7;
    return params;
};

const normalizeWazuhAnalytics = (payload: any): WazuhMetrics => {
    const analytics = payload?.analyticsData?.data ?? payload?.analyticsData ?? payload?.data ?? payload;
    const latestState = payload?.latestStateData?.data ?? payload?.latestStateData ?? {};
    const historicalScansBlock = payload?.historicalScansData?.data ?? payload?.historicalScansData ?? {};
    const historicalScans = Array.isArray(historicalScansBlock?.scans) ? historicalScansBlock.scans : [];
    const latestFindings = Array.isArray(payload?.latestFindings) ? payload.latestFindings : [];
    const query: WazuhMetricsQuery = payload?.query || { preset: '30d' };
    const data = analytics;
    const configured = typeof data?.configured === 'boolean' ? data.configured : data?.success !== false;

    if (!configured) {
        return {
            activeAgents: 0,
            inactiveAgents: 0,
            topRules: [],
            alertsBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
            configured: false,
            message: pickString(data?.message, data?.detail, data?.error) || 'No hay historicos disponibles de Wazuh.'
        };
    }

    const currentTotals = latestState?.current_state_totals || latestState?.totals || {};
    const latestScans = Array.isArray(latestState?.scans) ? latestState.scans : [];
    const rangedHistoricalScans = dedupeScansById(historicalScans).sort(sortScansByRecency);

    let trend = Array.isArray(data?.trend_7_days) && data.trend_7_days.length > 0
        ? data.trend_7_days
        : Array.isArray(data?.trend7Days) && data.trend7Days.length > 0
            ? data.trend7Days
            : calculateTrend7Days(rangedHistoricalScans);

    const latestDay = [...trend]
        .reverse()
        .find((day: any) => pickNumber(day?.critical, day?.high, day?.medium, day?.low, day?.info) > 0);
    const hostDistribution = data?.hostDistribution || data?.host_distribution || {};

    const topRulesSource = Array.isArray(data?.topRules)
        ? data.topRules
        : Array.isArray(data?.top_rules)
            ? data.top_rules
            : [];

    const preferredCurrentScan = payload?.preferredCurrentScan;
    const latestScan = latestScans[0];
    const latestScanWithFindings = preferredCurrentScan
        || latestScans.find((scan: any) => getScanFindingTotal(scan) > 0)
        || rangedHistoricalScans.find((scan: any) => getScanFindingTotal(scan) > 0)
        || latestScan
        || rangedHistoricalScans[0];

    const buildSeverityTotals = (source: any) => ({
        critical: pickNumber(source?.critical_count, source?.disaster_count, source?.critical),
        high: pickNumber(source?.high_count, source?.high),
        medium: pickNumber(source?.medium_count, source?.average_count, source?.medium),
        low: pickNumber(source?.low_count, source?.warning_count, source?.low),
        info: pickNumber(source?.info_count, source?.info)
    });

    const sumSeverityTotals = (totals: { critical: number; high: number; medium: number; low: number; info: number }) => (
        totals.critical + totals.high + totals.medium + totals.low + totals.info
    );

    const dominantSeverity = (totals: { critical: number; high: number; medium: number; low: number; info: number }) => {
        const entries = [
            ['critical', totals.critical],
            ['high', totals.high],
            ['medium', totals.medium],
            ['low', totals.low],
            ['info', totals.info]
        ] as const;
        const [key, value] = entries.sort((left, right) => right[1] - left[1])[0];
        return value > 0 ? key : 'none';
    };

    const parseJsonRecord = (value: unknown) => {
        if (typeof value !== 'string' || value.trim().length === 0) return {} as Record<string, any>;
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                ? parsed as Record<string, any>
                : {};
        } catch {
            return {} as Record<string, any>;
        }
    };

    const mapTopItems = (items: any[], total: number, labelKeys: string[]) => items
        .map((item: any, index: number) => {
            const name = pickString(...labelKeys.map((key) => item?.[key])) || `Item ${index + 1}`;
            const count = pickNumber(item?.count, item?.total, item?.hits, item?.occurrences, item?.value);
            return {
                name,
                count,
                sharePct: total > 0 ? Math.round((count / total) * 100) : 0
            };
        })
        .filter((item: { name: string; count: number }) => item.name)
        .sort((left: { count: number }, right: { count: number }) => right.count - left.count)
        .slice(0, 5);

    const deriveTopAgentsFromFindings = (findings: any[], total: number) => {
        const counts = new Map<string, number>();
        findings.forEach((finding: any) => {
            const host = pickString(finding?.host, finding?.agent?.name, finding?.hostname);
            if (!host) return;
            counts.set(host, (counts.get(host) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([name, count]) => ({ name, count, sharePct: total > 0 ? Math.round((count / total) * 100) : 0 }))
            .sort((left, right) => right.count - left.count)
            .slice(0, 5);
    };

    const currentSnapshot = {
        scanId: pickId(latestScanWithFindings?.id, latestScanWithFindings?.scan_id),
        scannedAt: pickString(latestScanWithFindings?.scanned_at, latestScanWithFindings?.created_at),
        alertsBySeverity: buildSeverityTotals({
            ...currentTotals,
            ...latestScanWithFindings
        }),
        totalAlerts: 0
    };
    currentSnapshot.totalAlerts = sumSeverityTotals(currentSnapshot.alertsBySeverity);

    const totalsFromTrend = trend.reduce(
        (acc: { critical: number; high: number; medium: number; low: number; info: number }, day: any) => ({
            critical: acc.critical + pickNumber(day?.critical),
            high: acc.high + pickNumber(day?.high),
            medium: acc.medium + pickNumber(day?.medium),
            low: acc.low + pickNumber(day?.low),
            info: acc.info + pickNumber(day?.info)
        }),
        { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    );

    const totalsFromHistoricalScans = historicalScans.reduce(
        (acc: { critical: number; high: number; medium: number; low: number; info: number }, scan: any) => ({
            critical: acc.critical + pickNumber(scan?.critical_count, scan?.disaster_count),
            high: acc.high + pickNumber(scan?.high_count),
            medium: acc.medium + pickNumber(scan?.medium_count, scan?.average_count),
            low: acc.low + pickNumber(scan?.low_count, scan?.warning_count),
            info: acc.info + pickNumber(scan?.info_count)
        }),
        { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    );

    const hasTrendTotals = Object.values(totalsFromTrend).some((value) => Number(value) > 0);
    const cutRows = rangedHistoricalScans.map((scan: any) => {
        const severityTotals = buildSeverityTotals(scan);
        const meta = scan?.meta_info || scan?.meta || {};
        const topRulesRaw = Array.isArray(meta?.tops?.top_rules) ? meta.tops.top_rules : [];
        const topAgentsRaw = Array.isArray(meta?.tops?.top_agents) ? meta.tops.top_agents : [];

        return {
            id: String(pickId(scan?.id, scan?.scan_id) || ''),
            scanId: pickId(scan?.scan_id, scan?.id) || null,
            scanName: pickString(scan?.scan_name, scan?.target, scan?.scan_id) || 'Wazuh scan',
            scannedAt: pickString(scan?.scanned_at, scan?.created_at) || null,
            status: pickString(scan?.status) || 'completed',
            agentName: pickString(scan?.agent_name, scan?.agent, topAgentsRaw[0]?.name, topAgentsRaw[0]?.agent) || null,
            totalEvents: getScanFindingTotal(scan),
            severityTotals,
            topRule: pickString(topRulesRaw[0]?.desc, topRulesRaw[0]?.name, topRulesRaw[0]?.rule, topRulesRaw[0]?.description) || null,
            topAgent: pickString(topAgentsRaw[0]?.name, topAgentsRaw[0]?.agent, topAgentsRaw[0]?.label) || null,
            sendReason: pickString(meta?.send_reason, scan?.send_reason) || null,
            snapshotMode: pickString(meta?.snapshot_mode, scan?.snapshot_mode) || null
        };
    });

    const historicalTotals = cutRows.reduce(
        (acc, cut) => ({
            critical: acc.critical + cut.severityTotals.critical,
            high: acc.high + cut.severityTotals.high,
            medium: acc.medium + cut.severityTotals.medium,
            low: acc.low + cut.severityTotals.low,
            info: acc.info + cut.severityTotals.info
        }),
        hasTrendTotals && cutRows.length === 0
            ? totalsFromTrend
            : { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    );

    const analyticsRecentFindings = Array.isArray(data?.recentFindings)
        ? data.recentFindings
        : Array.isArray(data?.recent_findings)
            ? data.recent_findings
            : latestFindings;
    const recentFindings = analyticsRecentFindings.slice(0, 8).map((finding: any, index: number) => ({
        id: String(finding?.id ?? finding?.dedup_id ?? `finding-${index + 1}`),
        name: pickString(finding?.name, finding?.description, finding?.rule?.description, finding?.title) || `Hallazgo ${index + 1}`,
        severity: pickString(finding?.severity, finding?.priority, finding?.level) || 'info',
        host: pickString(finding?.host, finding?.agent?.name, finding?.hostname),
        detectedAt: pickString(finding?.created_at, finding?.timestamp, latestScanWithFindings?.scanned_at)
    }));

    const topRules = topRulesSource.length > 0
        ? topRulesSource
            .map((item: any, index: number) => ({
                rule: pickString(
                    item?.desc,
                    item?.rule,
                    item?.description,
                    item?.name,
                    item?.title,
                    item?.rule?.description
                ) || `Regla ${index + 1}`,
                count: pickNumber(item?.count, item?.total, item?.hits, item?.occurrences, 0)
            }))
            .filter((item: { rule: string; count: number }) => item.rule)
            .slice(0, 5)
        : deriveTopRulesFromFindings(latestFindings);

    const latestMeta = latestScanWithFindings?.meta_info || latestScanWithFindings?.meta || {};
    const latestSignature = parseJsonRecord(latestMeta?.snapshot_signature);
    const snapshotTopRules = Array.isArray(latestMeta?.tops?.top_rules)
        ? mapTopItems(latestMeta.tops.top_rules, currentSnapshot.totalAlerts, ['desc', 'name', 'rule', 'description'])
        : topRules.map((item) => ({
            name: item.rule,
            count: item.count,
            sharePct: currentSnapshot.totalAlerts > 0 ? Math.round((item.count / currentSnapshot.totalAlerts) * 100) : 0
        }));
    const snapshotTopAgents = Array.isArray(latestMeta?.tops?.top_agents)
        ? mapTopItems(latestMeta.tops.top_agents, currentSnapshot.totalAlerts, ['name', 'agent', 'label'])
        : deriveTopAgentsFromFindings(latestFindings, currentSnapshot.totalAlerts);

    const agentInfoRaw = data?.agentInfo || data?.agent_info;
    const agentLastUsed = pickString(agentInfoRaw?.lastUsed, agentInfoRaw?.last_used);
    const agentInfo = agentInfoRaw?.name && agentLastUsed
        ? { name: String(agentInfoRaw.name), lastUsed: String(agentLastUsed) }
        : undefined;

    const cutTotals = cutRows.map((cut) => cut.totalEvents).filter((value) => Number.isFinite(value));
    const sortedCutTotals = [...cutTotals].sort((left, right) => left - right);
    const medianEventsPerCut = sortedCutTotals.length === 0
        ? 0
        : sortedCutTotals.length % 2 === 1
            ? sortedCutTotals[Math.floor(sortedCutTotals.length / 2)]
            : (sortedCutTotals[(sortedCutTotals.length / 2) - 1] + sortedCutTotals[sortedCutTotals.length / 2]) / 2;
    const scanDates = cutRows
        .map((cut) => cut.scannedAt ? new Date(cut.scannedAt).getTime() : NaN)
        .filter((value) => Number.isFinite(value))
        .sort((left, right) => right - left);
    const cadenceDiffs = scanDates
        .slice(0, -1)
        .map((value, index) => Math.round((value - scanDates[index + 1]) / (1000 * 60)))
        .filter((value) => Number.isFinite(value) && value >= 0)
        .sort((left, right) => left - right);
    const scanCadenceMinutesMedian = cadenceDiffs.length === 0
        ? null
        : cadenceDiffs.length % 2 === 1
            ? cadenceDiffs[Math.floor(cadenceDiffs.length / 2)]
            : Math.round((cadenceDiffs[(cadenceDiffs.length / 2) - 1] + cadenceDiffs[cadenceDiffs.length / 2]) / 2);
    const historicalTotalEvents = sumSeverityTotals(historicalTotals);
    const criticalPressurePct = historicalTotalEvents > 0
        ? Math.round(((historicalTotals.critical + historicalTotals.high) / historicalTotalEvents) * 100)
        : 0;
    const noiseSharePct = historicalTotalEvents > 0
        ? Math.round(((historicalTotals.low + historicalTotals.info) / historicalTotalEvents) * 100)
        : 0;
    const uniqueAgentsInRange = new Set(cutRows.map((cut) => cut.agentName).filter((value): value is string => Boolean(value))).size;

    return {
        activeAgents: pickNumber(currentTotals.total_hosts, hostDistribution.totalUniqueHosts, hostDistribution.total_hosts),
        inactiveAgents: 0,
        topRules,
        alertsBySeverity: {
            critical: historicalTotals.critical,
            high: historicalTotals.high,
            medium: historicalTotals.medium,
            low: historicalTotals.low,
            info: historicalTotals.info
        },
        configured: true,
        status: 'Actual + historico',
        message: `Actual: ultimo scan (${currentSnapshot.scanId || 'sin id'}). Historico: ${getRangeLabel(query.preset || '7d', query.from, query.to)}.`,
        hostsReported: pickNumber(currentTotals.total_hosts, hostDistribution.totalUniqueHosts, hostDistribution.total_hosts),
        avgFindingsPerHost: pickNumber(hostDistribution.avgVulnerabilitiesPerHost, hostDistribution.avg_vulnerabilities_per_host),
        mostCriticalHost: historicalTotals.critical > 0
            ? (hostDistribution?.mostCriticalHost || hostDistribution?.most_critical_host)
            : undefined,
        lastSync: pickString(latestScanWithFindings?.scanned_at, latestScanWithFindings?.created_at, latestDay?.date),
        agentInfo,
        recentFindings,
        scanDetails: rangedHistoricalScans.map((scan: any) => ({
            id: String(scan?.id ?? scan?.scan_id),
            target: pickString(scan?.scan_name, scan?.target, scan?.scan_id) || 'Wazuh scan',
            status: pickString(scan?.status) || 'completed',
            created_at: pickString(scan?.scanned_at, scan?.created_at) || '',
            total_findings: pickNumber(
                scan?.critical_count,
                scan?.disaster_count,
                0
            ) + pickNumber(scan?.high_count) + pickNumber(scan?.medium_count) + pickNumber(scan?.low_count) + pickNumber(scan?.info_count)
        })),
        trend7Days: trend.map((day: any) => ({
            date: String(day?.date || ''),
            critical: pickNumber(day?.critical),
            high: pickNumber(day?.high),
            medium: pickNumber(day?.medium),
            low: pickNumber(day?.low),
            info: pickNumber(day?.info)
        })),
        currentSnapshot,
        historyRangeLabel: getRangeLabel(query.preset || '7d', query.from, query.to),
        range: {
            preset: query.preset || '7d',
            from: query.from || null,
            to: query.to || null,
            days: pickNumber(query.preset === '30d' ? 30 : query.preset === 'today' || query.preset === 'yesterday' ? 1 : 7),
            label: getRangeLabel(query.preset || '7d', query.from, query.to)
        },
        integrationStatus: {
            configured: true,
            managerStatus: 'Actual + historico',
            activeAgents: pickNumber(currentTotals.total_hosts, hostDistribution.totalUniqueHosts, hostDistribution.total_hosts),
            inactiveAgents: 0,
            lastSync: pickString(latestScanWithFindings?.scanned_at, latestScanWithFindings?.created_at, latestDay?.date) || null,
            agentName: pickString(agentInfo?.name, latestScanWithFindings?.agent_name) || null
        },
        historical: {
            totalScans: Math.max(pickNumber(historicalScansBlock?.count, historicalScansBlock?.total), cutRows.length),
            totalEvents: historicalTotalEvents,
            severityTotals: historicalTotals,
            criticalPressurePct,
            noiseSharePct,
            avgEventsPerCut: cutRows.length > 0 ? Number((historicalTotalEvents / cutRows.length).toFixed(1)) : 0,
            peakCutEvents: cutTotals.length > 0 ? Math.max(...cutTotals) : 0,
            medianEventsPerCut,
            scanCadenceMinutesMedian,
            cuts: cutRows
        },
        snapshot: {
            scanSummaryId: pickId(latestScanWithFindings?.id, latestScanWithFindings?.scan_id) || null,
            scanId: pickId(latestScanWithFindings?.scan_id, latestScanWithFindings?.id) || null,
            scanName: pickString(latestScanWithFindings?.scan_name, latestScanWithFindings?.target, latestScanWithFindings?.scan_id) || null,
            agentName: pickString(latestScanWithFindings?.agent_name, snapshotTopAgents[0]?.name) || null,
            scannedAt: pickString(latestScanWithFindings?.scanned_at, latestScanWithFindings?.created_at) || null,
            windowStart: pickString(latestMeta?.window_start, latestSignature?.window_start, latestSignature?.start_date) || null,
            windowEnd: pickString(latestMeta?.window_end, latestSignature?.window_end, latestSignature?.end_date) || null,
            totalEvents: currentSnapshot.totalAlerts,
            severityTotals: currentSnapshot.alertsBySeverity,
            dominantSeverity: dominantSeverity(currentSnapshot.alertsBySeverity),
            topRules: snapshotTopRules,
            topAgents: snapshotTopAgents,
            sendReason: pickString(latestMeta?.send_reason, latestScanWithFindings?.send_reason) || null,
            snapshotMode: pickString(latestMeta?.snapshot_mode, latestScanWithFindings?.snapshot_mode) || null
        },
        analytics: {
            trend: trend.map((day: any) => ({
                date: String(day?.date || ''),
                critical: pickNumber(day?.critical),
                high: pickNumber(day?.high),
                medium: pickNumber(day?.medium),
                low: pickNumber(day?.low),
                info: pickNumber(day?.info),
                total: pickNumber(day?.total) || (
                    pickNumber(day?.critical)
                    + pickNumber(day?.high)
                    + pickNumber(day?.medium)
                    + pickNumber(day?.low)
                    + pickNumber(day?.info)
                )
            })),
            uniqueAgentsInRange: pickNumber(hostDistribution.totalUniqueHosts, hostDistribution.total_hosts, uniqueAgentsInRange),
            avgEventsPerAgentInRange: pickNumber(hostDistribution.avgVulnerabilitiesPerHost, hostDistribution.avg_vulnerabilities_per_host, uniqueAgentsInRange > 0 ? historicalTotalEvents / uniqueAgentsInRange : 0),
            mostPressuredAgent: historicalTotals.critical > 0
                ? (hostDistribution?.mostCriticalHost || hostDistribution?.most_critical_host)
                : undefined,
            recentEvents: recentFindings
        }
    };
};

const deriveTopRulesFromFindings = (findings: any[]): Array<{ rule: string; count: number }> => {
    const rules = new Map<string, number>();

    findings.forEach((finding: any) => {
        const rawLabel = pickString(
            finding?.rule?.description,
            finding?.description,
            finding?.name,
            finding?.title
        );
        const label = rawLabel
            ? rawLabel.replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim()
            : undefined;

        if (!label) return;
        rules.set(label, (rules.get(label) || 0) + 1);
    });

    return Array.from(rules.entries())
        .map(([rule, count]) => ({ rule, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
};

const normalizeZabbixAnalytics = (payload: any): ZabbixFullMetrics => {
    const data = payload?.data ?? payload;
    const configured = typeof data?.configured === 'boolean' ? data.configured : data?.success !== false;

    if (!configured) {
        return {
            configured: false,
            message: data?.message || data?.detail || data?.error
        };
    }

    const summarySource = data?.summary || data?.metrics || {};
    const hostDistribution = data?.hostDistribution || data?.host_distribution || {};
    const recentFindings = Array.isArray(data?.recentFindings)
        ? data.recentFindings
        : Array.isArray(data?.recent_findings)
            ? data.recent_findings
            : [];

    const uniqueHostsFromFindings = Array.from(
        new Set(
            recentFindings
                .map((finding: any) => finding?.host)
                .filter((host: any) => typeof host === 'string' && host.trim().length > 0)
        )
    );

    const hostsCount = pickNumber(
        hostDistribution.totalUniqueHosts,
        hostDistribution.total_hosts,
        summarySource.hosts,
        data?.hosts_total,
        data?.hosts,
        data?.total_hosts,
        uniqueHostsFromFindings.length
    );

    const alertsCount = pickNumber(
        summarySource.alerts,
        data?.alerts_total,
        data?.alerts,
        data?.active_alerts,
        data?.problems,
        recentFindings.length
    );

    const avgVulnsPerHost = pickNumber(
        hostDistribution.avgVulnerabilitiesPerHost,
        hostDistribution.avg_vulnerabilities_per_host,
        summarySource.avgCpu,
        summarySource.cpu
    );

    const cvssValues = recentFindings
        .map((finding: any) => toSafeNumber(finding?.cvss, NaN))
        .filter((value: number) => Number.isFinite(value));
    const avgCvssFromFindings = cvssValues.length > 0
        ? cvssValues.reduce((total: number, value: number) => total + value, 0) / cvssValues.length
        : 0;

    const summary = {
        alerts: alertsCount,
        hosts: hostsCount,
        avgCpu: avgVulnsPerHost || (hostsCount > 0 ? alertsCount / hostsCount : 0),
        avgRam: pickNumber(summarySource.avgRam, summarySource.ram, data?.avg_ram, data?.ram, avgCvssFromFindings)
    };

    const metrics = {
        cpu: pickNumber(data?.metrics?.cpu, summary.avgCpu),
        ram: pickNumber(data?.metrics?.ram, summary.avgRam),
        uptime: pickString(data?.metrics?.uptime, data?.uptime, data?.uptime_percentage, summarySource.uptime) || '—'
    };

    const hostsRaw = Array.isArray(data?.hosts)
        ? data.hosts
        : Array.isArray(data?.host_list)
            ? data.host_list
            : Array.isArray(data?.hosts_list)
                ? data.hosts_list
                : Array.isArray(data?.items?.hosts)
                    ? data.items.hosts
                    : uniqueHostsFromFindings.map((host: unknown, index: number) => ({
                        id: `host-${index + 1}`,
                        name: String(host),
                        status: 'Reported'
                    }));

    const hosts = hostsRaw.map((host: any, index: number) => {
        const id = host?.id ?? host?.hostid ?? host?.host_id ?? host?.hostId ?? host?.name ?? `host-${index + 1}`;
        const name = host?.name ?? host?.host ?? host?.hostname ?? host?.display_name ?? `Host ${index + 1}`;
        const status = normalizeStatus(host?.status ?? host?.state ?? host?.available ?? host?.online ?? host?.status_label);
        return {
            id: String(id),
            name: String(name),
            status: String(status)
        };
    });

    const alertsRaw = Array.isArray(data?.alerts)
        ? data.alerts
        : Array.isArray(data?.problems)
            ? data.problems
            : Array.isArray(data?.events)
                ? data.events
                : Array.isArray(data?.alert_list)
                    ? data.alert_list
                    : recentFindings;

    const alerts = alertsRaw.map((alert: any, index: number) => {
        const id = alert?.id ?? alert?.triggerid ?? alert?.eventid ?? alert?.problemid ?? alert?.alertid ?? `alert-${index + 1}`;
        const description = alert?.description ?? alert?.name ?? alert?.title ?? alert?.problem ?? 'Alerta';
        const priority = alert?.priority ?? alert?.severity ?? alert?.level ?? alert?.importance ?? '0';
        const host = alert?.host ?? alert?.hostname ?? alert?.host_name ?? alert?.source ?? '—';
        return {
            id: String(id),
            description: String(description),
            priority: String(priority),
            host: String(host),
            cvss: toSafeNumber(alert?.cvss, undefined),
            detectedAt: alert?.detectedAt ?? alert?.detected_at
        };
    });

    summary.hosts = Math.max(summary.hosts, hosts.length);
    summary.alerts = Math.max(summary.alerts, alerts.length);

    const agentInfoRaw = data?.agentInfo || data?.agent_info;
    const agentLastUsed = agentInfoRaw?.lastUsed ?? agentInfoRaw?.last_used;
    const agentInfo = agentInfoRaw?.name && agentLastUsed
        ? { name: String(agentInfoRaw.name), lastUsed: String(agentLastUsed) }
        : undefined;

    return {
        configured: true,
        summary,
        hosts,
        alerts,
        metrics,
        agentInfo,
        trendPoints: []
    };
};

const normalizeZabbixFullMetrics = (payload: any): ZabbixFullMetrics => {
    const analyticsData = payload?.analyticsData?.data ?? payload?.analyticsData ?? {};
    const latestState = payload?.latestStateData?.data ?? payload?.latestStateData ?? {};
    const historicalScansBlock = payload?.historicalScansData?.data ?? payload?.historicalScansData ?? {};
    const latestFindings = Array.isArray(payload?.latestFindings) ? payload.latestFindings : [];
    const latestScans = Array.isArray(latestState?.scans) ? latestState.scans : [];
    const historicalScans = Array.isArray(historicalScansBlock?.scans) ? historicalScansBlock.scans : [];
    const mergedScans = dedupeScansById([...latestScans, ...historicalScans]).sort(sortScansByRecency);
    const preferredScan = payload?.preferredScan || mergedScans[0] || null;
    const preferredMeta = preferredScan?.meta_info || preferredScan?.meta || {};
    const signatureMeta = parseSnapshotSignatureMeta(preferredMeta?.snapshot_signature);

    if (mergedScans.length === 0 && latestFindings.length === 0 && Object.keys(analyticsData || {}).length > 0) {
        return normalizeZabbixAnalytics(analyticsData);
    }

    const configuredByAnalytics = typeof analyticsData?.configured === 'boolean'
        ? analyticsData.configured
        : analyticsData?.success !== false;
    const configured = configuredByAnalytics || mergedScans.length > 0 || latestFindings.length > 0;

    if (!configured) {
        return {
            configured: false,
            message: analyticsData?.message || analyticsData?.detail || analyticsData?.error || 'No hay telemetria de Zabbix.'
        };
    }

    const summaryFromAnalytics = analyticsData?.summary || analyticsData?.metrics || {};
    const scanHosts = pickNumber(preferredScan?.total_hosts, signatureMeta?.host_count, preferredMeta?.host_count);
    const scanAlerts = pickNumber(
        preferredScan?.critical_count, 0
    ) + pickNumber(preferredScan?.high_count) + pickNumber(preferredScan?.medium_count) + pickNumber(preferredScan?.low_count) + pickNumber(preferredScan?.info_count);
    const snapshotMeta = {
        summaryType: pickString(preferredScan?.summary_type),
        scannedAt: pickString(preferredScan?.scanned_at, preferredScan?.created_at),
        collectedAt: pickString(preferredMeta?.collection_window_end, preferredMeta?.collection_window_start),
        hostCount: pickNumber(signatureMeta?.host_count, preferredScan?.total_hosts, preferredMeta?.host_count),
        problemCount: pickNumber(signatureMeta?.problem_count),
        eventCount: pickNumber(signatureMeta?.event_count),
        triggerCount: pickNumber(signatureMeta?.trigger_count),
        snapshotChanged: Boolean(preferredMeta?.snapshot_changed),
        sendReason: pickString(preferredMeta?.send_reason),
        snapshotMode: pickString(preferredMeta?.snapshot_mode),
        schemaVersion: pickString(preferredMeta?.schema_version),
        integrationVersion: pickString(preferredMeta?.integration_version),
        madVersion: pickString(preferredMeta?.mad_version),
        source: pickString(preferredMeta?.source, preferredMeta?.raw_source)
    };
    const trendPoints = buildZabbixSnapshotTrend(mergedScans);

    const findingsAsAlerts = latestFindings.map((finding: any, index: number) => ({
        id: String(finding?.id ?? finding?.oid ?? `zbx-f-${index + 1}`),
        description: String(pickString(finding?.name, finding?.description, finding?.title) || `Alerta ${index + 1}`),
        priority: String(finding?.severity || finding?.priority || finding?.level || '0'),
        host: String(pickString(finding?.host, finding?.hostname, finding?.source) || '—'),
        cvss: toSafeNumber(finding?.cvss, undefined),
        detectedAt: pickString(finding?.created_at, finding?.detected_at, finding?.timestamp)
    }));

    const hostsFromFindings = deriveHostsFromZabbixFindings(latestFindings);
    const hostsFromAnalytics = Array.isArray(analyticsData?.hosts)
        ? analyticsData.hosts
        : Array.isArray(analyticsData?.host_list)
            ? analyticsData.host_list
            : [];
    const hostRows = hostsFromAnalytics.length > 0
        ? hostsFromAnalytics.map((host: any, index: number) => ({
            id: String(host?.id ?? host?.hostid ?? host?.host_id ?? host?.name ?? `host-${index + 1}`),
            name: String(host?.name ?? host?.host ?? host?.hostname ?? `Host ${index + 1}`),
            status: String(normalizeStatus(host?.status ?? host?.state ?? host?.available ?? host?.online ?? host?.status_label))
        }))
        : hostsFromFindings.map((name, index) => ({
            id: `host-${index + 1}`,
            name: String(name),
            status: 'Reported'
        }));

    const alertsFromAnalytics = Array.isArray(analyticsData?.alerts)
        ? analyticsData.alerts
        : Array.isArray(analyticsData?.problems)
            ? analyticsData.problems
            : Array.isArray(analyticsData?.events)
                ? analyticsData.events
                : [];
    const alerts = (alertsFromAnalytics.length > 0 ? alertsFromAnalytics : findingsAsAlerts).map((alert: any, index: number) => ({
        id: String(alert?.id ?? alert?.triggerid ?? alert?.eventid ?? alert?.problemid ?? alert?.alertid ?? `alert-${index + 1}`),
        description: String(alert?.description ?? alert?.name ?? alert?.title ?? alert?.problem ?? 'Alerta'),
        priority: String(alert?.priority ?? alert?.severity ?? alert?.level ?? alert?.importance ?? '0'),
        host: String(alert?.host ?? alert?.hostname ?? alert?.host_name ?? alert?.source ?? '—'),
        cvss: toSafeNumber(alert?.cvss, undefined),
        detectedAt: alert?.detectedAt ?? alert?.detected_at ?? alert?.created_at
    }));

    const hostsCount = pickNumber(
        summaryFromAnalytics?.hosts,
        analyticsData?.hosts_total,
        analyticsData?.total_hosts,
        scanHosts,
        hostRows.length
    );
    const alertsCount = pickNumber(
        summaryFromAnalytics?.alerts,
        analyticsData?.alerts_total,
        analyticsData?.active_alerts,
        scanAlerts,
        alerts.length
    );

    const avgCvssFromAlerts = alerts
        .map((item: { cvss?: number }) => toSafeNumber(item.cvss, NaN))
        .filter((value: number) => Number.isFinite(value))
        .reduce((acc: number, value: number, _idx: number, arr: number[]) => acc + (value / arr.length), 0);

    const summary = {
        alerts: Math.max(alertsCount, alerts.length),
        hosts: Math.max(hostsCount, hostRows.length),
        avgCpu: pickNumber(summaryFromAnalytics?.avgCpu, summaryFromAnalytics?.cpu, alertsCount > 0 && hostsCount > 0 ? alertsCount / hostsCount : 0),
        avgRam: pickNumber(summaryFromAnalytics?.avgRam, summaryFromAnalytics?.ram, avgCvssFromAlerts)
    };

    const metrics = {
        cpu: pickNumber(analyticsData?.metrics?.cpu, summary.avgCpu),
        ram: pickNumber(analyticsData?.metrics?.ram, summary.avgRam),
        uptime: pickString(analyticsData?.metrics?.uptime, analyticsData?.uptime, analyticsData?.uptime_percentage, summaryFromAnalytics?.uptime) || '—'
    };

    const agentInfoRaw = analyticsData?.agentInfo || analyticsData?.agent_info;
    const agentLastUsed = agentInfoRaw?.lastUsed ?? agentInfoRaw?.last_used;
    const agentInfo = agentInfoRaw?.name && agentLastUsed
        ? { name: String(agentInfoRaw.name), lastUsed: String(agentLastUsed) }
        : undefined;

    return {
        configured: true,
        summary,
        hosts: hostRows,
        alerts,
        metrics,
        agentInfo,
        snapshotMeta,
        trendPoints
    };
};

// Helper function to calculate trend (only days with actual scans)
function calculateTrend7Days(scans: any[]): Array<{ date: string; critical: number; high: number; medium: number; low: number; info: number }> {
    const scansByDate = new Map<string, { critical: number; high: number; medium: number; low: number; info: number }>();

    scans.forEach((scan: any) => {
        const meta = scan?.meta_info || scan?.meta || {};
        const signature = parseSnapshotSignatureMeta(meta?.snapshot_signature);
        const dateSource = scan?.created_at || scan?.scanned_at || signature?.window_start || signature?.window_end;
        
        if ((scan.status === 'completed' || !scan.status) && dateSource) {
            const scanDate = new Date(dateSource).toISOString().split('T')[0];

            if (!scansByDate.has(scanDate)) {
                scansByDate.set(scanDate, { critical: 0, high: 0, medium: 0, low: 0, info: 0 });
            }

            const dayData = scansByDate.get(scanDate)!;

            // Use summary counts if available (New Backend Format)
            if (scan.high_count !== undefined) {
                dayData.critical += (scan.critical_count || 0);
                dayData.high += (scan.high_count || 0);
                dayData.medium += (scan.medium_count || 0);
                dayData.low += (scan.low_count || 0);
                dayData.info += (scan.info_count || 0);
            }
            // Fallback to iterating results
            else if (scan.results) {
                const results = scan.results.vulnerabilities || scan.results;
                if (Array.isArray(results)) {
                    results.forEach((vuln: any) => {
                        const severity = (vuln.severity || vuln.threat || '').toLowerCase();
                        if (severity === 'critical') dayData.critical++;
                        else if (severity === 'high') dayData.high++;
                        else if (severity === 'medium') dayData.medium++;
                        else if (severity === 'low') dayData.low++;
                        else dayData.info++;
                    });
                }
            }
        }
    });

    // Convert map to array and sort by date
    return Array.from(scansByDate.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

