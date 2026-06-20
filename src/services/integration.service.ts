import { api } from '../lib/axios';

export interface IntegrationCapability {
    id: number;
    provider: string;
    capabilities: string[] | null;
    capabilities_source: 'integration' | 'template' | 'none';
    effective_capabilities: string[];
}

export const integrationService = {
    // Admin: List integrations for current company
    getIntegrations: async (_companyId: number) => {
        const { data } = await api.get(`/api/integrations`);
        return data.integrations;
    },

    // Admin: Update capabilities for a specific integration
    updateCapabilities: async (integrationId: number, capabilities: string[] | null) => {
        const { data } = await api.put(`/api/integrations/${integrationId}`, { capabilities });
        return data;
    }
};
