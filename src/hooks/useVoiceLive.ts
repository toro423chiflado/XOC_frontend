import { useState, useCallback, useEffect } from 'react';
import type { VoiceState, VoiceMessage } from '../types/voice-live';
import { voiceLiveService } from '../services/voice-live.service';

export function useVoiceLive(sessionId: number | null) {
    const [state, setState] = useState<VoiceState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Callback for incoming messages (transcriptions)
    const [incomingMessage, setIncomingMessage] = useState<VoiceMessage | null>(null);

    const startVoiceSession = useCallback(async () => {
        if (!sessionId) {
            setError('No active session found for voice.');
            return;
        }

        try {
            setError(null);
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                throw new Error('Missing access token. Please login again.');
            }

            voiceLiveService.setCallbacks({
                onStateChange: (s) => {
                    setState(s);
                    setIsConnected(s !== 'idle' && s !== 'disconnected' && s !== 'error');
                },
                onMessageReceived: (msg) => {
                    setIncomingMessage(msg);
                },
                onError: (err) => {
                    setError(err);
                }
            });

            await voiceLiveService.startSession(
                accessToken
            );
        } catch (err: any) {
            setError(err.message || 'Failed to start voice session');
            setState('error');
        }
    }, [sessionId]);

    const stopVoiceSession = useCallback(() => {
        voiceLiveService.stopSession();
        setState('disconnected');
        setIsConnected(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            voiceLiveService.stopSession();
        };
    }, []);

    return {
        state,
        error,
        isConnected,
        startVoiceSession,
        stopVoiceSession,
        incomingMessage
    };
}
