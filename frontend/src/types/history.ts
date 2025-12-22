import { Message } from '@/components/ChatMessage';

export interface SessionSummary {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    message_count: number;
}

export interface SessionDetail {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
    messages: Message[];
}

export interface SessionUpdate {
    title: string;
}
