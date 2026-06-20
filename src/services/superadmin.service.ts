import { api } from '../lib/axios';
import type {
    IntegrationCapabilityTemplate, CapabilityTemplatesResponse, CompanyTemplateStatus,
    CreateTemplatePayload, UpdateTemplatePayload,
    Company, CompanyDetail, CompaniesResponse, PlanStatus,
    SAUser, UsersResponse,
    SAIntegration, SAIntegrationDetailed, IntegrationsResponse, CompanyIntegrationsResponse, CompanyCapabilitiesResponse,
    SAAgentInstance, AgentInstancesResponse,
    SATicket, TicketsResponse,
    SASession, SessionsResponse,
    AuditLogsResponse,
    PaginationParams
} from '../types/superadmin';

// Confirmation header for sensitive actions
const confirmHeader = { 'X-Superadmin-Confirm': 'true' };

class SuperAdminService {

    // ─── Capability Templates ─────────────────────────────────────────────────
    async getCapabilityTemplates(filters?: { provider?: string; active?: boolean; include_companies?: boolean }) {
        const params: any = {};
        if (filters?.provider) params.provider = filters.provider;
        if (filters?.active !== undefined) params.active = filters.active;
        if (filters?.include_companies) params.include_companies = filters.include_companies;
        const { data } = await api.get<CapabilityTemplatesResponse>('/api/superadmin/capability-templates', { params });
        return data;
    }
    async getTemplateCompanies(templateId: number, params?: { include_all?: boolean }) {
        const { data } = await api.get<{ companies: Company[]; count: number }>(`/api/superadmin/capability-templates/${templateId}/companies`, { params });
        return data;
    }
    async assignCompaniesToTemplate(templateId: number, payload: { company_ids: number[]; mode: 'replace' | 'add' | 'remove' }) {
        const { data } = await api.put<{ message: string }>(`/api/superadmin/capability-templates/${templateId}/companies`, payload);
        return data;
    }
    async getCompanyCapabilityTemplates(companyId: number) {
        const { data } = await api.get<{ templates: CompanyTemplateStatus[] }>(`/api/superadmin/companies/${companyId}/capability-templates`);
        return data;
    }
    async getCapabilityTemplateById(id: number) {
        const { data } = await api.get<IntegrationCapabilityTemplate>(`/api/superadmin/capability-templates/${id}`);
        return data;
    }
    async createCapabilityTemplate(payload: CreateTemplatePayload) {
        const { data } = await api.post<{ message: string; template: IntegrationCapabilityTemplate }>('/api/superadmin/capability-templates', payload);
        return data;
    }
    async updateCapabilityTemplate(id: number, payload: UpdateTemplatePayload) {
        const { data } = await api.patch<{ message: string; template: IntegrationCapabilityTemplate }>(`/api/superadmin/capability-templates/${id}`, payload);
        return data;
    }
    async deleteCapabilityTemplate(id: number) {
        const { data } = await api.delete<{ message: string }>(`/api/superadmin/capability-templates/${id}`);
        return data;
    }

    // ─── Companies ────────────────────────────────────────────────────────────
    async getCompanies(params?: { q?: string; created_from?: string; created_to?: string } & PaginationParams) {
        const { data } = await api.get<CompaniesResponse>('/api/superadmin/companies', { params });
        return data;
    }
    async getCompanyById(id: number) {
        const { data } = await api.get<CompanyDetail>(`/api/superadmin/companies/${id}`);
        return data;
    }
    async updateCompany(id: number, payload: { name?: string; plan_status?: PlanStatus }) {
        const { data } = await api.patch<Company>(`/api/superadmin/companies/${id}`, payload);
        return data;
    }
    async createCompany(payload: { name: string; plan_status: PlanStatus }) {
        const { data } = await api.post<Company>('/api/superadmin/companies', payload);
        return data;
    }

    // ─── Users ────────────────────────────────────────────────────────────────
    async getUsers(params?: { company_id?: number; role?: string; q?: string } & PaginationParams) {
        const { data } = await api.get<UsersResponse>('/api/superadmin/users', { params });
        return data;
    }
    async getUserById(id: number) {
        const { data } = await api.get<SAUser>(`/api/superadmin/users/${id}`);
        return data;
    }
    async updateUser(id: number, payload: { role?: string; email?: string; username?: string }) {
        const { data } = await api.patch<SAUser>(`/api/superadmin/users/${id}`, payload);
        return data;
    }
    async createUser(payload: { company_id: number; username: string; email: string; password: string; role: 'ADMIN' | 'USER' }) {
        const { data } = await api.post<SAUser>('/api/superadmin/users', payload);
        return data;
    }
    async resetUserPassword(id: number) {
        const { data } = await api.post<{ message: string; temporary_password: string }>(`/api/superadmin/users/${id}/password-reset`, {}, { headers: confirmHeader });
        return data;
    }

    // ─── Integrations ─────────────────────────────────────────────────────────
    async getIntegrations(params?: { company_id?: number; provider?: string; type?: string } & PaginationParams) {
        const { data } = await api.get<IntegrationsResponse>('/api/superadmin/integrations', { params });
        return data;
    }
    // New: Detailed integrations per company
    async getCompanyIntegrations(companyId: number, params?: { provider?: string; type?: string; include_templates?: boolean; include_effective_capabilities?: boolean } & PaginationParams) {
        const { data } = await api.get<CompanyIntegrationsResponse>(`/api/superadmin/companies/${companyId}/integrations`, { params });
        return data;
    }
    // New: Capabilities summary per company
    async getCompanyCapabilitiesSummary(companyId: number, params?: { include_integrations?: boolean; include_templates?: boolean }) {
        const { data } = await api.get<CompanyCapabilitiesResponse>(`/api/superadmin/companies/${companyId}/capabilities`, { params });
        return data;
    }
    async getIntegrationById(id: number) {
        const { data } = await api.get<SAIntegration>(`/api/superadmin/integrations/${id}`);
        return data;
    }
    async updateIntegration(id: number, payload: { type?: string; capabilities?: any; config?: any; extra_json?: any }) {
        const { data } = await api.patch<{ message: string; integration: SAIntegrationDetailed }>(`/api/superadmin/integrations/${id}`, payload);
        return data;
    }
    async getIntegrationCredentials(id: number) {
        const { data } = await api.get<{ integration_id: number; credentials: Record<string, string> }>(`/api/superadmin/integrations/${id}/credentials`, { headers: confirmHeader });
        return data;
    }
    async updateIntegrationCredentials(id: number, credentials: Record<string, string>) {
        const { data } = await api.post<{ message: string }>(`/api/superadmin/integrations/${id}/credentials`, { credentials }, { headers: confirmHeader });
        return data;
    }

    // ─── Agent Instances ──────────────────────────────────────────────────────
    async getAgentInstances(params?: { company_id?: number; agent_type?: string; status?: string } & PaginationParams) {
        const { data } = await api.get<AgentInstancesResponse>('/api/superadmin/agent-instances', { params });
        return data;
    }
    async getAgentInstanceById(id: number) {
        const { data } = await api.get<SAAgentInstance>(`/api/superadmin/agent-instances/${id}`);
        return data;
    }
    async updateAgentInstance(id: number, payload: any) {
        const { data } = await api.patch<SAAgentInstance>(`/api/superadmin/agent-instances/${id}`, payload);
        return data;
    }

    // ─── Tickets ──────────────────────────────────────────────────────────────
    async getTickets(params?: { company_id?: number; status?: string; q?: string; created_from?: string; created_to?: string } & PaginationParams) {
        const { data } = await api.get<TicketsResponse>('/api/superadmin/tickets', { params });
        return data;
    }
    async getTicketById(id: number) {
        const { data } = await api.get<SATicket>(`/api/superadmin/tickets/${id}`);
        return data;
    }
    async updateTicketStatus(id: number, status: string) {
        const { data } = await api.patch<SATicket>(`/api/superadmin/tickets/${id}`, { status });
        return data;
    }

    // ─── Sophia Chat Sessions ─────────────────────────────────────────────────
    async getChatSessions(params?: { company_id?: number; user_id?: number; q?: string; order?: 'asc' | 'desc' } & PaginationParams) {
        const { data } = await api.get<SessionsResponse>('/api/superadmin/chat/sessions', { params });
        return data;
    }
    async getChatSessionById(id: number) {
        const { data } = await api.get<SASession>(`/api/superadmin/chat/sessions/${id}`);
        return data;
    }
    async deleteChatSession(id: number) {
        const { data } = await api.delete<{ message: string }>(`/api/superadmin/chat/sessions/${id}`);
        return data;
    }

    // ─── Audit Logs ───────────────────────────────────────────────────────────
    async getAuditLogs(params?: { company_id?: number; actor_user_id?: number; action?: string; created_from?: string; created_to?: string } & PaginationParams) {
        const { data } = await api.get<AuditLogsResponse>('/api/superadmin/audit-logs', { params });
        return data;
    }
}

export const superAdminService = new SuperAdminService();
