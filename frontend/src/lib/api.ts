// Warm AI API Configuration
const API_BASE_URL = 'http://localhost:8000';

export type ChatMode = 'standard' | 'web_search';
export type SearchType = 'people' | 'companies';

export interface ChatMessageRequest {
  conversation_id?: number;
  message: string;
  mode: ChatMode;
  model?: string;
}

export interface PersonCard {
  card_type: 'person';
  name: string;
  headline?: string;
  current_role?: string;
  company?: string;
  location?: string;
  linkedin_url: string;
  summary?: string;
  skills: string[];
  image_url?: string;
}

export interface CompanyCard {
  card_type: 'company';
  name: string;
  industry: string;
  founded_year?: number;
  description?: string;
  location?: string;
  website_url?: string;
  linkedin_url?: string;
  estimated_employees?: string;
  logo_url?: string;
}

export interface SearchResponse<T> {
  request_id: string;
  results: T[];
}

export interface SSEEvent {
  type: 'token' | 'citation' | 'done' | 'error' | 'session_created';
  content?: string;
  sources?: { title: string; url: string }[];
  error?: string;
  session_id?: number;
  title?: string;
}

// Chat API with SSE streaming
export async function streamChat(
  request: ChatMessageRequest,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          onEvent({ type: 'done' });
          continue;
        }
        try {
          const event = JSON.parse(data) as SSEEvent;
          onEvent(event);
        } catch {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }
}

// People Search API
export async function searchPeople(
  query: string,
  numResults: number = 5
): Promise<SearchResponse<PersonCard>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/search/people`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, num_results: numResults }),
  });

  if (!response.ok) {
    throw new Error(`Search API error: ${response.status}`);
  }

  return response.json();
}

// Company Search API
export async function searchCompanies(
  query: string,
  numResults: number = 5
): Promise<SearchResponse<CompanyCard>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/search/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, num_results: numResults }),
  });

  if (!response.ok) {
    throw new Error(`Search API error: ${response.status}`);
  }

  return response.json();
}

// Health check
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// --- History API ---

import { SessionSummary, SessionDetail, SessionUpdate } from '@/types/history';

/**
 * List past sessions.
 */
export const listSessions = async (skip = 0, limit = 20): Promise<SessionSummary[]> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/sessions?skip=${skip}&limit=${limit}`);

  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  return response.json();
};

export const getSession = async (sessionId: number): Promise<SessionDetail> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch session');
  }
  return response.json();
};

export const renameSession = async (sessionId: number, title: string): Promise<SessionSummary> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error('Failed to rename session');
  return response.json();
};

export const deleteSession = async (sessionId: number): Promise<{ status: string, id: number }> => {
  const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete session');
  return response.json();
};
