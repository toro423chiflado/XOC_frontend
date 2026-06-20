import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Mic, MicOff, Waves, ChevronLeft, ChevronRight, MessageSquare, PhoneMissed, Play, Clock, CalendarDays, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { liveVoiceService } from '../../services/live-voice.service';
import { speechService } from '../../services/speech.service';
import { voiceLiveService } from '../../services/voice-live.service';
import type { LiveVoiceSession, LiveVoiceMessage, LiveVoiceSessionId } from '../../types/live-voice';

export default function LiveVoiceSessionView() {
    const { user, isAuthenticated } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    // State for Sessions
    const [sessions, setSessions] = useState<LiveVoiceSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<LiveVoiceSessionId | null>(null);
    const [messages, setMessages] = useState<LiveVoiceMessage[]>([]);
    const [agentInstanceId, setAgentInstanceId] = useState<string | null>(null);

    // Voice State 
    const [voiceState, setVoiceState] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error' | 'connected' | 'disconnected'>('idle');
    const [volume, setVolume] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [streamingAssistant, setStreamingAssistant] = useState<LiveVoiceMessage | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const connectionRef = useRef<{ isConnecting: boolean }>({ isConnecting: false });
    const streamingAssistantRef = useRef<LiveVoiceMessage | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingAssistant]);

    useEffect(() => {
        if (!isAuthenticated || !user) return;
        loadSessions();
        loadSpeechSettings();
        // Cleanup on unmount
        return () => {
            voiceLiveService.stopSession();
        };
    }, [user, isAuthenticated]);

    const loadSpeechSettings = async () => {
        try {
            const settings = await speechService.getSpeechSettings();
            if (settings.agent_instance_id) {
                setAgentInstanceId(settings.agent_instance_id);
            }
        } catch (error) {
            console.error("[VOICE] Failed to load speech settings", error);
        }
    };

    const loadSessions = async () => {
        if (!user?.companyId) return;
        try {
            const data = await liveVoiceService.getSessions(user.companyId);
            setSessions(data.sessions || []);
        } catch (error) {
            console.error("[VOICE] Failed to load voice sessions", error);
        }
    };

    const handleSelectSession = async (id: LiveVoiceSessionId) => {
        if (activeSessionId && voiceState !== 'idle' && voiceState !== 'disconnected') {
            await handleEndSession();
        }
        setActiveSessionId(id);
        setStreamingAssistant(null);
        streamingAssistantRef.current = null;
        setVoiceState('idle');
        try {
            const detail = await liveVoiceService.getSessionDetails(id);
            setMessages(detail.messages || []);
        } catch (error) {
            console.error("[VOICE] Failed to load session details", error);
        }
    };

    const handleCreateSession = async () => {
        if (!user?.companyId || connectionRef.current.isConnecting || !agentInstanceId) {
            if (!agentInstanceId) {
                console.error('[VOICE] Missing configuration:', { agentInstanceId });
                alert("Error: Configuración de voz incompleta. Por favor contacte al administrador.");
            }
            return;
        }

        connectionRef.current.isConnecting = true;
        setVoiceState('connecting');

        try {
            const sessionName = `Voice Session ${new Date().toLocaleTimeString()}`;
            console.log("[VOICE] Creating live voice session with:", {
                tenantId: user.companyId,
                agentInstanceId,
                sessionName
            });

            // 1. Create session in backend
            const newSession = await liveVoiceService.createSession({
                tenantId: user.companyId.toString(),
                agentInstanceId: agentInstanceId,
                sessionName
            });
            console.log("[VOICE] Session created:", newSession);

            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newSession.id);
            setMessages([]);
            setStreamingAssistant(null);
            streamingAssistantRef.current = null;

            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                throw new Error('No se encontró access token de usuario. Inicia sesión nuevamente.');
            }

            // Bind WS Callbacks
            voiceLiveService.setCallbacks({
                onStateChange: (state) => {
                    setVoiceState(state);
                },
                onVolumeChange: (vol) => {
                    setVolume(vol);
                },
                onMuteChange: (muted) => {
                    setIsMuted(muted);
                },
                onError: (err) => {
                    console.error("[VOICE] Live Voice WS Error:", err);
                    setVoiceState('error');
                    connectionRef.current.isConnecting = false;
                },
                onMessageReceived: async (msg) => {
                    // Update transcription list in real-time
                    if (msg.role === 'user' && msg.isFinal) {
                        if (!msg.text || msg.text.trim().length === 0) return;
                        try {
                            const savedMsg = await liveVoiceService.addMessage(newSession.id, {
                                role: 'USER',
                                content: msg.text
                            });
                            setMessages(prev => [...prev, savedMsg]);
                        } catch (error: any) {
                            console.error('[VOICE] Failed to persist user message', {
                                sessionId: newSession.id,
                                messagePreview: msg.text?.slice(0, 60),
                                status: error?.response?.status,
                                data: error?.response?.data
                            });
                        }
                    } else if (msg.role === 'assistant') {
                        if (!msg.isFinal) {
                            setStreamingAssistant(prev => {
                                const base = prev || {
                                    id: -1,
                                    session_id: newSession.id,
                                    role: 'ASSISTANT',
                                    content: '',
                                    created_at: new Date().toISOString()
                                };
                                const updated = { ...base, content: base.content + msg.text };
                                streamingAssistantRef.current = updated;
                                return updated;
                            });
                            return;
                        }

                        const finalText = msg.text.trim().length > 0
                            ? msg.text
                            : (streamingAssistantRef.current?.content || '');

                        streamingAssistantRef.current = null;
                        setStreamingAssistant(null);

                        if (finalText.trim().length > 0) {
                            try {
                                const savedMsg = await liveVoiceService.addMessage(newSession.id, {
                                    role: 'ASSISTANT',
                                    content: finalText
                                });
                                setMessages(prev => [...prev, savedMsg]);
                            } catch (error: any) {
                                console.error('[VOICE] Failed to persist assistant message', {
                                    sessionId: newSession.id,
                                    messagePreview: finalText.slice(0, 60),
                                    status: error?.response?.status,
                                    data: error?.response?.data
                                });
                            }
                        }
                    }
                }
            });

            // 3. Start session through voice proxy using user JWT
            await voiceLiveService.startSession(
                accessToken
            );

            connectionRef.current.isConnecting = false;
        } catch (error) {
            console.error("[VOICE] Failed to create session or connect", error);
            setVoiceState('error');
            connectionRef.current.isConnecting = false;
        }
    };

    const handleEndSession = async () => {
        if (!activeSessionId) return;
        console.log("[VOICE] Ending session:", activeSessionId);
        voiceLiveService.stopSession();
        setVoiceState('idle');
        setVolume(0);
        setIsMuted(false);
        setStreamingAssistant(null);
        streamingAssistantRef.current = null;
        try {
            await liveVoiceService.endSession(activeSessionId);
            loadSessions(); // refresh status
        } catch (error) {
            console.error("[VOICE] Failed to end session", error);
        }
    };

    const renderedMessages = streamingAssistant ? [...messages, streamingAssistant] : messages;

    return (
        <DashboardLayout fullWidth>
            <div className="flex h-[calc(100vh-7rem)] overflow-hidden bg-dark-bg text-gray-100 rounded-2xl border border-dark-border shadow-2xl">

                {/* 1. Left Sidebar: Sessions History */}
                <div className={cn("bg-[#0d1117] flex-shrink-0 transition-all duration-300 border-r border-dark-border flex flex-col", isSidebarOpen ? "w-64" : "w-0 opacity-0 overflow-hidden")}>
                    <div className="p-4 border-b border-white/5 bg-gradient-to-r from-neon-blue/10 to-transparent">
                        <button
                            onClick={handleCreateSession}
                            type="button"
                            disabled={(voiceState !== 'idle' && voiceState !== 'error') || !agentInstanceId}
                            className="w-full flex gap-2 items-center justify-center p-3 bg-neon-green/20 hover:bg-neon-green/30 disabled:opacity-50 text-neon-green border border-neon-green/30 rounded-xl transition-all text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                        >
                            <Mic className="w-4 h-4" /> Start Live Call
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                        <h4 className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Historico de Llamadas
                        </h4>

                        {sessions.length === 0 ? (
                            <div className="text-center p-4 text-xs text-gray-500">No hay sesiones de voz previas.</div>
                        ) : (
                            sessions.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => handleSelectSession(s.id)}
                                    className={cn(
                                        "group flex flex-col gap-1 p-3 rounded-xl cursor-pointer transition-all border",
                                        activeSessionId === s.id ? "bg-white/10 border-white/10" : "bg-transparent border-transparent hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-medium text-xs text-white">
                                            {s.status === 'ACTIVE' ? (
                                                <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                                            ) : (
                                                <MessageSquare className="w-3 h-3 text-gray-500" />
                                            )}
                                            <span className="truncate max-w-[120px]">{s.session_name}</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-gray-500 bg-black/40 px-1.5 py-0.5 rounded">
                                            #{s.id}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                                        <span className="flex items-center gap-1">
                                            <CalendarDays className="w-3 h-3" />
                                            {new Date(s.created_at).toLocaleDateString()}
                                        </span>
                                        <span className={cn("px-1.5 py-0.5 rounded uppercase tracking-wider font-bold", s.status === 'ACTIVE' ? 'text-neon-green bg-neon-green/10' : 'text-gray-400 bg-white/5')}>
                                            {s.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Main Live Area */}
                <div className="flex-1 flex flex-col relative bg-[#0a0d14] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0d14] to-[#0a0d14]">
                    <div className="absolute top-4 left-4 z-10 flex items-center">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:text-white bg-dark-card/50 hover:bg-dark-card rounded-lg transition-colors border border-white/5">
                            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>

                    {['connecting', 'listening', 'speaking', 'connected'].includes(voiceState) && (
                        <div className="absolute top-4 right-4 z-10">
                            <div className="px-4 py-2 bg-neon-green/10 border border-neon-green/20 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(0,255,157,0.1)] backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                                <span className="text-xs font-black text-neon-green uppercase tracking-widest">{voiceState}...</span>
                                <div className="w-[1px] h-4 bg-white/10 mx-1" />
                                <button onClick={handleEndSession} className="text-red-400 hover:text-red-500 transition-colors p-1" title="Colgar Llamada">
                                    <PhoneMissed className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 flex overflow-hidden">
                        {/* 2A. Visualizer/Orb Section */}
                        <div className={cn("flex flex-col items-center justify-center transition-all duration-500", activeSessionId ? "w-1/2 border-r border-dark-border/50" : "flex-1")}>
                            {activeSessionId ? (
                                <div className="flex flex-col items-center">
                                    <VoiceOrb state={voiceState} volume={volume} />
                                    <div className="mt-12 text-center opacity-80">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                                            SOPHIA Live Voice
                                        </h3>
                                        <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8 font-medium">
                                            {voiceState === 'idle' || voiceState === 'disconnected' ? 'Llamada Finalizada. Revisa el historial.' : 'Conexión en tiempo real vía proxy SOPHIA Voice.'}
                                        </p>

                                        {['listening', 'speaking', 'connected'].includes(voiceState) && (
                                            <div className="flex items-center justify-center gap-4 mt-6">
                                                <button
                                                    onClick={() => voiceLiveService.toggleMute()}
                                                    type="button"
                                                    className={cn(
                                                        "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg",
                                                        isMuted 
                                                            ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30" 
                                                            : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                                    )}
                                                >
                                                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                                    {isMuted ? "Micrófono Silenciado" : "Silenciar Micrófono"}
                                                </button>
                                            </div>
                                        )}

                                        {['listening', 'speaking'].includes(voiceState) && (
                                            <div className="mt-6">
                                                <VoiceLevelBars volume={volume} isMuted={isMuted} isActive={voiceState === 'speaking' || voiceState === 'listening'} />
                                            </div>
                                        )}

                                        {(voiceState === 'idle' || voiceState === 'disconnected') && (
                                            <button
                                                onClick={handleCreateSession}
                                                type="button"
                                                className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2 mx-auto"
                                            >
                                                <Play className="w-4 h-4" /> Iniciar Nueva Llamada
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center animate-in fade-in duration-700">
                                    <div className="w-24 h-24 rounded-full bg-neon-green/10 border border-neon-green/20 flex flex-col items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                                        <Mic className="w-10 h-10 text-neon-green mb-1" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">Voice Operations Center</h2>
                                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                                        Inicia una llamada con la IA mediante WebSocket vía proxy seguro. Mantiene interrupción de voz nativa y transcripción en tiempo real.
                                    </p>
                                    <button
                                        onClick={handleCreateSession}
                                        type="button"
                                        disabled={!agentInstanceId}
                                        className="bg-neon-green hover:bg-green-500 disabled:opacity-50 text-white font-black px-8 py-3.5 rounded-xl uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all transform hover:scale-105"
                                    >
                                        Comenzar Llamada
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 2B. Live Transcription Section */}
                        {activeSessionId && (
                            <div className="w-1/2 flex flex-col bg-[#0d1117]/80 backdrop-blur-sm">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                                    <div className="flex items-center gap-2">
                                        <Waves className="w-4 h-4 text-neon-green" />
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Transcripción en Vivo</h3>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                                    {renderedMessages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3 opacity-50">
                                            <MicOff className="w-8 h-8" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Esperando audio...</p>
                                        </div>
                                    ) : (
                                        renderedMessages.map((m, idx) => (
                                            <div key={m.id || idx} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2", m.role === 'USER' ? "items-end" : "items-start")}>
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1 mr-1">
                                                    {m.role === 'USER' ? 'Tú' : 'SOPHIA'}
                                                </span>
                                                <div className={cn("px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed",
                                                    m.role === 'USER' ? "bg-neon-blue/10 border border-neon-blue/20 text-blue-50 rounded-tr-sm" :
                                                        "bg-white/5 border border-white/5 text-gray-100 rounded-tl-sm"
                                                )}>
                                                    {m.content}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Status Footer */}
                                {voiceState !== 'idle' && voiceState !== 'disconnected' && (
                                    <div className="p-4 bg-gradient-to-t from-black/50 to-transparent border-t border-white/5">
                                        <div className="flex items-center gap-3 text-xs text-gray-400 bg-white/5 border border-white/5 rounded-lg px-4 py-2.5">
                                            {isMuted ? (
                                                <><MicOff className="w-3.5 h-3.5 text-red-500" /> Micrófono silenciado a propósito...</>
                                            ) : voiceState === 'listening' ? (
                                                <><div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" /> Escuchando por el micrófono...</>
                                            ) : voiceState === 'speaking' ? (
                                                <><div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" /> SOPHIA está hablando...</>
                                            ) : (
                                                <><Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-500" /> Estableciendo conexión WebSocket...</>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// Re-using the VoiceOrb from previous iterations but stylized slightly differently for the standalone view
function VoiceOrb({ state, volume }: { state: string, volume: number }) {
    const dynamicScale = state === 'speaking' || state === 'listening' ? 1 + (volume / 200) : 1;

    return (
        <div className="relative w-80 h-80 flex items-center justify-center mt-10">
            {/* Atmosphere */}
            <div
                className={cn(
                    "absolute inset-0 rounded-full blur-[100px] transition-all duration-700 opacity-20",
                    state === 'speaking' ? "bg-neon-green scale-150" :
                        state === 'listening' ? "bg-neon-green scale-125" :
                            state === 'connected' ? "bg-cyan-500 scale-110" : "bg-gray-700 opacity-10"
                )}
                style={{ transform: `scale(${dynamicScale * 1.3})` }}
            />

            {/* Core Sphere */}
            <div
                className={cn(
                    "relative w-40 h-40 rounded-full backdrop-blur-3xl border border-white/10 shadow-2xl flex items-center justify-center transition-all duration-500 overflow-hidden z-10",
                    state === 'speaking' ? "ring-2 ring-cyan-400/50 shadow-[0_0_80px_rgba(34,211,238,0.2)] bg-blue-900/20" :
                        state === 'listening' ? "ring-2 ring-emerald-400/50 shadow-[0_0_80px_rgba(52,211,153,0.2)] bg-emerald-900/20" :
                            "bg-white/5"
                )}
                style={{ transform: `scale(${dynamicScale})` }}
            >
                <img
                    src="./SOPHIA.svg"
                    alt="S"
                    className={cn(
                        "w-20 h-20 relative z-20 transition-all duration-300",
                        state === 'speaking' ? "filter drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] scale-110" :
                            state === 'listening' ? "filter drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]" :
                                "opacity-30 grayscale"
                    )}
                />

                {state === 'speaking' && (
                    <div className="absolute inset-0 z-0 flex items-end opacity-60">
                        <div
                            className="w-full bg-cyan-400/30 transition-all duration-100 ease-out"
                            style={{ height: `${20 + (volume * 0.8)}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Ripple Effects Rings */}
            {['speaking', 'listening'].includes(state) && (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={cn(
                                "absolute w-40 h-40 border rounded-full transition-all duration-500 pointer-events-none",
                                state === 'speaking' ? "border-cyan-400/30" : "border-emerald-400/30"
                            )}
                            style={{
                                animation: `${state === 'speaking' ? 'ping' : 'pulse'} ${1.5 + i}s linear infinite`,
                                transform: `scale(${1 + (volume / 200) + (i * 0.3)})`,
                                opacity: 1 - (volume / 100)
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function VoiceLevelBars({ volume, isMuted, isActive }: { volume: number; isMuted: boolean; isActive: boolean }) {
    const baseHeights = [10, 16, 22, 16, 10];
    const multipliers = [0.6, 0.85, 1.1, 0.85, 0.6];
    const intensity = isMuted ? 0 : Math.min(1, volume / 100);

    return (
        <div className="flex items-end justify-center gap-2 h-10">
            {baseHeights.map((base, idx) => {
                const height = Math.round(base + base * multipliers[idx] * intensity * 2.2);
                return (
                    <div
                        key={idx}
                        className={cn(
                            "w-1.5 rounded-full transition-all duration-150",
                            isActive && !isMuted ? "bg-neon-green shadow-[0_0_12px_rgba(34,197,94,0.5)]" : "bg-white/10"
                        )}
                        style={{ height: `${height}px` }}
                    />
                );
            })}
        </div>
    );
}
