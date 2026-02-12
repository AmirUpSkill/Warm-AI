import { Agent } from '@/types/agent';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Info, Edit2 } from 'lucide-react';

interface AgentCardProps {
    agent: Agent;
    isOwner?: boolean;
}

export function AgentCard({ agent, isOwner }: AgentCardProps) {
    const navigate = useNavigate();

    return (
        <div
            className="group relative flex flex-col bg-secondary/50 border border-black/5 rounded-2xl p-5 hover:bg-secondary hover:border-black/10 transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
            onClick={() => navigate(`/agents/${agent.id}/edit`)}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden">
                    {agent.avatar_url ? (
                        <img src={agent.avatar_url} alt={agent.name} className="h-full w-full object-cover" />
                    ) : (
                        <User className="h-6 w-6 text-primary/60" />
                    )}
                </div>
                {isOwner && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="h-4 w-4 text-muted-foreground/40 hover:text-foreground" />
                    </div>
                )}
            </div>

            <h3 className="text-foreground font-medium text-lg mb-1 truncate">{agent.name}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2 min-h-[40px] mb-4">
                {agent.description || 'No description provided.'}
            </p>

            <div className="flex items-center gap-4 mt-auto">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                    <Shield className="h-3 w-3" />
                    <span>{agent.tone}</span>
                </div>
                {agent.contexts.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                        <Info className="h-3 w-3" />
                        <span>{agent.contexts.length} Sources</span>
                    </div>
                )}
            </div>

            {/* Subtle Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
}
