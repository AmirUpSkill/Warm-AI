export interface Agent {
    id: number;
    name: string;
    description?: string;
    avatar_url?: string;
    instructions: string;
    guardrails?: string[];
    tone: string;
    custom_tone?: string;
    is_default: boolean;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    contexts: AgentContext[];
}

export interface AgentContext {
    id: number;
    file_name: string;
    created_at: string;
}

export interface TonePreset {
    id: string;
    name: string;
    description: string;
}

export interface AgentCreate {
    name: string;
    description?: string;
    instructions: string;
    guardrails?: string; // JSON string from array
    tone: string;
    custom_tone?: string;
    is_public: boolean;
}

export interface AgentUpdate extends Partial<AgentCreate> { }

export interface AgentChatRequest {
    agent_id: number;
    message: string;
    session_id?: number;
    ephemeral: boolean;
}

export interface AgentChatResponse {
    type: 'token' | 'file_citation' | 'session_created' | 'done' | 'error';
    content: string;
    session_id?: number;
}
