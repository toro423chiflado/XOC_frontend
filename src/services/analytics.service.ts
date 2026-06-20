import { api } from '../lib/axios';
import type { AnalyticsSummary, IncidentsAnalytics } from '../types/api';

export const analyticsService = {
    // Get general analytics summary
    getSummary: async (): Promise<AnalyticsSummary> => {
        const { data } = await api.get<AnalyticsSummary>('/api/analytics/summary');
        return data;
    },

    // Get incidents analytics
    getIncidents: async (hours: number = 24): Promise<IncidentsAnalytics> => {
        const { data } = await api.get<IncidentsAnalytics>(`/api/analytics/incidents?hours=${hours}`);
        return data;
    },

    // Get response time analytics
    getResponseTime: async (days: number = 7) => {
        const { data } = await api.get(`/api/analytics/response-time?days=${days}`);
        return data;
    },

    // Get vulnerability distribution
    getVulnerabilityDistribution: async () => {
        const { data } = await api.get('/api/analytics/vulnerability-distribution');
        return data;
    }
};
