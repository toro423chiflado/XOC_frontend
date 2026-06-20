import { api } from '../lib/axios';

const INTEGRATION_TYPE_ALIASES: Record<string, string> = {
    'openvas scanner': 'openvas',
    'insightvm rapid7': 'insightvm',
    'nessus scanner': 'nessus',
    'uptime kuma': 'uptime_kuma',
    'zabbix monitor': 'zabbix',
    'wazuh siem': 'wazuh',
    otro: 'other'
};

export const OFFICIAL_INTEGRATION_TYPES = [
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
] as const;

export type IntegrationType = (typeof OFFICIAL_INTEGRATION_TYPES)[number];

const normalizeIntegrationType = (value: unknown): IntegrationType | null => {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return null;

    const normalizedKey = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
    const candidate = INTEGRATION_TYPE_ALIASES[normalizedKey] || normalizedKey;

    return (OFFICIAL_INTEGRATION_TYPES as readonly string[]).includes(candidate)
        ? (candidate as IntegrationType)
        : null;
};

export interface XocApiKey {
    id: string;
    name: string;
    integrationType: IntegrationType;
    createdAt: string;
    isActive: boolean;
    lastUsed?: string | null;
}

export interface CreateApiKeyResponse {
    api_key?: string;
    apiKey?: string;
    message: string;
    agent_key?: {
        api_key: string;
        id: number;
        name: string;
        integration_type: string;
    };
}

export const apiKeyService = {
    getAll: async (companyId: string): Promise<XocApiKey[]> => {
        try {
            const url = `/api/companies/${companyId}/agent-keys`;
            const { data } = await api.get<any>(url);

            const rawKeys = data.keys || data.agent_keys || (Array.isArray(data) ? data : []);

            return rawKeys.map((k: any) => ({
                id: k.id?.toString() || '',
                name: k.name || `Agente ${k.id}`,
                integrationType: normalizeIntegrationType(k.integration_type || k.integrationType) || 'other',
                createdAt: k.created_at || k.createdAt || new Date().toISOString(),
                isActive: k.is_active !== false,
                lastUsed: k.last_used_at || k.lastUsed
            }));
        } catch (error: any) {
            console.warn('Listing agent API keys failed:', error.response?.status);
            return [];
        }
    },

    create: async (companyId: string, name: string, integrationType: string): Promise<CreateApiKeyResponse> => {
        try {
            const canonicalIntegrationType = normalizeIntegrationType(integrationType);
            if (!canonicalIntegrationType) {
                throw new Error(`Invalid integration_type: ${integrationType}`);
            }
            const { data } = await api.post<any>(`/api/companies/${companyId}/agent-keys`, {
                name,
                integration_type: canonicalIntegrationType
            });

            const actualKey = data.agent_key?.api_key || data.api_key;

            return {
                ...data,
                apiKey: actualKey,
                api_key: actualKey
            };
        } catch (error: any) {
            console.error('Agent Key Creation Error:', error.response?.data || error.message);
            throw error;
        }
    },

    revoke: async (companyId: string, keyId: string): Promise<void> => {
        await api.delete(`/api/companies/${companyId}/agent-keys/${keyId}`);
    },

    regenerate: async (companyId: string, keyId: string): Promise<CreateApiKeyResponse> => {
        const { data } = await api.post<CreateApiKeyResponse>(`/api/companies/${companyId}/agent-keys/${keyId}/regenerate`);
        const actualKey = data.agent_key?.api_key || data.api_key;
        return {
            ...data,
            api_key: actualKey,
            apiKey: actualKey
        };
    },

    toggleStatus: async (companyId: string, keyId: string): Promise<boolean> => {
        const { data } = await api.post<any>(`/api/companies/${companyId}/agent-keys/${keyId}/toggle`);
        return data.agent_key?.is_active ?? data.is_active;
    }
};
