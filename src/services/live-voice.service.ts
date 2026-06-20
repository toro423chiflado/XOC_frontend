import { api } from '../lib/axios';
import type {
    LiveVoiceSession,
    LiveVoiceSessionDetail,
    CreateLiveVoiceSessionDto,
    AddLiveVoiceMessageDto,
    LiveVoiceMessage,
    ListLiveVoiceSessionsResponse
} from '../types/live-voice';

export const liveVoiceService = {
    /**
     * Creates a new Live Voice Session
     */
    createSession: async (payload: CreateLiveVoiceSessionDto): Promise<LiveVoiceSession> => {
        const { data } = await api.post<LiveVoiceSession>('/api/live-voice-sessions', payload);
        return data;
    },

    /**
     * Lists existing Live Voice Sessions for a given tenant
     */
    getSessions: async (tenantId: string | number): Promise<ListLiveVoiceSessionsResponse> => {
        const { data } = await api.get<ListLiveVoiceSessionsResponse>('/api/live-voice-sessions', {
            params: { tenantId }
        });
        return data;
    },

    /**
     * Gets a single Live Voice Session along with all its messages
     */
    getSessionDetails: async (sessionId: string | number): Promise<LiveVoiceSessionDetail> => {
        const { data } = await api.get<LiveVoiceSessionDetail>(`/api/live-voice-sessions/${sessionId}`);
        return data;
    },

    /**
     * Adds a new transcribed message into an active session
     */
    addMessage: async (sessionId: string | number, payload: AddLiveVoiceMessageDto): Promise<LiveVoiceMessage> => {
        const { data } = await api.post<LiveVoiceMessage>(`/api/live-voice-sessions/${sessionId}/messages`, payload);
        return data;
    },

    /**
     * Marks a Live Voice Session as ENDED
     */
    endSession: async (sessionId: string | number): Promise<LiveVoiceSession> => {
        const { data } = await api.patch<LiveVoiceSession>(`/api/live-voice-sessions/${sessionId}`, {
            status: 'ENDED'
        });
        return data;
    }
};
