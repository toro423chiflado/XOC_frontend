import { api } from '../lib/axios';
import type { AgentInstance } from '../types/api';

// ─── Agent Configuration ──────────────────────────────────────────────────────

export interface AgentConfig {
    id?: string;
    company_id?: string;
    agentType?: string;
    functionBaseUrl: string;
    functionRoute: string;
    functionRouteVictor?: string;
    functionHistoryRoute?: string;
    functionDeleteRoute?: string;
    functionKey: string;
    functionKeyEncrypted?: string | null;
    accessKey?: string;
    azureSpeechRegion?: string;
    azureSpeechKey?: string;
    azureSpeechVoiceName?: string;
}

// ─── Chat Types ───────────────────────────────────────────────────────────────

export interface ChatSession {
    id: number;
    company_id: number;
    user_id: number;
    external_thread_id?: string;
    title?: string;
    purpose?: string;
    created_at: string;
    last_activity_at?: string;
}

export interface ChatResponse {
    text: string;
    thread_id?: string;   // Demo mode can reuse this for single-thread chats.
    session_id?: number;  // Always save and send back on subsequent messages.
    metadata?: {
        classification?: string;
        ticket?: { id: number; status: string };
    };
}

export interface SendMessageOptions {
    mode?: 'default' | 'demo';
    threadId?: string | null;
}

export interface ChatHistoryMessage {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    created_at: string | null;
}

export interface ChatHistoryResponse {
    thread_id: string;
    messages: ChatHistoryMessage[];
    count: number;
    session_id?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class SophiaService {
    /**
     * The only conversation state the frontend needs to track.
     * Persisted in sessionStorage so it survives page refreshes within the tab.
     * In default mode, never send thread_id — the backend resolves it internally from session_id.
     */
    private get currentSessionId(): number | null {
        const id = sessionStorage.getItem('sophia_session_id');
        return id ? parseInt(id, 10) : null;
    }

    private set currentSessionId(id: number | null) {
        if (id) {
            sessionStorage.setItem('sophia_session_id', id.toString());
        } else {
            sessionStorage.removeItem('sophia_session_id');
        }
    }

    /**
     * When true, the next sendMessage call will include `new_session: true`
     * and the flag will be reset automatically.
     */
    private _pendingNewSession = false;

    // ── Agent Instance Management ──────────────────────────────────────────────

    private mapToAgentConfig(agent: AgentInstance): AgentConfig {
        const settings = agent.settings || {};
        return {
            id: agent.id.toString(),
            company_id: agent.company_id.toString(),
            agentType: agent.agent_type || 'SVAFUNC',
            functionBaseUrl: settings.function_base_url || '',
            functionRoute: settings.function_route || '/api/agents/SophiaDurableAgent/run',
            functionRouteVictor: settings.function_route_victor || '/api/agents/VictorDurableAgent/run',
            functionHistoryRoute: settings.function_history_route || '/api/agents/SophiaDurableAgent/history',
            functionDeleteRoute: settings.function_delete_route || '/api/agents/SophiaDurableAgent/threads',
            // Key is never returned in full. Encrypted = show masked placeholder.
            functionKey: settings.function_key_encrypted ? '********' : '',
            functionKeyEncrypted: settings.function_key_encrypted || null,
            azureSpeechRegion: settings.azure_speech_region || '',
            azureSpeechKey: settings.azure_speech_key_encrypted ? '********' : '',
            azureSpeechVoiceName: settings.azure_speech_voice_name || '',
        };
    }

    /** GET /api/admin/agent-instances */
    async getAgentConfigs(): Promise<AgentConfig[]> {
        const { data } = await api.get<{ agent_instances: AgentInstance[] }>('/api/admin/agent-instances');
        return (data.agent_instances || []).map(this.mapToAgentConfig);
    }

    async getAgentConfig(): Promise<AgentConfig | null> {
        try {
            const agents = await this.getAgentConfigs();
            return agents.length > 0 ? agents[0] : null;
        } catch (error) {
            console.error('Failed to fetch agent config', error);
            return null;
        }
    }

    /** POST /api/admin/agent-instances */
    async createAgentInstance(config: any) {
        const { data } = await api.post('/api/admin/agent-instances', config);
        return data;
    }

    /** PATCH /api/admin/agent-instances/{id} */
    async updateAgentInstance(id: string, config: any) {
        const { data } = await api.patch(`/api/admin/agent-instances/${id}`, config);
        return data;
    }

    // ── Session Management ─────────────────────────────────────────────────────

    /**
     * Call this when the user clicks "Nueva Conversación".
     * Sets a flag so the next sendMessage includes new_session: true,
     * which tells the backend to explicitly create a new thread/session.
     */
    startNewConversation() {
        this.currentSessionId = null;
        this._pendingNewSession = true;
    }

    /** Switch the active session (used when clicking a session in the sidebar). */
    setSession(sessionId: number | null) {
        this.currentSessionId = sessionId;
        this._pendingNewSession = false;
    }

    /** GET /api/chat/sessions?limit=N */
    async getSessions(limit: number = 50): Promise<ChatSession[]> {
        try {
            const { data } = await api.get<{ sessions: ChatSession[]; count: number }>(
                `/api/chat/sessions?limit=${limit}`
            );
            return data.sessions || [];
        } catch (error) {
            console.warn('Failed to fetch chat sessions:', error);
            return [];
        }
    }

    /**
     * GET /api/chat/history?session_id={id}&limit={n}&order=asc
     * Returns normalized messages from Azure Foundry via backend.
     */
    async getChatHistory(sessionId: number, limit: number = 50): Promise<ChatHistoryMessage[]> {
        try {
            const { data } = await api.get<ChatHistoryResponse>(
                `/api/chat/history?session_id=${sessionId}&limit=${limit}&order=asc`
            );
            return data.messages || [];
        } catch (error) {
            console.warn('Failed to fetch chat history for session', sessionId, ':', error);
            return [];
        }
    }

    /** DELETE /api/chat/sessions/{id} */
    async deleteSession(sessionId: number): Promise<boolean> {
        try {
            await api.delete(`/api/chat/sessions/${sessionId}`);
            // If the deleted session was the current one, target for clearing
            if (this.currentSessionId === sessionId) {
                this.currentSessionId = null;
            }
            return true;
        } catch (error) {
            console.error('Failed to delete session', sessionId, ':', error);
            throw error;
        }
    }

    // ── Chat ───────────────────────────────────────────────────────────────────

    /**
     * POST /api/chat
     *
     * Payload logic:
     *   A) Nueva conversación  → { message, new_session: true }
     *   B) Continuar sesión    → { message, session_id: N }
     *   C) Sin contexto        → { message }  (backend reuses latest session)
     *
     * Default mode never sends thread_id (demo mode may reuse it).
     *
     * @param message   - User message text
     * @param onChunk   - Optional streaming callback (simulated client-side)
     */
    async sendMessage(
        message: string,
        onChunk?: (chunk: string) => void,
        options?: SendMessageOptions
    ): Promise<ChatResponse> {
        // Build payload according to backend rules
        const payload: {
            message: string;
            session_id?: number;
            new_session?: boolean;
            thread_id?: string;
        } = { message };

        if (options?.mode === 'demo') {
            if (options.threadId) {
                payload.thread_id = options.threadId;
            }
            this._pendingNewSession = false;
        } else {
            if (this._pendingNewSession) {
                // A) Explicit new conversation requested by user
                payload.new_session = true;
                this._pendingNewSession = false; // consume the flag
            } else if (this.currentSessionId) {
                // B) Continue existing session
                payload.session_id = this.currentSessionId;
            }
            // C) No context → backend will use latest session automatically
        }

        const { data } = await api.post<ChatResponse>('/api/chat', payload);

        // Always persist the session_id returned by the backend
        if (options?.mode !== 'demo' && data.session_id) {
            this.currentSessionId = data.session_id;
        }

        // Simulate typing/streaming effect client-side
        const responseText = data.text || '';
        if (onChunk && responseText) {
            let i = 0;
            const interval = setInterval(() => {
                if (i < responseText.length) {
                    onChunk(responseText.charAt(i));
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 7);
        }

        return data;
    }
}

export const sophiaService = new SophiaService();
