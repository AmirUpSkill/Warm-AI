import { create } from 'zustand';
import { SessionSummary, SessionDetail } from '@/types/history';
import { listSessions, getSession, renameSession, deleteSession, type PersonCard, type CompanyCard } from '@/lib/api';
import { Message } from '@/components/ChatMessage';

interface ChatState {
    sessions: SessionSummary[];
    currentSessionId: number | null;
    currentSessionMessages: Message[];
    currentSessionMeta: SessionSummary | null;
    isLoading: boolean;
    error: string | null;
    isSidebarOpen: boolean;

    // Actions
    fetchSessions: () => Promise<void>;
    selectSession: (sessionId: number) => Promise<void>;
    clearCurrentSession: () => void;
    createNewSession: () => void; // Resets current session state for a new chat
    deleteSession: (sessionId: number) => Promise<void>;
    renameSession: (sessionId: number, newTitle: string) => Promise<void>;

    // Message handling (to sync with UI)
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    setCurrentSessionId: (id: number | null) => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setCurrentSessionMeta: (session: SessionSummary | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    sessions: [],
    currentSessionId: null,
    currentSessionMessages: [],
    currentSessionMeta: null,
    isLoading: false,
    error: null,
    isSidebarOpen: true,

    fetchSessions: async () => {
        set({ isLoading: true, error: null });
        try {
            const sessions = await listSessions();
            // Sort by updated_at desc
            const sorted = sessions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            set({ sessions: sorted, isLoading: false });
        } catch (error) {
            console.error(error);
            set({ error: 'Failed to fetch sessions', isLoading: false });
        }
    },

    selectSession: async (sessionId: number) => {
        set({ isLoading: true, error: null, currentSessionId: sessionId });
        try {
            const session = await getSession(sessionId);

            // Transform backend messages to frontend Message format
            const messages: Message[] = session.messages.map((msg) => {
                let citations;
                let cards: Array<PersonCard | CompanyCard> | undefined;
                let content = msg.content;
                try {
                    citations = msg.sources ? JSON.parse(msg.sources) : undefined;
                } catch (e) {
                    console.warn('Failed to parse sources:', e);
                    citations = undefined;
                }

                // Attempt to parse structured cards stored as JSON
                try {
                    const parsed = JSON.parse(msg.content);
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.card_type) {
                        cards = parsed as Array<PersonCard | CompanyCard>;
                        // Hide raw JSON when we have rich cards
                        if (msg.role === 'assistant') {
                            content = '';
                        }
                    }
                } catch (e) {
                    // Ignore parse errors – content stays as-is for normal chat history
                }

                return {
                    id: msg.id.toString(),
                    role: msg.role as 'user' | 'assistant',
                    content,
                    citations,
                    cards,
                };
            });

            set({
                currentSessionMessages: messages,
                currentSessionMeta: session,
                isLoading: false
            });
        } catch (error) {
            console.error('Failed to load session:', error);
            set({ error: 'Failed to load session', isLoading: false });
        }
    },

    clearCurrentSession: () => {
        set({ currentSessionId: null, currentSessionMessages: [], currentSessionMeta: null });
    },

    createNewSession: () => {
        set({ currentSessionId: null, currentSessionMessages: [] });
    },

    deleteSession: async (sessionId: number) => {
        try {
            await deleteSession(sessionId);
            set((state) => ({
                sessions: state.sessions.filter((s) => s.id !== sessionId),
                // If deleted session was active, clear it
                currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
                currentSessionMessages: state.currentSessionId === sessionId ? [] : state.currentSessionMessages
            }));
        } catch (error) {
            console.error(error);
        }
    },

    renameSession: async (sessionId: number, newTitle: string) => {
        try {
            const updated = await renameSession(sessionId, newTitle);
            set((state) => ({
                sessions: state.sessions.map((s) => (s.id === sessionId ? updated : s))
            }));
        } catch (error) {
            console.error(error);
        }
    },

    setMessages: (messages) => set({ currentSessionMessages: messages }),
    addMessage: (message) => set((state) => ({ currentSessionMessages: [...state.currentSessionMessages, message] })),
    setCurrentSessionId: (id) => set({ currentSessionId: id }),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    setCurrentSessionMeta: (session) => set({ currentSessionMeta: session }),
}));
