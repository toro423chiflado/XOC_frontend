export type LiveVoiceSessionStatus = 'ACTIVE' | 'ENDED';
export type LiveVoiceMessageRole = 'USER' | 'ASSISTANT';
export type LiveVoiceSessionId = string;

export interface LiveVoiceSession {
    id: LiveVoiceSessionId;
    tenant_id: number | string;
    agent_instance_id: string;
    session_name: string;
    status: LiveVoiceSessionStatus;
    created_at: string;
    ended_at: string | null;
}

export interface LiveVoiceMessage {
    id: number | string;
    session_id: LiveVoiceSessionId;
    role: LiveVoiceMessageRole;
    content: string;
    created_at: string;
}

export interface LiveVoiceSessionDetail extends LiveVoiceSession {
    messages: LiveVoiceMessage[];
}

export interface CreateLiveVoiceSessionDto {
    tenantId: string;
    agentInstanceId: string;
    sessionName?: string;
}

export interface AddLiveVoiceMessageDto {
    role: LiveVoiceMessageRole;
    content: string;
}

export interface ListLiveVoiceSessionsResponse {
    sessions: LiveVoiceSession[];
    count: number;
}
