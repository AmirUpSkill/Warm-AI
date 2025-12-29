import type { ChatMode } from '@/lib/api';

export interface SessionSummary {
    id: number;
    title: string;
    mode: ChatMode;
    file_name?: string | null;
    file_search_store_name?: string | null;
    created_at: string;
    updated_at: string;
}

export interface BackendMessage {
    id: number;
    role: string;
    content: string;
    sources?: string; // JSON string from backend
    created_at: string;
}

export interface SessionDetail extends SessionSummary {
    messages: BackendMessage[];
}

export interface SessionUpdate {
    title: string;
}
