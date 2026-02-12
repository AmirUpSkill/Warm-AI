import { useEffect, useState } from 'react';
import { useAgentStore } from '@/store/use-agent-store';
import { AgentCard } from '@/components/AgentCard';
import { Plus, Search, LayoutGrid, User, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Agents() {
    const { agents, browseAgents, isLoading, fetchAgents, fetchBrowseAgents } = useAgentStore();
    const [activeTab, setActiveTab] = useState<'mine' | 'browse'>('browse');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchAgents();
        fetchBrowseAgents();
    }, []);

    const displayAgents = (activeTab === 'browse' ? browseAgents : agents).filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-y-auto bg-background scrollbar-thin scrollbar-thumb-black/5">
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-foreground tracking-tight flex items-center gap-3">
                            Agents
                            <LayoutGrid className="h-6 w-6 text-primary" />
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            Create and discover specialized AI agents for your professional workflows.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/agents/new')}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-lg shadow-black/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="h-5 w-5" />
                        Build Agent
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                    <div className="flex bg-secondary p-1 rounded-xl w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('browse')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'browse'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Globe className="h-4 w-4" />
                            Browse
                        </button>
                        <button
                            onClick={() => setActiveTab('mine')}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'mine'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <User className="h-4 w-4" />
                            My Agents
                        </button>
                    </div>

                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                        <input
                            type="text"
                            placeholder="Search by name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-background border border-black/5 rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary/20 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-48 bg-secondary rounded-2xl border border-black/5" />
                        ))}
                    </div>
                ) : displayAgents.length === 0 ? (
                    <div className="py-24 text-center space-y-4">
                        <div className="h-20 w-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Search className="h-10 w-10 text-muted-foreground/20" />
                        </div>
                        <h3 className="text-xl font-medium text-foreground">No agents found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            {searchQuery ? `We couldn't find any agents matching "${searchQuery}".` : "You haven't created any agents yet. Start building one!"}
                        </p>
                        {!searchQuery && activeTab === 'mine' && (
                            <button
                                onClick={() => navigate('/agents/new')}
                                className="text-primary font-semibold hover:text-primary/80 transition-colors mt-4"
                            >
                                Create your first agent →
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayAgents.map((agent) => (
                            <AgentCard
                                key={agent.id}
                                agent={agent}
                                isOwner={!agent.is_default}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
