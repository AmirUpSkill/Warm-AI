import { create } from 'zustand';
import {
    Agent,
    TonePreset,
    AgentCreate,
    AgentUpdate
} from '@/types/agent';
import * as api from '@/lib/api';

interface AgentState {
    agents: Agent[];
    browseAgents: Agent[];
    tonePresets: TonePreset[];
    selectedAgent: Agent | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchAgents: () => Promise<void>;
    fetchBrowseAgents: () => Promise<void>;
    fetchTonePresets: () => Promise<void>;
    selectAgent: (agentId: number | null) => Promise<void>;
    createAgent: (data: AgentCreate) => Promise<Agent>;
    updateAgent: (agentId: number, data: AgentUpdate) => Promise<Agent>;
    deleteAgent: (agentId: number) => Promise<void>;
    uploadAvatar: (agentId: number, file: File) => Promise<string>;
    uploadContext: (agentId: number, file: File) => Promise<void>;
    removeContext: (agentId: number, contextId: number) => Promise<void>;
}

export const useAgentStore = create<AgentState>((set, get) => ({
    agents: [],
    browseAgents: [],
    tonePresets: [],
    selectedAgent: null,
    isLoading: false,
    error: null,

    fetchAgents: async () => {
        set({ isLoading: true, error: null });
        try {
            const agents = await api.listAgents(true, false);
            set({ agents, isLoading: false });
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false });
        }
    },

    fetchBrowseAgents: async () => {
        set({ isLoading: true, error: null });
        try {
            const browseAgents = await api.listAgents(false, true);
            set({ browseAgents, isLoading: false });
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false });
        }
    },

    fetchTonePresets: async () => {
        try {
            const tonePresets = await api.getTonePresets();
            set({ tonePresets });
        } catch (err) {
            console.error('Failed to fetch tone presets', err);
        }
    },

    selectAgent: async (agentId: number | null) => {
        if (agentId === null) {
            set({ selectedAgent: null });
            return;
        }

        set({ isLoading: true });
        try {
            const agent = await api.getAgent(agentId);
            set({ selectedAgent: agent, isLoading: false });
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false });
        }
    },

    createAgent: async (data: AgentCreate) => {
        set({ isLoading: true, error: null });
        try {
            const newAgent = await api.createAgent(data);
            set((state) => ({
                agents: [newAgent, ...state.agents],
                isLoading: false
            }));
            return newAgent;
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false });
            throw err;
        }
    },

    updateAgent: async (agentId: number, data: AgentUpdate) => {
        set({ isLoading: true, error: null });
        try {
            const updatedAgent = await api.updateAgent(agentId, data);
            set((state) => ({
                agents: state.agents.map((a) => (a.id === agentId ? updatedAgent : a)),
                selectedAgent: state.selectedAgent?.id === agentId ? updatedAgent : state.selectedAgent,
                isLoading: false
            }));
            return updatedAgent;
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false });
            throw err;
        }
    },

    deleteAgent: async (agentId: number) => {
        set({ isLoading: true, error: null });
        try {
            await api.deleteAgent(agentId);
            set((state) => ({
                agents: state.agents.filter((a) => a.id !== agentId),
                selectedAgent: state.selectedAgent?.id === agentId ? null : state.selectedAgent,
                isLoading: false
            }));
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false });
            throw err;
        }
    },

    uploadAvatar: async (agentId: number, file: File) => {
        try {
            const { avatar_url } = await api.uploadAgentAvatar(agentId, file);
            set((state) => ({
                agents: state.agents.map((a) => a.id === agentId ? { ...a, avatar_url } : a),
                selectedAgent: state.selectedAgent?.id === agentId ? { ...state.selectedAgent, avatar_url } : state.selectedAgent
            }));
            return avatar_url;
        } catch (err) {
            set({ error: (err as Error).message });
            throw err;
        }
    },

    uploadContext: async (agentId: number, file: File) => {
        try {
            const newContext = await api.uploadAgentContext(agentId, file);
            set((state) => ({
                agents: state.agents.map((a) =>
                    a.id === agentId ? { ...a, contexts: [...(a.contexts || []), newContext] } : a
                ),
                selectedAgent: state.selectedAgent?.id === agentId
                    ? { ...state.selectedAgent, contexts: [...(state.selectedAgent.contexts || []), newContext] }
                    : state.selectedAgent
            }));
        } catch (err) {
            set({ error: (err as Error).message });
            throw err;
        }
    },

    removeContext: async (agentId: number, contextId: number) => {
        try {
            await api.deleteAgentContext(agentId, contextId);
            set((state) => ({
                agents: state.agents.map((a) =>
                    a.id === agentId ? { ...a, contexts: a.contexts.filter(c => c.id !== contextId) } : a
                ),
                selectedAgent: state.selectedAgent?.id === agentId
                    ? { ...state.selectedAgent, contexts: state.selectedAgent.contexts.filter(c => c.id !== contextId) }
                    : state.selectedAgent
            }));
        } catch (err) {
            set({ error: (err as Error).message });
            throw err;
        }
    }
}));
