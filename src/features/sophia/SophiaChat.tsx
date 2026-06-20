import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { Send, User, RefreshCw, Plus, MessageSquare, ChevronLeft, ChevronRight, Loader2, Trash2, Copy, Check, Shield, Mic, MicOff, Waves } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { sophiaService, type ChatSession, type ChatHistoryMessage } from '../../services/sophia.service';
import { providerService } from '../../services/provider.service';
import { useVoiceLive } from '../../hooks/useVoiceLive';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isError?: boolean;
    isStreaming?: boolean;
    metadata?: {
        classification?: string;
        ticket?: {
            id: number;
            status: string;
        };
    };
};

export default function SophiaChat() {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const isDemo = user?.planStatus === 'DEMO';
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; sessionId: number | null }>({ isOpen: false, sessionId: null });
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [topVulnerabilities, setTopVulnerabilities] = useState<any[]>([]);

    // Voice Live Integration
    const {
        state: voiceState,
        startVoiceSession,
        stopVoiceSession,
        isConnected: isVoiceConnected,
        incomingMessage: voiceMsg,
        error: voiceError
    } = useVoiceLive(activeSessionId);

    const [voiceStreamingMessage, setVoiceStreamingMessage] = useState<Message | null>(null);

    useEffect(() => {
        async function fetchVulns() {
            try {
                const [openvas, insightvm] = await Promise.all([
                    providerService.getOpenvasMetrics().catch(() => null),
                    providerService.getInsightvmMetrics().catch(() => null)
                ]);

                const allVulns = [
                    ...(openvas?.topCVEs || []),
                    ...(insightvm?.topCVEs || [])
                ].sort((a, b) => b.count - a.count).slice(0, 8);

                setTopVulnerabilities(allVulns);
            } catch (err) {
                console.warn('Error fetching top vulns for sidebar:', err);
            }
        }
        fetchVulns();
    }, []);

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const activeSessionRef = useRef<number | null>(null);
    const demoThreadIdRef = useRef<string | null>(null);

    useEffect(() => {
        demoThreadIdRef.current = null;
    }, [user?.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, voiceStreamingMessage]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    // ─── Voice Message Sync ────────────────────────────────────────────────
    useEffect(() => {
        if (!voiceMsg) return;

        if (voiceMsg.role === 'user' && voiceMsg.isFinal) {
            const userMsg: Message = {
                id: `v-user-${Date.now()}`,
                role: 'user',
                content: voiceMsg.text,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, userMsg]);
        }
        else if (voiceMsg.role === 'assistant') {
            if (!voiceMsg.isFinal) {
                setVoiceStreamingMessage(prev => {
                    if (!prev) {
                        return {
                            id: 'v-streaming-assistant',
                            role: 'assistant',
                            content: voiceMsg.text,
                            timestamp: new Date()
                        };
                    }
                    return { ...prev, content: prev.content + voiceMsg.text };
                });
            } else {
                if (voiceStreamingMessage) {
                    setMessages(prev => [...prev, { ...voiceStreamingMessage, id: `v-as-${Date.now()}` }]);
                    setVoiceStreamingMessage(null);
                }
            }
        }
    }, [voiceMsg]);

    // ─── Session Loading ─────────────────────────────────────────────────────
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    useEffect(() => {
        if (isAuthLoading) return;
        if (!isAuthenticated || !user) {
            setSessions([]);
            setMessages([]);
            setActiveSessionId(null);
            sophiaService.setSession(null);
            demoThreadIdRef.current = null;
            return;
        }
        const forceNewSession = sessionStorage.getItem('sophia_force_new_session');
        if (forceNewSession) {
            sessionStorage.removeItem('sophia_force_new_session');
            if (!isDemo) {
                sophiaService.startNewConversation();
                activeSessionRef.current = null;
                setActiveSessionId(null);
                setMessages([]);
            }
        }
        if (isDemo) {
            setSessions([]);
            return;
        }
        loadSessions();
    }, [user, isAuthenticated, isAuthLoading, isDemo]);

    const loadSessions = async () => {
        if (isDemo) {
            setSessions([]);
            setIsLoadingSessions(false);
            return;
        }
        setIsLoadingSessions(true);
        try {
            const list = await sophiaService.getSessions();
            setSessions(list);
        } catch (err) {
            console.warn('Error loading sessions:', err);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const handleNewChat = () => {
        if (isDemo) return;
        sophiaService.startNewConversation();
        activeSessionRef.current = null;
        setActiveSessionId(null);
        setMessages([]);
        setInput('');
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    const handleSelectSession = async (session: ChatSession) => {
        if (isDemo) return;
        if (session.id === activeSessionId) return;
        activeSessionRef.current = session.id;
        sophiaService.setSession(session.id);
        setActiveSessionId(session.id);
        setMessages([]);

        try {
            const history: ChatHistoryMessage[] = await sophiaService.getChatHistory(session.id, 50);
            if (activeSessionRef.current !== session.id) return;

            if (history.length > 0) {
                const mapped: Message[] = history.map((m) => ({
                    id: m.id,
                    role: m.role,
                    content: m.text,
                    timestamp: m.created_at ? new Date(m.created_at) : new Date()
                }));
                setMessages(mapped);
            }
        } catch (err) {
            console.error('Error loading history:', err);
        }
    };

    const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, sessionId });
    };

    const confirmDelete = async () => {
        if (isDemo) {
            setDeleteModal({ isOpen: false, sessionId: null });
            return;
        }
        const sessionId = deleteModal.sessionId;
        if (!sessionId) return;
        try {
            await sophiaService.deleteSession(sessionId);
            if (activeSessionId === sessionId) {
                setActiveSessionId(null);
                setMessages([]);
            }
            loadSessions();
        } catch (err) {
            console.error('Error deleting session:', err);
        } finally {
            setDeleteModal({ isOpen: false, sessionId: null });
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const handleSend = async (e?: React.FormEvent, retryContent?: string, retryCount = 0) => {
        if (e) e.preventDefault();

        // 1. Prevent overlapping requests
        if (isTyping && !retryContent) return;

        const messageContent = retryContent || input;
        if (!messageContent.trim() || !user) return;

        // 2. Prepare visual bubbles
        let aiMsgId: string;
        if (!retryContent) {
            const baseId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : Date.now().toString();
            aiMsgId = `a-${baseId}`;
            const userMsg: Message = { id: `u-${baseId}`, role: 'user', content: messageContent, timestamp: new Date() };
            const aiMsg: Message = { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true };
            setMessages(prev => [...prev, userMsg, aiMsg]);
            setInput('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } else {
            // In case of retry, reuse the last message bubble if it belongs to assistant
            const lastMsg = messages[messages.length - 1];
            aiMsgId = (lastMsg && lastMsg.role === 'assistant')
                ? lastMsg.id
                : `a-${Date.now().toString()}`;
            setMessages(prev => prev.map(msg =>
                msg.id === aiMsgId ? { ...msg, isStreaming: true } : msg
            ));
        }

        setIsTyping(true);

        try {
            const currentSessionAtSend = activeSessionRef.current;
            const response = await sophiaService.sendMessage(
                messageContent,
                undefined,
                isDemo ? { mode: 'demo', threadId: demoThreadIdRef.current } : undefined
            );

            if (isDemo && response.thread_id && !demoThreadIdRef.current) {
                demoThreadIdRef.current = response.thread_id;
            }

            const responseText = response.text || '';
            if (responseText) {
                let i = 0;
                const intervalId = window.setInterval(() => {
                    if (currentSessionAtSend !== null && activeSessionRef.current !== currentSessionAtSend) {
                        clearInterval(intervalId);
                        setIsTyping(false);
                        return;
                    }

                    const nextContent = responseText.slice(0, i + 1);
                    setMessages(prev => {
                        let found = false;
                        const updated = prev.map(msg => {
                            if (msg.id !== aiMsgId) return msg;
                            found = true;
                            return { ...msg, content: nextContent, isStreaming: true };
                        });
                        if (!found) {
                            updated.push({
                                id: aiMsgId,
                                role: 'assistant',
                                content: nextContent,
                                timestamp: new Date(),
                                isStreaming: true
                            });
                        }
                        return updated;
                    });
                    i++;

                    if (i >= responseText.length) {
                        clearInterval(intervalId);
                        setMessages(prev => prev.map(msg =>
                            msg.id === aiMsgId ? {
                                ...msg,
                                content: responseText,
                                metadata: response.metadata,
                                isError: false,
                                isStreaming: false
                            } : msg
                        ));
                        setIsTyping(false);
                    }
                }, 7);
            } else {
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId ? {
                        ...msg,
                        metadata: response.metadata,
                        isError: false,
                        isStreaming: false
                    } : msg
                ));
                setIsTyping(false);
            }

            if (response.session_id) {
                if (isDemo) {
                    if (!activeSessionId) {
                        activeSessionRef.current = response.session_id;
                        setActiveSessionId(response.session_id);
                    }
                } else if (response.session_id !== activeSessionId) {
                    const newId = response.session_id;
                    activeSessionRef.current = newId;
                    setActiveSessionId(newId);
                    sophiaService.setSession(newId);
                }
            }
            if (!isDemo) loadSessions();
        } catch (err: any) {
            const status = err.response?.status;
            const errorCode = err.response?.data?.error_code;

            // 3. Retry Logic for 409 thread_run_active
            if ((status === 409 || errorCode === 'thread_run_active') && retryCount < 5) {
                const retryAfter = err.response?.data?.retry_after || 1.5;
                const delayMs = retryAfter * 1000;

            setMessages(prev => prev.map(msg =>
                msg.id === aiMsgId ? { ...msg, content: 'SophIA está procesando una solicitud anterior... Reintentando en breve.', isStreaming: true } : msg
            ));

                console.log(`Thread active. Retrying in ${delayMs}ms... (Attempt ${retryCount + 1}/5)`);

                setTimeout(() => {
                    handleSend(undefined, messageContent, retryCount + 1);
                }, delayMs);
                return;
            }

            // Fallback for other errors
            setMessages(prev => prev.map(msg =>
                msg.id === aiMsgId ? { ...msg, content: 'Error en la conexión con Sophia.', role: 'assistant', isError: true, isStreaming: false } : msg
            ));
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleVoice = async () => {
        if (isVoiceConnected) {
            stopVoiceSession();
        } else {
            if (!activeSessionId) {
                setIsTyping(true);
                try {
                    const res = await sophiaService.sendMessage(
                        "Iniciando sesión de voz...",
                        undefined,
                        isDemo ? { mode: 'demo', threadId: demoThreadIdRef.current } : undefined
                    );

                    if (isDemo && res.thread_id && !demoThreadIdRef.current) {
                        demoThreadIdRef.current = res.thread_id;
                    }

                    if (!res.session_id) {
                        setIsTyping(false);
                        return;
                    }

                    setActiveSessionId(res.session_id);
                    if (!isDemo) loadSessions();
                } catch (err) {
                    console.error("Failed to init", err);
                } finally {
                    setIsTyping(false);
                }
            }
            startVoiceSession();
        }
    };

    const groupSessionsByDate = () => {
        const today: ChatSession[] = [];
        const older: ChatSession[] = [];
        const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
        sessions.forEach(s => {
            const date = new Date(s.last_activity_at || s.created_at);
            if (isToday(date)) today.push(s);
            else older.push(s);
        });
        return { today, older };
    };

    const { today, older } = groupSessionsByDate();
    const showSidebar = !isDemo;

    return (
        <DashboardLayout fullWidth>
            <div className="flex h-[calc(100vh-7rem)] overflow-hidden bg-dark-bg text-gray-100 rounded-2xl border border-dark-border shadow-2xl">

                {/* 1. Sidebar */}
                {showSidebar && (
                    <div className={cn("bg-[#0d1117] flex-shrink-0 transition-all duration-300 border-r border-dark-border flex flex-col", isSidebarOpen ? "w-64" : "w-0 opacity-0 overflow-hidden")}>
                        <div className="p-3 flex gap-2">
                            <button onClick={handleNewChat} className="flex-1 flex items-center gap-2 px-3 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm transition-all text-white group">
                                <Plus className="w-4 h-4 text-neon-green" />
                                <span className="font-medium">Nueva Conversación</span>
                            </button>
                            <button onClick={loadSessions} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <RefreshCw className={cn("w-4 h-4", isLoadingSessions && "animate-spin")} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
                            {today.length > 0 && (
                                <div className="space-y-1">
                                    <h4 className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Hoy</h4>
                                    {today.map(s => (
                                        <SessionItem key={s.id} session={s} isActive={activeSessionId === s.id} onClick={() => handleSelectSession(s)} onDelete={(e) => handleDeleteSession(s.id, e)} />
                                    ))}
                                </div>
                            )}
                            {older.length > 0 && (
                                <div className="space-y-1">
                                    <h4 className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 mt-4">Anteriores</h4>
                                    {older.map(s => (
                                        <SessionItem key={s.id} session={s} isActive={activeSessionId === s.id} onClick={() => handleSelectSession(s)} onDelete={(e) => handleDeleteSession(s.id, e)} />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-dark-border bg-black/20 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue font-bold text-xs ring-1 ring-neon-blue/40">
                                {user?.username?.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Main Chat Area */}
                <div className="flex-1 flex flex-col relative bg-[#0d1117]/50">
                    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                        <div className="flex items-center">
                            {showSidebar && (
                                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:text-white bg-dark-card/50 hover:bg-dark-card rounded-lg transition-colors border border-white/5">
                                    {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                </button>
                            )}
                            {isVoiceConnected && (
                                <div className={cn("px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]", showSidebar && "ml-3")}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Voice Live Active</span>
                                </div>
                            )}
                        </div>
                        {isDemo && (
                            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-300 uppercase tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                Modo demo: chat consulta (sin acciones)
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex flex-col">
                        {isVoiceConnected || voiceState === 'error' ? (
                            <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                                {voiceState === 'error' ? (
                                    <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md text-center">
                                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Shield className="w-8 h-8 text-red-500" />
                                        </div>
                                        <h3 className="text-lg font-black text-white uppercase mb-2">Error de Conexión</h3>
                                        <p className="text-red-400 text-xs mb-6 font-mono break-words leading-relaxed">
                                            {voiceError}
                                        </p>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => startVoiceSession()}
                                                className="flex-1 bg-red-500 text-white font-black py-2 rounded-lg text-xs uppercase tracking-widest"
                                            >
                                                Reintentar
                                            </button>
                                            <button
                                                onClick={stopVoiceSession}
                                                className="flex-1 bg-white/5 text-white font-bold py-2 rounded-lg text-xs"
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <VoiceOrb state={voiceState} />
                                        <div className="mt-12 text-center">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
                                                Modo Voz Activo
                                            </h3>
                                            <p className="text-gray-500 text-sm max-w-xs mx-auto">
                                                SOPHIA te está escuchando. Puedes hablar con naturalidad o interrumpir cuando quieras.
                                            </p>
                                            <div className="mt-8 flex justify-center gap-2">
                                                <div className={cn("w-2 h-2 rounded-full", voiceState === 'listening' ? "bg-neon-green animate-pulse" : "bg-gray-700")} />
                                                <div className={cn("w-2 h-2 rounded-full", voiceState === 'speaking' ? "bg-neon-blue animate-pulse" : "bg-gray-700")} />
                                                <div className={cn("w-2 h-2 rounded-full", voiceState === 'connecting' ? "bg-yellow-500 animate-pulse" : "bg-gray-700")} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto space-y-6 pt-16 pb-20 w-full">
                                {messages.length === 0 && !isTyping && (
                                    <div className="h-full flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                                        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                                            <img src="/SOPHIA.svg" alt="SOPHIA" className="w-12 h-12" />
                                        </div>
                                        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">¿En qué puedo ayudarte?</h2>
                                        <p className="text-gray-500 text-sm">SOPHIA tiene acceso a tus herramientas de ciberseguridad.</p>
                                    </div>
                                )}

                                {messages.map((m) => (
                                    <MessageBubble key={m.id} message={m} copiedId={copiedId} onCopy={copyToClipboard} />
                                ))}
                                {voiceStreamingMessage && (
                                    <MessageBubble message={voiceStreamingMessage} copiedId={null} onCopy={() => { }} />
                                )}


                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-gradient-to-t from-[#0d1117] to-transparent">
                        <div className="max-w-4xl mx-auto relative group">
                            <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl flex flex-col focus-within:border-white/20 transition-all overflow-hidden backdrop-blur-md">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Envía un mensaje o inicia voz..."
                                    className="w-full bg-transparent text-white placeholder-gray-500 px-4 py-3 max-h-[200px] overflow-y-auto resize-none focus:outline-none text-sm"
                                    rows={1}
                                    disabled={isTyping}
                                />
                                <div className="flex justify-between items-center px-4 pb-3">
                                    <div className="flex items-center gap-2">
                                        <button className="text-gray-500 hover:text-white p-1 rounded transition-colors"><Plus className="w-4 h-4" /></button>
                                        <button
                                            onClick={toggleVoice}
                                            className={cn(
                                                "p-1.5 rounded-lg transition-all flex items-center gap-2 group",
                                                isVoiceConnected
                                                    ? "bg-red-500/20 text-red-500 border border-red-500/30"
                                                    : "text-gray-500 hover:text-neon-green hover:bg-neon-green/10"
                                            )}
                                        >
                                            {isVoiceConnected ? (
                                                <>
                                                    <MicOff className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{voiceState}</span>
                                                    <Waves className="w-4 h-4 animate-pulse" />
                                                </>
                                            ) : (
                                                <Mic className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!input.trim() || isTyping}
                                        className={cn(
                                            "bg-neon-green text-black font-black px-4 py-1.5 rounded-lg text-xs uppercase tracking-widest transition-all disabled:opacity-20",
                                            input.trim() && !isTyping && "shadow-[0_0_15px_rgba(0,255,157,0.4)]"
                                        )}
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Right Sidebar */}
                <div className="w-80 bg-[#0d1117] border-l border-dark-border hidden xl:flex flex-col">
                    <div className="p-5 border-b border-dark-border flex items-center gap-2 text-white">
                        <Shield className="w-4 h-4 text-red-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Active Threats</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {topVulnerabilities.map((v, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-red-400 uppercase">{v.severity}</span>
                                    <span className="text-[10px] text-gray-500 font-mono">Count: {v.count}</span>
                                </div>
                                <div className="text-sm font-bold text-gray-200">{v.cve}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2">¿Eliminar conversación?</h3>
                        <p className="text-gray-400 text-sm mb-6">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModal({ isOpen: false, sessionId: null })} className="flex-1 py-2 rounded-lg bg-white/5 text-white text-sm font-bold">Cancelar</button>
                            <button onClick={confirmDelete} className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-500 text-sm font-bold border border-red-500/30">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function MessageBubble({ message, copiedId, onCopy }: { message: Message, copiedId: string | null, onCopy: (txt: string, id: string) => void }) {
    const isAssistant = message.role === 'assistant';
    return (
        <div className={cn("flex gap-4 animate-in fade-in duration-300", message.role === 'user' ? "flex-row-reverse" : "")}> 
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1", isAssistant ? "bg-[#0d1117] ring-1 ring-neon-green/20" : "bg-white/5")}>
                {isAssistant ? <img src="/SOPHIA.svg" className="w-6 h-6" alt="S" /> : <User className="w-5 h-5 text-gray-400" />}
            </div>
            <div className={cn("flex flex-col max-w-[80%]", message.role === 'user' ? "items-end" : "items-start")}>
                <div className={cn("px-4 py-3 rounded-2xl text-[14px] leading-relaxed relative group transition-all duration-300",
                    isAssistant ? "bg-white/[0.03] text-gray-100 border border-white/5" : "bg-neon-green text-black font-medium",
                    isAssistant && !message.content ? "animate-pulse py-4 px-6" : "")}
                >
                    {isAssistant && !message.content ? (
                        <div className="flex gap-1 items-center">
                            <Loader2 className="w-4 h-4 text-neon-green animate-spin mr-2" />
                            <span className="text-[10px] font-black text-neon-green uppercase tracking-widest animate-pulse">Procesando...</span>
                        </div>
                    ) : (
                        <>
                            <div className="markdown-content">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                </ReactMarkdown>
                                {isAssistant && message.content && (
                                    <div className="flex justify-end mt-4 pt-2 border-t border-white/5">
                                        <button
                                            onClick={() => onCopy(message.content, message.id)}
                                            className="flex items-center gap-1.5 p-1 px-2 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider"
                                            title="Copiar respuesta"
                                        >
                                            {copiedId === message.id ? (
                                                <>
                                                    <Check className="w-3 h-3 text-neon-green" />
                                                    <span className="text-neon-green">Copiado</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3 h-3" />
                                                    <span>Copiar</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function SessionItem({ session, isActive, onClick, onDelete }: { session: ChatSession, isActive: boolean, onClick: () => void, onDelete: (e: any) => void }) {
    return (
        <div onClick={onClick} className={cn("group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all", isActive ? "bg-white/10 text-white" : "text-gray-500 hover:bg-white/5")}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="flex-1 truncate text-xs font-medium">{session.title || `Chat ${session.id}`}</span>
            <button onClick={onDelete} className="p-1 hover:text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
        </div>
    );
}

function VoiceOrb({ state }: { state: string }) {
    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Outer Glows */}
            <div className={cn(
                "absolute inset-0 rounded-full blur-3xl transition-all duration-1000",
                state === 'speaking' ? "bg-neon-blue/40 scale-125" :
                    state === 'listening' ? "bg-neon-green/30 scale-110" : "bg-gray-500/10 scale-100"
            )} />

            {/* Pulsing Rings */}
            <div className={cn(
                "absolute inset-0 border-2 rounded-full border-white/5 transition-all duration-1000",
                state === 'speaking' ? "animate-[ping_3s_linear_infinite] border-neon-blue/20" :
                    state === 'listening' ? "animate-[pulse_2s_linear_infinite] border-neon-green/20" : ""
            )} />

            {/* Main Orb */}
            <div className={cn(
                "w-32 h-32 rounded-full bg-gradient-to-br from-white/10 to-transparent backdrop-blur-3xl border border-white/20 shadow-2xl flex items-center justify-center transition-all duration-500",
                state === 'speaking' ? "ring-4 ring-neon-blue/20 scale-110" :
                    state === 'listening' ? "ring-4 ring-neon-green/20 scale-105" : ""
            )}>
                {/* Internal SOPHIA Icon */}
                <img
                    src="/SOPHIA.svg"
                    alt="S"
                    className={cn(
                        "w-16 h-16 transition-all duration-500",
                        state === 'speaking' ? "scale-110 filter drop-shadow-[0_0_10px_rgba(0,183,255,0.5)]" :
                            state === 'listening' ? "scale-100 filter drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]" : "opacity-50"
                    )}
                />
            </div>

            {/* Wave Effects for Speaking */}
            {state === 'speaking' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="absolute w-full h-full border border-neon-blue/30 rounded-full animate-[ping_4s_linear_infinite]"
                            style={{ animationDelay: `${i * 1.3}s` }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
