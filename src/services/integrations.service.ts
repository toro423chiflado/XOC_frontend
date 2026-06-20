import { api } from '../lib/axios';
import type { Integration } from '../types/api';

export interface IntegrationConfig {
    id: string;
    name: string;
    type: 'zabbix' | 'wazuh' | 'nessus' | 'openvas' | 'paloalto' | 'splunk' | 'uptime' | 'meraki' | 'openai';
    url?: string;
    username?: string;
    apiKey?: string;
    connected: boolean;
    lastSync?: string;
}

// Map backend Integration to frontend IntegrationConfig
function mapIntegration(integration: Integration): IntegrationConfig {
    return {
        id: integration.id.toString(),
        name: integration.extra_json?.description || integration.provider,
        type: integration.provider as any,
        url: integration.extra_json?.url,
        connected: true,
        lastSync: new Date(integration.created_at).toLocaleString()
    };
}

export const integrationService = {
    getAll: async (): Promise<IntegrationConfig[]> => {
        try {
            const { data } = await api.get<{ integrations: Integration[] }>('/api/integrations');
            return data.integrations.map(mapIntegration);
        } catch (error) {
            console.error('Failed to fetch integrations', error);
            // Fallback to mock
            return [
                { id: '1', name: 'Wazuh SIEM', type: 'wazuh', url: 'https://wazuh.local:55000', connected: true, lastSync: '2m ago' },
                { id: '2', name: 'Zabbix Monitor', type: 'zabbix', url: 'http://zabbix.local/api_jsonrpc.php', connected: true, lastSync: '5m ago' },
                { id: '3', name: 'OpenVAS Scanner', type: 'openvas', url: 'http://openvas.local', connected: true, lastSync: '10m ago' },
            ];
        }
    },

    connect: async (config: { provider: string; credentials: any; extra_json?: any }) => {
        try {
            const { data } = await api.post('/api/integrations', config);
            return { success: true, id: data.integration.id.toString() };
        } catch (error: any) {
            console.error('Failed to create integration', error);
            throw error;
        }
    },

    disconnect: async (id: string) => {
        try {
            await api.delete(`/api/integrations/${id}`);
            return { success: true };
        } catch (error: any) {
            console.error('Failed to delete integration', error);
            throw error;
        }
    }
};
