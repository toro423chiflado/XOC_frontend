import type { VoiceState, VoiceMessage } from '../types/voice-live';

// Singleton context for UI sounds, created only on user interaction if needed
let uiAudioContext: AudioContext | null = null;
const getUiAudioContext = () => {
    if (!uiAudioContext) {
        uiAudioContext = new AudioContext();
    }
    return uiAudioContext;
};

// Play a modern electronic 'chime' (upward frequency) when session starts
export const playConnectSound = () => {
    try {
        const ctx = getUiAudioContext();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);
        osc.frequency.setValueAtTime(880, t + 0.1);
        osc.frequency.exponentialRampToValueAtTime(1760, t + 0.2);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.35);
    } catch (err) {
        console.warn('Could not play connect sound', err);
    }
};

// Play a modern electronic 'down chime' (downward frequency) when session ends
export const playDisconnectSound = () => {
    try {
        const ctx = getUiAudioContext();
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(440, t + 0.15);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.25);
    } catch (err) {
        console.warn('Could not play disconnect sound', err);
    }
};

class VoiceLiveService {
    private socket: WebSocket | null = null;
    private audioStream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;
    private processor: ScriptProcessorNode | null = null;
    private analyser: AnalyserNode | null = null;
    private readonly targetSampleRate = 24000;
    private readonly proxyWsBaseUrl = (
        import.meta.env.VITE_SOPHIA_VOICE_PROXY_WS_URL ||
        'wss://ca-sophia-voice-proxy.whitebeach-abb39dc7.eastus2.azurecontainerapps.io/ws'
    ).trim();
    private readonly connectTimeoutMs = Number(import.meta.env.VITE_SOPHIA_VOICE_WS_TIMEOUT_MS || 30000);
    private readonly maxConnectAttempts = Math.max(1, Number(import.meta.env.VITE_SOPHIA_VOICE_WS_RETRIES || 3));
    private readonly maxReconnectAttempts = Math.max(1, Number(import.meta.env.VITE_SOPHIA_VOICE_WS_RECONNECTS || 3));
    private readonly enableHealthCheck = String(import.meta.env.VITE_SOPHIA_VOICE_ENABLE_HEALTH_CHECK || '').toLowerCase() === 'true';
    private assistantTextBuffer = '';
    private isResponseActive = false;
    private isResponseDone = true;
    private suppressNextCloseError = false;
    private manualClose = false;
    private lastWsUrl: string | null = null;
    private reconnectAttempts = 0;
    private isMicMuted = false;

    // Playback state
    private audioQueue: Int16Array[] = [];
    private isPlaying = false;
    private startTime = 0;

    private onStateChange: (state: VoiceState) => void = () => { };
    private onMessageReceived: (msg: VoiceMessage) => void = () => { };
    private onError: (err: string) => void = () => { };
    private onVolumeChange: (volume: number) => void = () => { };
    private onMuteChange: (isMuted: boolean) => void = () => { };

    constructor() { }

    setCallbacks(callbacks: {
        onStateChange: (state: VoiceState) => void;
        onMessageReceived: (msg: VoiceMessage) => void;
        onError: (err: string) => void;
        onVolumeChange?: (volume: number) => void;
        onMuteChange?: (isMuted: boolean) => void;
    }) {
        this.onStateChange = callbacks.onStateChange;
        this.onMessageReceived = callbacks.onMessageReceived;
        this.onError = callbacks.onError;
        if (callbacks.onVolumeChange) this.onVolumeChange = callbacks.onVolumeChange;
        if (callbacks.onMuteChange) this.onMuteChange = callbacks.onMuteChange;
    }

    async startSession(userAccessToken: string) {
        this.onStateChange('connecting');
        this.assistantTextBuffer = '';
        this.isResponseActive = false;
        this.isResponseDone = true;
        this.suppressNextCloseError = false;
        this.manualClose = false;
        this.reconnectAttempts = 0;
        this.logTokenDetails(userAccessToken);
        this.logTokenDiagnostics(userAccessToken);

        try {
            if (!userAccessToken?.trim()) {
                this.onError('No hay access token para conectar Voice Live');
                this.onStateChange('error');
                return;
            }

            const traceId = this.createTraceId();
            const wsUrl = this.buildProxyWsUrl(userAccessToken, traceId);
            this.lastWsUrl = wsUrl;
            if (this.enableHealthCheck) {
                await this.logProxyHealth();
            }
            console.log('[VOICE] Connecting through proxy', {
                wsBaseUrl: this.proxyWsBaseUrl,
                tokenBytes: userAccessToken.length,
                timeoutMs: this.connectTimeoutMs,
                maxAttempts: this.maxConnectAttempts,
                traceId,
                origin: window.location.origin,
                secureContext: window.isSecureContext
            });

            let connected = false;
            for (let attempt = 1; attempt <= this.maxConnectAttempts; attempt++) {
                connected = await this.connectWebSocket(wsUrl, attempt);
                if (connected) break;
                if (attempt < this.maxConnectAttempts) {
                    const backoffMs = attempt * 1000;
                    console.warn('[VOICE] Connect attempt failed, retrying...', {
                        attempt,
                        nextAttempt: attempt + 1,
                        backoffMs
                    });
                    await this.sleep(backoffMs);
                }
            }

            if (!connected) {
                this.onError('No se pudo establecer WebSocket con el proxy. Revisa token, origen permitido y logs del proxy.');
                this.onStateChange('error');
            }
        } catch (err: unknown) {
            console.error('[VOICE] Startup Error:', err);
            this.onError('Error al iniciar Voice Live');
            this.onStateChange('error');
        }
    }

    private buildProxyWsUrl(userAccessToken: string, traceId?: string): string {
        const separator = this.proxyWsBaseUrl.includes('?') ? '&' : '?';
        const traceQuery = traceId ? `&trace_id=${encodeURIComponent(traceId)}` : '';
        return `${this.proxyWsBaseUrl}${separator}token=${encodeURIComponent(userAccessToken)}${traceQuery}`;
    }

    private createTraceId(): string {
        const rand = Math.random().toString(36).slice(2, 10);
        return `voice-${Date.now()}-${rand}`;
    }

    private getProxyHealthUrl(): string {
        const cleanWs = this.proxyWsBaseUrl.split('?')[0];
        const httpBase = cleanWs
            .replace(/^wss:/i, 'https:')
            .replace(/^ws:/i, 'http:');
        const root = httpBase.endsWith('/ws') ? httpBase.slice(0, -3) : httpBase;
        return `${root}/health`;
    }

    private async logProxyHealth() {
        const healthUrl = this.getProxyHealthUrl();
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 3500);

        try {
            const res = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal
            });
            console.log('[VOICE] Proxy health check', {
                url: healthUrl,
                status: res.status,
                ok: res.ok
            });
        } catch (error: any) {
            console.warn('[VOICE] Proxy health check failed', {
                url: healthUrl,
                message: error?.message || 'unknown',
                note: 'En navegador puede fallar por CORS aunque el proxy este vivo.'
            });
        } finally {
            clearTimeout(timer);
        }
    }

    private sleep(ms: number) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }

    private connectWebSocket(wsUrl: string, attempt: number): Promise<boolean> {

        if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
            this.suppressNextCloseError = true;
            this.socket.close();
        }

        return new Promise((resolve) => {
            const connectStartAt = performance.now();
            const socket = new WebSocket(wsUrl);
            this.socket = socket;

            let didOpen = false;
            let allowErrorReporting = false;
            let resolved = false;

            const timeoutId = window.setTimeout(() => {
                if (resolved) return;
                resolved = true;
                const elapsedMs = Math.round(performance.now() - connectStartAt);
                console.error('[VOICE] WebSocket timeout', {
                    attempt,
                    elapsedMs,
                    timeoutMs: this.connectTimeoutMs,
                    online: navigator.onLine
                });
                try {
                    socket.close();
                } catch {
                }
                resolve(false);
            }, this.connectTimeoutMs);

            socket.onopen = () => {
                didOpen = true;
                allowErrorReporting = true;
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    resolve(true);
                }
                const elapsedMs = Math.round(performance.now() - connectStartAt);
                console.log("[VOICE] WebSocket OPEN", {
                    attempt,
                    protocol: socket.protocol || 'none',
                    readyState: socket.readyState,
                    elapsedMs
                });
                playConnectSound();
                this.onStateChange('connected');
            };

            socket.onmessage = (e) => {
                try {
                    if (typeof e.data === 'string') {
                        console.log("[VOICE] WS message received", { bytes: e.data.length });
                        const event = JSON.parse(e.data);
                        this.logEventSummary(event);
                        this.handleRealtimeEvent(event);
                        return;
                    }
                    console.log("[VOICE] WS message received", { type: typeof e.data });
                } catch (err) {
                    console.error("[VOICE] Parse error:", err);
                }
            };

            socket.onerror = (e) => {
                const elapsedMs = Math.round(performance.now() - connectStartAt);
                console.error("[VOICE] WebSocket ERROR:", {
                    attempt,
                    eventType: (e as Event).type,
                    readyState: socket.readyState,
                    protocol: socket.protocol || 'none',
                    elapsedMs,
                    online: navigator.onLine
                });
            };

            socket.onclose = (e: CloseEvent) => {
                const elapsedMs = Math.round(performance.now() - connectStartAt);
                const closeReasons: Record<number, string> = {
                    1000: "Normal Closure",
                    1005: "No Status Received",
                    1006: "Abnormal Closure (Check network/Azure logs)",
                    1008: "Unauthorized",
                    1011: "Proxy error",
                    1013: "Try Again Later"
                };
                const reason = closeReasons[e.code] || `Code ${e.code}`;
                const shouldReportCloseError = !this.suppressNextCloseError && e.code !== 1000 && e.code !== 1005;
                const logPayload = {
                    attempt,
                    wasClean: e.wasClean,
                    readyState: socket.readyState,
                    protocol: socket.protocol || 'none',
                    elapsedMs,
                    online: navigator.onLine,
                    suppressed: this.suppressNextCloseError
                };
                if (shouldReportCloseError) {
                    console.error(`[VOICE] WebSocket CLOSED | Code: ${e.code} (${reason}) | Reason: ${e.reason || 'None'}`, logPayload);
                } else {
                    console.log(`[VOICE] WebSocket CLOSED (expected) | Code: ${e.code} (${reason})`, logPayload);
                }

                const shouldRetry = e.code === 1013 && !this.manualClose && !this.suppressNextCloseError;
                this.suppressNextCloseError = false;

                if (!resolved && !didOpen) {
                    resolved = true;
                    clearTimeout(timeoutId);
                    resolve(false);
                }

                this.cleanupAudioCapture();
                this.socket = null;
                if (shouldRetry) {
                    this.scheduleReconnect(e.code, e.reason || reason);
                    return;
                }

                if (allowErrorReporting && shouldReportCloseError) {
                    this.onError(this.buildCloseErrorMessage(e.code, e.reason || reason));
                }
                
                playDisconnectSound();
                this.onStateChange('disconnected');
            };
        });
    }

    private buildCloseErrorMessage(code: number, reason: string): string {
        if (code === 1008) return `Error 1008 Unauthorized: ${reason}. Verifica access_token de usuario.`;
        if (code === 1011) return `Error 1011 Proxy error: ${reason}. Revisa logs del proxy.`;
        if (code === 1006) return `Error 1006: cierre anormal. Verifica red, health del proxy y handshake.`;
        if (code === 1013) return 'Servicio de voz ocupado. Reintentando...';
        if (code === 1005) return 'Cierre local sin codigo de estado (normal al finalizar llamada).';
        return `Error ${code}: ${reason}`;
    }

    private async scheduleReconnect(code: number, reason: string) {
        if (!this.lastWsUrl) {
            this.onError(this.buildCloseErrorMessage(code, reason));
            this.onStateChange('disconnected');
            return;
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.onError('Servicio de voz ocupado. Reintente más tarde.');
            this.onStateChange('disconnected');
            return;
        }

        this.reconnectAttempts += 1;
        const backoffMs = Math.min(20000, 1000 * Math.pow(2, this.reconnectAttempts - 1));
        console.warn('[VOICE] Retry after 1013', {
            attempt: this.reconnectAttempts,
            backoffMs
        });
        this.onStateChange('connecting');
        await this.sleep(backoffMs);

        const connected = await this.connectWebSocket(this.lastWsUrl, this.reconnectAttempts);
        if (!connected) {
            await this.scheduleReconnect(code, reason);
            return;
        }

        this.reconnectAttempts = 0;
    }

    private closeWithUserError(message: string) {
        this.onError(message);
        this.manualClose = true;
        this.suppressNextCloseError = true;
        this.socket?.close();
        this.cleanupAudioCapture();
        this.socket = null;
        playDisconnectSound();
        this.onStateChange('disconnected');
    }

    private logTokenDetails(token: string) {
        const payload = this.decodeJwtPayload(token);
        if (!payload) {
            console.log("[VOICE] Token details: unable to decode JWT");
            return;
        }

        const exp = typeof payload.exp === 'number'
            ? new Date(payload.exp * 1000).toISOString()
            : 'unknown';

        console.log("[VOICE] Token details", {
            aud: payload.aud || 'unknown',
            exp,
            tid: payload.tid || 'unknown',
            appid: payload.appid || 'unknown',
            oid: payload.oid || undefined,
            scp: payload.scp || undefined,
            roles: payload.roles || undefined
        });
    }

    private logTokenDiagnostics(token: string) {
        const payload = this.decodeJwtPayload(token);
        if (!payload) return;

        const warnings: string[] = [];

        if (typeof payload.exp === 'number') {
            const secondsLeft = payload.exp - Math.floor(Date.now() / 1000);
            if (secondsLeft < 120) warnings.push('token a punto de expirar (<2 min)');
        }

        if (warnings.length > 0) {
            console.warn('[VOICE] Token/config warnings', warnings);
        }
    }

    private decodeJwtPayload(token: string): Record<string, any> | null {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        try {
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + (4 - (base64.length % 4 || 4)), '=');
            const json = atob(padded);
            return JSON.parse(json);
        } catch {
            return null;
        }
    }

    private async startAudioCapture() {
        try {
            if (this.audioStream) return;

            this.audioContext = new AudioContext({ sampleRate: this.targetSampleRate });
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Apply initial mute state to the tracks
            this.audioStream.getAudioTracks().forEach(t => {
                t.enabled = !this.isMicMuted;
            });

            console.log(`[VOICE] Microphone access granted. Initial state: ${this.isMicMuted ? 'Muted' : 'Unmuted'}`);

            const source = this.audioContext.createMediaStreamSource(this.audioStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            const silenceGain = this.audioContext.createGain();
            silenceGain.gain.value = 0;

            source.connect(this.analyser);
            this.analyser.connect(this.processor);
            this.processor.connect(silenceGain);
            silenceGain.connect(this.audioContext.destination);

            this.processor.onaudioprocess = (e) => {
                if (this.isMicMuted) {
                    this.onVolumeChange(0);
                    return;
                }
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const resampled = this.resampleAudio(inputData, this.audioContext?.sampleRate || this.targetSampleRate, this.targetSampleRate);
                    const pcm16 = this.floatTo16BitPCM(resampled);
                    const base64Audio = this.base64Encode(pcm16);

                    console.log("[VOICE] Sending audio chunk");
                    this.socket.send(JSON.stringify({
                        type: 'input_audio_buffer.append',
                        audio: base64Audio
                    }));
                }
                this.updateVolumeFeedback();
            };
        } catch (err) {
            console.error("[VOICE] Capture Error:", err);
            this.onError("Error al acceder al micrófono.");
        }
    }

    private floatTo16BitPCM(input: Float32Array): Int16Array {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output;
    }

    private resampleAudio(input: Float32Array, inputRate: number, targetRate: number): Float32Array {
        if (inputRate === targetRate) return input;
        const ratio = inputRate / targetRate;
        const newLength = Math.max(1, Math.round(input.length / ratio));
        const output = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
            const pos = i * ratio;
            const idx = Math.floor(pos);
            const frac = pos - idx;
            const next = input[idx + 1] ?? input[idx];
            output[i] = input[idx] + (next - input[idx]) * frac;
        }
        return output;
    }

    private base64Encode(buffer: Int16Array): string {
        const bytes = new Uint8Array(buffer.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    }

    private base64DecodeToPCM(base64: string): Int16Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Int16Array(bytes.buffer);
    }

    private updateVolumeFeedback() {
        if (!this.analyser) return;
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;
        const volume = Math.min(100, Math.round((average / 128) * 100));

        this.onVolumeChange(volume);
        if (volume > 5) {
            console.log("[VOICE] Audio input level:", volume);
        }
    }

    public toggleMute(forceState?: boolean) {
        if (forceState !== undefined) {
            this.isMicMuted = forceState;
        } else {
            this.isMicMuted = !this.isMicMuted;
        }
        
        if (this.audioStream) {
            this.audioStream.getAudioTracks().forEach(t => {
                t.enabled = !this.isMicMuted;
            });
        }
        this.onMuteChange(this.isMicMuted);
        console.log(`[VOICE] Microphone is now ${this.isMicMuted ? 'MUTED' : 'UNMUTED'}`);
    }

    public sendTextMessage(text: string) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text }]
            }
        }));
        this.socket.send(JSON.stringify({ type: 'response.create' }));
    }

    private handleRealtimeEvent(event: any) {
        switch (event.type) {
            case 'session.created':
                console.log("[VOICE] session.created", {
                    sessionId: event?.session?.id || 'unknown',
                    voiceName: event?.session?.voice?.name || 'unknown',
                    voiceType: event?.session?.voice?.type || 'unknown'
                });
                this.startAudioCapture();
                this.onStateChange('listening');
                break;
            case 'session.updated':
                console.log("[VOICE] session.updated", {
                    sessionId: event?.session?.id || 'unknown',
                    voiceName: event?.session?.voice?.name || 'unknown',
                    voiceType: event?.session?.voice?.type || 'unknown'
                });
                this.startAudioCapture();
                this.onStateChange('listening');
                break;
            case 'response.created':
                console.log("[VOICE] response.created");
                this.assistantTextBuffer = '';
                this.isResponseActive = true;
                this.isResponseDone = false;
                break;
            case 'response.audio.delta':
                this.playAudioDelta(event.delta);
                this.onStateChange('speaking');
                this.isResponseActive = true;
                this.isResponseDone = false;
                break;
            case 'response.output_text.delta':
            case 'response.audio_transcript.delta':
                {
                    const delta = typeof event.delta === 'string' ? event.delta : '';
                    if (!delta) break;
                    console.log(`[VOICE] ${event.type}`, delta);
                    this.assistantTextBuffer += delta;
                    this.onMessageReceived({ role: 'assistant', text: delta, isFinal: false });
                    this.onStateChange('speaking');
                    this.isResponseActive = true;
                    this.isResponseDone = false;
                }
                break;
            case 'response.output_item.added':
                console.log('[VOICE] response.output_item.added');
                break;
            case 'conversation.item.input_audio_transcription.completed':
                console.log("[VOICE] input_audio_transcription.completed", {
                    length: (event?.transcript || '').length
                });
                this.onMessageReceived({ role: 'user', text: event.transcript, isFinal: true });
                break;
            case 'response.audio.done':
                console.log("[VOICE] response.audio.done");
                break;
            case 'response.completed':
                console.log("[VOICE] response.completed");
                this.finalizeAssistantResponse();
                break;
            case 'response.done':
                console.log("[VOICE] response.done");
                this.finalizeAssistantResponse();
                break;
            case 'input_audio_buffer.speech_started':
                this.stopPlaying();
                this.onStateChange('listening');
                if (this.socket && this.socket.readyState === WebSocket.OPEN && this.isResponseActive && !this.isResponseDone) {
                    console.log("[VOICE] response.cancel");
                    this.socket.send(JSON.stringify({ type: 'response.cancel' }));
                }
                break;
            case 'input_audio_buffer.speech_stopped':
                console.log("[VOICE] input_audio_buffer.speech_stopped");
                break;
            case 'input_audio_buffer.committed':
                console.log('[VOICE] input_audio_buffer.committed (server VAD)');
                break;
            case 'conversation.item.created':
                console.log('[VOICE] conversation.item.created');
                break;
            case 'error':
                if (event?.error?.code === 'tools_configuration_not_supported') {
                    console.warn('[VOICE] Runtime tools config is not supported in Foundry Agent mode.', event.error);
                    break;
                }
                if (event?.error?.code === 'input_audio_buffer_commit_empty') {
                    console.warn('[VOICE] Ignoring empty input_audio_buffer.commit error.', event.error);
                    break;
                }
                if (event?.error?.code === 'instructions_configuration_not_supported') {
                    console.warn('[VOICE] Instructions config is read-only in Foundry Agent mode.', event.error);
                    break;
                }
                if (event?.error?.code === 'invalid_session_update_message') {
                    console.warn('[VOICE] invalid_session_update_message — audio arrived before session.updated. Check proxy bootstrap timing.', event.error);
                    break;
                }
                if (event?.error?.code === 'invalid_request_error') {
                    this.closeWithUserError('Solicitud inválida. Verifique los datos e intente de nuevo.');
                    break;
                }
                if (event?.error?.code === 'max_config_attempts_exceeded') {
                    this.closeWithUserError('No se pudo iniciar la sesión de voz. Reintente en unos minutos.');
                    break;
                }
                if (event?.error?.code === 'conversation_limit_exceeded') {
                    this.closeWithUserError('La sesión expiró por límite de conversación. Inicie una nueva.');
                    break;
                }

                console.error('[VOICE] AZURE ERROR:', event.error || event);
                break;
            default:
                console.log("[VOICE] Unhandled event:", event.type || 'unknown');
                break;
        }
    }

    private logEventSummary(event: any) {
        if (!event || typeof event.type !== 'string') {
            console.log("[VOICE] Event summary: unknown", { eventType: typeof event });
            return;
        }

        switch (event.type) {
            case 'response.audio.delta':
                console.log("[VOICE] Event summary", {
                    type: event.type,
                    audioBytes: typeof event.delta === 'string' ? event.delta.length : 0
                });
                break;
            case 'response.output_text.delta':
            case 'response.audio_transcript.delta':
                console.log("[VOICE] Event summary", {
                    type: event.type,
                    textBytes: typeof event.delta === 'string' ? event.delta.length : 0
                });
                break;
            case 'conversation.item.input_audio_transcription.completed':
                console.log("[VOICE] Event summary", {
                    type: event.type,
                    transcriptBytes: typeof event.transcript === 'string' ? event.transcript.length : 0
                });
                break;
            case 'input_audio_buffer.committed':
            case 'conversation.item.created':
                console.log('[VOICE] Event summary', { type: event.type });
                break;
            case 'error':
                console.log("[VOICE] Event summary", {
                    type: event.type,
                    errorCode: event?.error?.code || 'unknown',
                    errorMessage: event?.error?.message || 'unknown'
                });
                break;
            default:
                console.log("[VOICE] Event summary", { type: event.type });
                break;
        }
    }

    private finalizeAssistantResponse() {
        if (this.isResponseDone) return;
        const finalText = this.assistantTextBuffer;
        this.assistantTextBuffer = '';
        this.isResponseActive = false;
        this.isResponseDone = true;
        this.onMessageReceived({ role: 'assistant', text: finalText, isFinal: true });
        this.onStateChange('listening');
    }

    private playAudioDelta(base64: string) {
        const pcmData = this.base64DecodeToPCM(base64);
        this.audioQueue.push(pcmData);
        if (!this.isPlaying) this.processAudioQueue();
    }

    private async processAudioQueue() {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            return;
        }
        this.isPlaying = true;
        const pcmData = this.audioQueue.shift()!;
        if (!this.audioContext) return;
        const floatData = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 32768;
        const audioBuffer = this.audioContext.createBuffer(1, floatData.length, this.targetSampleRate);
        audioBuffer.getChannelData(0).set(floatData);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        const now = this.audioContext.currentTime;
        if (this.startTime < now) this.startTime = now;
        source.start(this.startTime);
        this.startTime += audioBuffer.duration;
        source.onended = () => {
            if (this.audioQueue.length === 0) this.isPlaying = false;
            else this.processAudioQueue();
        };
    }

    private stopPlaying() {
        this.audioQueue = [];
        this.isPlaying = false;
    }

    private cleanupAudioCapture() {
        this.audioStream?.getTracks().forEach((t) => t.stop());
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.audioStream = null;
        this.audioContext = null;
        this.processor = null;
        this.analyser = null;
        this.audioQueue = [];
        this.isPlaying = false;
        this.startTime = 0;
    }

    stopSession() {
        this.manualClose = true;
        this.suppressNextCloseError = true;
        this.socket?.close();
        this.cleanupAudioCapture();
        this.socket = null;
        this.assistantTextBuffer = '';
        this.isResponseActive = false;
        this.isResponseDone = true;
        this.reconnectAttempts = 0;
        this.isMicMuted = false;
        playDisconnectSound();
        this.onStateChange('disconnected');
    }
}

export const voiceLiveService = new VoiceLiveService();
