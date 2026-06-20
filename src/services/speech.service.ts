import { api } from '../lib/axios';
import type {
    SpeechTokenResponse,
    SpeechSettings,
    ScopedTokenResponse,
    UpdateSpeechSettingsPayload,
    UpdateSpeechSettingsResponse
} from '../types/speech';

export const speechService = {
    getSpeechToken: async (): Promise<SpeechTokenResponse> => {
        const { data } = await api.get<SpeechTokenResponse>('/api/speech/token');
        return data;
    },

    getScopedToken: async (): Promise<ScopedTokenResponse> => {
        const { data } = await api.get<ScopedTokenResponse>('/api/speech/scoped-token');
        return data;
    },

    getSpeechSettings: async (companyId?: number): Promise<SpeechSettings> => {
        const params = companyId ? { company_id: companyId } : {};
        const { data } = await api.get<SpeechSettings>('/api/speech/settings', { params });
        return data;
    },

    updateSpeechSettings: async (payload: UpdateSpeechSettingsPayload): Promise<UpdateSpeechSettingsResponse> => {
        const { data } = await api.put<UpdateSpeechSettingsResponse>('/api/speech/settings', payload);
        return data;
    },

    /**
     * Standard Text-to-Speech (Non-WebRTC)
     */
    speak: async (text: string, agentAccessKey: string, companyId: number): Promise<Blob> => {
        const { data } = await api.post('/api/voice/speak', {
            text,
            companyId,
            agentAccessKey
        }, { responseType: 'blob' });
        return data;
    },

    /**
     * Standard Speech-to-Text (Non-WebRTC)
     */
    transcribe: async (audioFile: File, agentAccessKey: string, companyId: number): Promise<{ text: string }> => {
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('companyId', companyId.toString());
        formData.append('agentAccessKey', agentAccessKey);

        const { data } = await api.post<{ text: string }>('/api/voice/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    }
};
