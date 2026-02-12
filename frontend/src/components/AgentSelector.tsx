import { useState, useEffect } from 'react';
import { useAgentStore } from '@/store/use-agent-store';
import { Agent } from '@/types/agent';
import { User, Check, LayoutGrid, XCircle, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandDialog,
} from "@/components/ui/command";

interface AgentSelectorContentProps {
    selectedAgentId: number | null;
    onSelect: (agent: Agent | null) => void;
}

export function AgentSelectorContent({ selectedAgentId, onSelect }: AgentSelectorContentProps) {
    const { agents, browseAgents, fetchAgents, fetchBrowseAgents } = useAgentStore();
    const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

    useEffect(() => {
        fetchAgents();
        fetchBrowseAgents();
    }, [fetchAgents, fetchBrowseAgents]);

    const displayedAgents = activeTab === 'all' ? browseAgents : agents;

    return (
        <Command className="bg-[#fdfcfb]">
            <div className="p-3 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-foreground/50 font-bold text-[10px] uppercase tracking-widest px-1">Select Agent</h3>
                {selectedAgentId && (
                    <button
                        onClick={() => onSelect(null)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/5 text-[10px] uppercase tracking-wider font-bold text-foreground/60 hover:text-foreground hover:bg-black/10 transition-all"
                    >
                        <XCircle className="w-3.5 h-3.5" />
                        Clear Selection
                    </button>
                )}
            </div>

            <CommandInput
                placeholder="Search agents..."
                className="h-11 border-none focus:ring-0"
            />

            <div className="p-2 border-b border-black/5">
                <div className="flex bg-black/5 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'all' ? 'bg-[#fdfcfb] text-foreground shadow-sm' : 'text-foreground/40 hover:text-foreground/60'}`}
                    >
                        Browse
                    </button>
                    <button
                        onClick={() => setActiveTab('mine')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'mine' ? 'bg-[#fdfcfb] text-foreground shadow-sm' : 'text-foreground/40 hover:text-foreground/60'}`}
                    >
                        My Agents
                    </button>
                </div>
            </div>

            <CommandList className="max-h-[300px] p-2">
                <CommandEmpty className="py-8 text-center">
                    <div className="h-10 w-10 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-2">
                        <LayoutGrid className="h-5 w-5 text-foreground/20" />
                    </div>
                    <p className="text-xs text-foreground/40 italic">No agents found</p>
                </CommandEmpty>

                <CommandGroup>
                    {displayedAgents.map((agent) => (
                        <CommandItem
                            key={agent.id}
                            onSelect={() => onSelect(agent)}
                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer data-[selected='true']:bg-black/5 transition-colors duration-200 group relative"
                        >
                            <div className="relative h-10 w-10 shrink-0">
                                <div className="h-full w-full rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                                    {agent.avatar_url ? (
                                        <img src={agent.avatar_url} alt={agent.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-5 w-5 text-primary" />
                                    )}
                                </div>
                                {selectedAgentId === agent.id && (
                                    <div className="absolute -top-1 -right-1 bg-primary h-4 w-4 rounded-full border-2 border-[#fdfcfb] flex items-center justify-center">
                                        <Check className="h-2 w-2 text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-semibold text-foreground truncate">{agent.name}</span>
                                <span className="text-[10px] text-foreground/40 truncate">
                                    {agent.description || 'No description'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {activeTab === 'mine' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Are you sure you want to delete ${agent.name}?`)) {
                                                const { deleteAgent } = useAgentStore.getState();
                                                deleteAgent(agent.id);
                                            }
                                        }}
                                        className="p-2 text-foreground/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                                <div className="text-[10px] font-bold tracking-widest text-primary/40 opacity-0 group-data-[selected='true']:opacity-100 uppercase translate-x-2 group-data-[selected='true']:translate-x-0 transition-all flex-shrink-0">
                                    {selectedAgentId === agent.id ? 'Selected' : 'Select'}
                                </div>
                            </div>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>

            <div className="p-3 bg-black/[0.02] border-t border-black/5">
                <button
                    onClick={() => window.location.href = '/agents'}
                    className="w-full py-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
                >
                    Manage Agents
                </button>
            </div>
        </Command>
    );
}

interface AgentSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAgentId: number | null;
    onSelect: (agent: Agent | null) => void;
}

export function AgentSelector({ open, onOpenChange, selectedAgentId, onSelect }: AgentSelectorProps) {
    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <AgentSelectorContent
                selectedAgentId={selectedAgentId}
                onSelect={(agent) => {
                    onSelect(agent);
                    onOpenChange(false);
                }}
            />
        </CommandDialog>
    );
}
