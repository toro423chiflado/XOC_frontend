import { api } from '../lib/axios';
import type { Alert } from '../types/api';

export const alertsService = {
    // Get all alerts
    getAll: async (status?: string): Promise<Alert[]> => {
        const url = status ? `/api/alerts?status=${status}` : '/api/alerts';
        try {
            const { data } = await api.get<{ alerts: Alert[] }>(url);
            return data.alerts || [];
        } catch (error) {
            console.error('Failed to fetch alerts', error);
            return [];
        }
    },

    // Resolve an alert
    resolve: async (id: number): Promise<Alert> => {
        const { data } = await api.post<{ message: string; alert: Alert }>(`/api/alerts/${id}/resolve`);
        return data.alert;
    }
};
