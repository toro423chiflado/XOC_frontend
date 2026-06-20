export interface IntegrationCapabilityTemplate {
    id: number;
    provider: string;
    capabilities: string[] | Record<string, any> | string | null;
    description: string | null;
    is_active: boolean;
    scope: 'all' | 'selected';
    assigned_companies_count: number;
    applies_to_all_companies: boolean;
    companies?: Company[];
    created_at: string;
    updated_at: string;
}

export interface CompanyTemplateStatus extends IntegrationCapabilityTemplate {
    applies: boolean;
}
export interface CapabilityTemplatesResponse {
    templates: IntegrationCapabilityTemplate[];
    count: number;
}
export interface CreateTemplatePayload {
    provider: string;
    capabilities?: string[] | Record<string, any> | string;
    description?: string;
    is_active?: boolean;
}
export interface UpdateTemplatePayload {
    capabilities?: string[] | Record<string, any> | string;
    description?: string;
    is_active?: boolean;
}

// ─── Company ──────────────────────────────────────────────────────────────────
export type PlanStatus = 'DEMO' | 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

export interface Company {
    id: number;
    name: string;
    created_at: string;
    plan_status: PlanStatus;
}
export interface CompanyDetail extends Company {
    users_count: number;
    integrations_count: number;
    tickets_count: number;
    sessions_count: number;
    agent_instances_count: number;
}
export interface CompaniesResponse {
    companies: Company[];
    count: number;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export interface SAUser {
    id: number;
    username: string;
    email: string;
    role: 'ADMIN' | 'USER' | 'SUPERADMIN';
    company_id: number;
    company?: { id: number; name: string };
    created_at: string;
}
export interface UsersResponse {
    users: SAUser[];
    count: number;
}

// ─── Integrations ─────────────────────────────────────────────────────────────
export interface SAIntegration {
    id: number;
    company_id: number;
    provider: string;
    type?: string | null;
    capabilities?: any;
    config?: any;
    extra_json?: any;
    has_credentials?: boolean;
    created_at: string;
    company?: { id: number; name: string };
}

export interface SAIntegrationDetailed extends SAIntegration {
    capabilities_source: 'integration' | 'template' | 'none';
    effective_capabilities: string[];
    template_scope?: 'all' | 'selected';
    template_applies?: boolean;
    template?: {
        id: number;
        provider: string;
        capabilities: string[];
        is_active: boolean;
    } | null;
}

export interface IntegrationsResponse {
    integrations: SAIntegration[];
    count: number;
}

export interface CompanyIntegrationsResponse {
    company: { id: number; name: string };
    integrations: SAIntegrationDetailed[];
    count: number;
}

export interface CompanyCapabilitiesResponse {
    company: { id: number; name: string };
    capabilities: string[];
    count: number;
    integrations?: SAIntegrationDetailed[];
    integrations_count: number;
}

// ─── Agent Instances ──────────────────────────────────────────────────────────
export interface SAAgentInstance {
    id: number;
    company_id: number;
    agent_type: string;
    status: 'ACTIVE' | 'TO_PROVISION' | 'DISABLED';
    settings?: any;
    last_used_at?: string;
    created_at: string;
    company?: { id: number; name: string };
}
export interface AgentInstancesResponse {
    agent_instances: SAAgentInstance[];
    count: number;
}

// ─── Tickets ──────────────────────────────────────────────────────────────────
export interface SATicket {
    id: number;
    company_id: number;
    subject: string;
    description?: string;
    status: 'PENDING' | 'EXECUTED' | 'FAILED' | 'DERIVED' | 'APPROVED';
    created_at: string;
    executed_at?: string;
    company?: { id: number; name: string };
    creator?: { id: number; username: string };
}
export interface TicketsResponse {
    tickets: SATicket[];
    count: number;
}

// ─── Sophia Sessions ──────────────────────────────────────────────────────────
export interface SASession {
    id: number;
    title?: string;
    company_id: number;
    user_id: number;
    created_at: string;
    user?: { id: number; email: string; username: string };
    company?: { id: number; name: string };
}
export interface SessionsResponse {
    sessions: SASession[];
    count: number;
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export interface AuditLog {
    id: number;
    action: string;
    entity_type?: string;
    entity_id?: number;
    changes?: any;
    created_at: string;
    actor?: { id: number; username: string; email: string };
    company?: { id: number; name: string };
}
export interface AuditLogsResponse {
    audit_logs: AuditLog[];
    count: number;
}

// ─── Shared ───────────────────────────────────────────────────────────────────
export interface PaginationParams {
    limit?: number;
    offset?: number;
}
