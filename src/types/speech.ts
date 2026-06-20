export interface SpeechTokenResponse {
    speechToken: string;
    region: string;
    expiresIn: number;
}

export interface ScopedTokenResponse {
    scopedToken: string;
    expiresOn: number;
}

export interface SpeechSettings {
    company_id: number;
    agent_instance_id: string;
    speech_region: string;
    speech_voice_name: string;
    has_speech_key: boolean;
    foundryResource?: string;
    projectName?: string;
    agentId?: string;
    agentName?: string;
}

export interface UpdateSpeechSettingsPayload {
    azure_speech_region: string;
    azure_speech_voice_name: string;
    speech_key?: string;
    foundryResource?: string;
    projectName?: string;
    agentId?: string;
    agentName?: string;
}

export interface UpdateSpeechSettingsResponse {
    message: string;
    speech_region: string;
    speech_voice_name: string;
    has_speech_key: boolean;
}
