// API Response Types matching backend documentation
import type { PlanStatus, User } from './index';

export interface BackendUser {
    id: number;
    username: string;
    email: string;
    role: 'ADMIN' | 'USER' | 'SUPERADMIN';
    company_id: number;
    plan_status?: PlanStatus;
    company?: {
        id: number;
        name: string;
        plan_status?: PlanStatus;
    };
}

export interface LoginResponse {
    message: string;
    user: BackendUser;
    access_token: string;
    refresh_token: string;
}

export interface RegisterResponse {
    message: string;
    user: BackendUser;
    access_token: string;
    refresh_token: string;
}



// Helper to convert backend user to frontend user
export function mapBackendUser(backendUser: BackendUser): User {
    const mappedRole = backendUser.role.toUpperCase() as 'ADMIN' | 'USER' | 'SUPERADMIN';
    console.log(`[AuthService] Mapping user role: ${backendUser.role} -> ${mappedRole}`);
    const planStatus = backendUser.plan_status || backendUser.company?.plan_status;
    return {
        id: backendUser.id.toString(),
        username: backendUser.username,
        email: backendUser.email,
        companyId: (backendUser.company_id ?? 0).toString(),
        role: mappedRole,
        planStatus
    };
}

// Integration Types
export interface Integration {
    id: number;
    company_id: number;
    provider: string;
    type?: string | null;
    capabilities?: any | null;
    config?: any | null;
    keyvault_secret_id?: string | null;
    extra_json?: any | null;
    created_at: string;
}

// Ticket Types

// Estructura real que VICTOR envía dentro de execution_logs (JSON)
export interface ExecutionLogsPayload {
    run_id?: string | null;
    correlation_id?: string | null;
    iterations?: number | null;
    duration_seconds?: number | null;
    final_result?: {
        status?: string | null;
        message?: string | null;
        stdout?: string | null;
        stderr?: string | null;
        artifact_path?: string | null;
    } | null;
    timeline?: Array<TimelineEvent> | null;
    decision_history?: Array<Record<string, unknown>> | null;
    [key: string]: unknown; // el backend acepta campos extra
}

export interface TimelineEvent {
    ts?: string | null;
    step?: string | null;
    status?: string | null;
    detail?: string | null;
}

export interface PendingDecision {
    decision_id: string;
    question: string;
    options: Array<{
        option_id: string;
        title: string;
        [key: string]: unknown;
    }>;
    recommended_option_id?: string | null;
    selected_option_id?: string | null;
    status?: 'PENDING' | 'SELECTED' | 'EXPIRED' | 'CANCELLED';
}

export interface Ticket {
    id: number;
    company_id: number;
    created_by_user_id?: number | null;
    subject: string;
    description?: string;
    status: 'PENDING' | 'DERIVED' | 'PREAPROBADO' | 'APROBADO' | 'RECHAZADO' | 'EN_EJECUCION' | 'RESUELTO' | 'FALLIDO' | 'EXECUTED' | 'FAILED' | 'APPROVED' | 'REJECTED' | 'RUNNING' | 'RESOLVED' | 'COMPLETED' | 'ERROR';
    action_plan?: {
        ticket_id?: number;
        summary?: string;
        steps?: Array<{
            id?: string;
            tool?: string;
            description?: string;
            parameters?: Record<string, unknown>;
        }>;
        metadata?: Record<string, unknown>;
    } | null;
    action_plan_version?: string | null;
    approved_at?: string | null;
    approved_by_user_id?: number | null;
    rejected_at?: string | null;
    rejected_by_user_id?: number | null;
    execution_logs?: ExecutionLogsPayload | Array<unknown> | string | null;
    execution_status?: string | null;
    execution_summary?: string | null;
    pending_decision?: PendingDecision | null;
    executed_at?: string | null;
    created_at: string;
    capability_level?: string | null;
    decision_timeout_minutes?: number | null;
    on_decision_timeout?: string | null;
    creator?: {
        id: number;
        username: string;
    };
}

// Alert Types
export interface Alert {
    id: number;
    company_id: number;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'active' | 'resolved';
    source: string;
    resolved_at?: string | null;
    resolved_by_user_id?: number | null;
    created_at: string;
}

// Analytics Types
export interface AnalyticsSummary {
    incidents_24h: number;
    avg_response_time_min: number;
    open_vulnerabilities: number;
    active_alerts: number;
    timestamp: string;
}

export interface IncidentsAnalytics {
    period_hours: number;
    total_incidents: number;
    by_severity: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    timestamp: string;
}

// Provider Summary Types (from /api/integrations/dashboard/summary)
export interface DashboardSummary {
    zabbix?: {
        configured: boolean;
        hosts?: number;
        alerts?: number;
        status?: string;
    };
    wazuh?: {
        configured: boolean;
        agents?: number;
        alerts?: {
            total: number;
            critical: number;
        };
    };
    nessus?: {
        configured: boolean;
        scans?: number;
        vulnerabilities?: {
            critical: number;
            high: number;
        };
    };
    uptime_kuma?: {
        configured: boolean;
        services?: {
            up: number;
            down: number;
        };
    };
    summary?: {
        total_integrations_configured: number;
        total_alerts: number;
        critical_vulnerabilities: number;
        services_down: number;
    };
}

// Agent Instance Types
export interface AgentInstance {
    id: number;
    company_id: number;
    agent_type: string;
    status: 'ACTIVE' | 'DISABLED';
    azure_project_id?: string;
    azure_agent_id?: string;
    azure_vector_store_id?: string;
    azure_openai_endpoint?: string;
    azure_openai_deployment?: string;
    azure_search_endpoint?: string;
    azure_speech_endpoint?: string;
    azure_speech_region?: string;
    azure_speech_voice_name?: string;
    settings?: any;
    last_used_at?: string;
    created_at: string;
}

// Zabbix Detailed Types
export interface ZabbixHost {
    id: string;
    name: string;
    status: string;
}

export interface ZabbixAlert {
    id: string;
    description: string;
    priority: string; // 0-5
    host: string;
    cvss?: number;
    detectedAt?: string;
}

export interface ZabbixSummary {
    alerts: number;
    hosts: number;
    avgCpu: number;
    avgRam: number;
}

export interface ZabbixMetrics {
    cpu: number;
    ram: number;
    uptime: string;
}

export interface ZabbixAgentInfo {
    name: string;
    lastUsed: string;
}

export interface ZabbixSnapshotMeta {
    summaryType?: string;
    scannedAt?: string;
    collectedAt?: string;
    hostCount: number;
    problemCount: number;
    eventCount: number;
    triggerCount: number;
    snapshotChanged: boolean;
    sendReason?: string;
    snapshotMode?: string;
    schemaVersion?: string;
    integrationVersion?: string;
    madVersion?: string;
    source?: string;
}

export interface ZabbixSnapshotTrendPoint {
    date: string;
    hosts: number;
    problems: number;
    events: number;
    triggers: number;
}

export interface ZabbixNotConfigured {
    configured: false;
    message?: string;
}

export interface ZabbixConfiguredMetrics {
    configured: true;
    summary: ZabbixSummary;
    hosts: ZabbixHost[];
    alerts: ZabbixAlert[];
    metrics: ZabbixMetrics;
    agentInfo?: ZabbixAgentInfo;
    snapshotMeta?: ZabbixSnapshotMeta;
    trendPoints?: ZabbixSnapshotTrendPoint[];
}

export type ZabbixFullMetrics = ZabbixConfiguredMetrics | ZabbixNotConfigured;

// Scanner Analytics Types (for OpenVAS/InsightVM)
export interface ScannerAnalytics {
    success: boolean;
    scanner_type: string;
    topCVEs: TopCVE[];
    trend_7_days: TrendDay[];
    hostDistribution: HostDistribution;
    recentFindings: RecentFinding[];
}

export interface TopCVE {
    cve_id: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    hosts_affected: number;
    cvss_score: number;
    impact_score: number;
}

export interface TrendDay {
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
}

export interface HostDistribution {
    totalUniqueHosts: number;
    avgVulnerabilitiesPerHost: number;
    mostCriticalHost?: {
        host: string;
        criticalCount: number;
    };
}

export interface RecentFinding {
    cve?: string;
    name: string;
    host: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    cvss?: number;
    detectedAt: string;
}
