import { api } from '../lib/axios';
import type { Ticket } from '../types/api';

export const ticketsService = {
    // Get all tickets
    getAll: async (status?: string): Promise<Ticket[]> => {
        const url = status ? `/api/tickets?status=${status}` : '/api/tickets';
        const { data } = await api.get<{ tickets: Ticket[] }>(url);
        return data.tickets;
    },

    // Get single ticket
    getById: async (id: number): Promise<Ticket> => {
        const { data } = await api.get<Ticket>(`/api/tickets/${id}`);
        return data;
    },

    // Create ticket
    create: async (subject: string, description?: string): Promise<Ticket> => {
        const { data } = await api.post<{ message: string; ticket: Ticket }>('/api/tickets', {
            subject,
            description
        });
        return data.ticket;
    },

    // Update ticket
    update: async (id: number, updates: { subject?: string; description?: string; status?: string }): Promise<Ticket> => {
        const { data } = await api.put<{ message: string; ticket: Ticket }>(`/api/tickets/${id}`, updates);
        return data.ticket;
    },

    // Delete ticket
    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/tickets/${id}`);
    },

    // Approve ticket (PREAPROBADO -> APROBADO)
    approve: async (id: number): Promise<Ticket> => {
        const { data } = await api.patch<{ message: string; ticket: Ticket }>(`/api/tickets/${id}/approve`);
        return data.ticket;
    },

    // Reject ticket (PREAPROBADO -> RECHAZADO)
    reject: async (id: number): Promise<Ticket> => {
        const { data } = await api.patch<{ message: string; ticket: Ticket }>(`/api/tickets/${id}/reject`);
        return data.ticket;
    },

    // Select decision option
    selectDecision: async (id: number, selectedOptionId: string, decisionId?: string, selectionNote?: string): Promise<Ticket> => {
        const { data } = await api.patch<{ message: string; ticket: Ticket }>(`/api/tickets/${id}/decision/select`, {
            selected_option_id: selectedOptionId,
            ...(decisionId && { decision_id: decisionId }),
            ...(selectionNote && { selection_note: selectionNote })
        });
        return data.ticket;
    }
};
