export type VoiceState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error' | 'disconnected';

export interface VoiceLiveState {
    state: VoiceState;
    isConnected: boolean;
    error: string | null;
}

export interface VoiceMessage {
    role: 'user' | 'assistant';
    text: string;
    isFinal: boolean;
}
