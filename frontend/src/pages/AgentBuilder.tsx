import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAgentStore } from '@/store/use-agent-store';
import { ToneGrid } from '@/components/ToneGrid';
import { ContextFileUpload } from '@/components/ContextFileUpload';
import {
    ArrowLeft,
    Save,
    Trash2,
    Plus,
    MessageSquare,
    Settings,
    ShieldCheck,
    Zap,
    Image as ImageIcon,
    Loader2,
    Trash,
    ChevronRight,
    Send,
    User,
    History,
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react';
import { AgentCreate, AgentUpdate, AgentChatRequest } from '@/types/agent';
import { streamAgentChat } from '@/lib/api';
import { SSEEvent } from '@/lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function AgentBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = !!id;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {
        selectedAgent,
        tonePresets,
        isLoading,
        fetchTonePresets,
        selectAgent,
        createAgent,
        updateAgent,
        deleteAgent,
        uploadAvatar,
        uploadContext,
        removeContext
    } = useAgentStore();

    const [formData, setFormData] = useState<AgentCreate>({
        name: '',
        description: '',
        instructions: '',
        tone: 'professional',
        custom_tone: '',
        guardrails: JSON.stringify([]),
        is_public: false,
    });

    const [guardrailInput, setGuardrailInput] = useState('');
    const [testMessage, setTestMessage] = useState('');
    const [testChatMessages, setTestChatMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [isConfigVisible, setIsConfigVisible] = useState(true);

    useEffect(() => {
        fetchTonePresets();
        if (isEditing) {
            selectAgent(parseInt(id));
        } else {
            selectAgent(null);
        }
    }, [id]);

    useEffect(() => {
        if (selectedAgent && isEditing) {
            setFormData({
                name: selectedAgent.name,
                description: selectedAgent.description || '',
                instructions: selectedAgent.instructions,
                tone: selectedAgent.tone,
                custom_tone: selectedAgent.custom_tone || '',
                guardrails: JSON.stringify(selectedAgent.guardrails || []),
                is_public: selectedAgent.is_public,
            });
        }
    }, [selectedAgent]);

    const handleSave = async () => {
        try {
            if (isEditing) {
                await updateAgent(parseInt(id), formData);
            } else {
                const newAgent = await createAgent(formData);
                navigate(`/agents/${newAgent.id}/edit`);
            }
        } catch (err) {
            console.error('Save failed', err);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isEditing) return;
        try {
            await uploadAvatar(parseInt(id), file);
        } catch (err) {
            console.error('Avatar upload failed', err);
        }
    };

    const addGuardrail = () => {
        if (!guardrailInput.trim()) return;
        const current = JSON.parse(formData.guardrails || '[]');
        setFormData({ ...formData, guardrails: JSON.stringify([...current, guardrailInput.trim()]) });
        setGuardrailInput('');
    };

    const removeGuardrail = (index: number) => {
        const current = JSON.parse(formData.guardrails || '[]');
        const next = current.filter((_: any, i: number) => i !== index);
        setFormData({ ...formData, guardrails: JSON.stringify(next) });
    };

    const handleTestChat = async () => {
        if (!testMessage.trim() || isStreaming) return;

        const userMsg: Message = { role: 'user', content: testMessage };
        setTestChatMessages(prev => [...prev, userMsg]);
        setTestMessage('');
        setIsStreaming(true);

        let assistantMsg = { role: 'assistant' as const, content: '' };
        setTestChatMessages(prev => [...prev, assistantMsg]);

        try {
            // If we haven't saved the agent yet, we can't test RAG/Config via backend chat
            // but for MVP, we assume test chat works with saved agent id
            if (!isEditing) {
                assistantMsg.content = "Please save your agent first to start testing.";
                setTestChatMessages(prev => [...prev.slice(0, -1), assistantMsg]);
                setIsStreaming(false);
                return;
            }

            await streamAgentChat(
                parseInt(id),
                { agent_id: parseInt(id), message: userMsg.content, ephemeral: true },
                (event: SSEEvent) => {
                    if (event.type === 'token' && event.content) {
                        assistantMsg.content += event.content;
                        setTestChatMessages(prev => [...prev.slice(0, -1), { ...assistantMsg }]);
                    } else if (event.type === 'done') {
                        setIsStreaming(false);
                    } else if (event.type === 'error') {
                        console.error('Test chat error', event.error);
                        setIsStreaming(false);
                    }
                }
            );
        } catch (err) {
            console.error('Test chat failed', err);
            setIsStreaming(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Top Bar */}
            <div className="h-16 shrink-0 border-b border-black/5 bg-background flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/agents')}
                        className="p-2 hover:bg-black/5 rounded-lg text-muted-foreground hover:text-foreground transition-all"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="h-6 w-px bg-black/5" />
                    <button
                        onClick={() => setIsConfigVisible(!isConfigVisible)}
                        className="p-2 hover:bg-black/5 rounded-lg text-muted-foreground hover:text-foreground transition-all"
                        title={isConfigVisible ? "Hide Configuration" : "Show Configuration"}
                    >
                        {isConfigVisible ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                    </button>
                    <div className="h-6 w-px bg-black/5" />
                    <h1 className="text-foreground font-semibold">
                        {isEditing ? `Edit Agent: ${formData.name || 'Untitled'}` : 'Create New Agent'}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {isEditing && (
                        <button
                            onClick={async () => {
                                if (confirm('Delete this agent?')) {
                                    await deleteAgent(parseInt(id));
                                    navigate('/agents');
                                }
                            }}
                            className="p-2.5 text-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            title="Delete Agent"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !formData.name || !formData.instructions}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:scale-100 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEditing ? 'Save Changes' : 'Create Agent'}
                    </button>
                </div>
            </div>

            {/* Main Content - Split Panel */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Side: Configuration */}
                <div className={`overflow-y-auto scrollbar-thin scrollbar-thumb-black/5 p-8 space-y-12 bg-[#fdfcfb] transition-all duration-300 ease-in-out ${isConfigVisible ? 'w-[50%] opacity-100' : 'w-0 opacity-0 p-0 pointer-events-none'}`}>

                    {/* Identity Section */}
                    <section className="space-y-6">
                        <h2 className="text-foreground font-extrabold text-xl flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Identity
                        </h2>

                        <div className="grid grid-cols-[120px_1fr] gap-8">
                            <div className="space-y-3">
                                <div
                                    onClick={() => isEditing && fileInputRef.current?.click()}
                                    className={`h-[120px] w-[120px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all group overflow-hidden ${isEditing ? 'hover:border-primary/50 hover:bg-primary/5 cursor-pointer border-black/10' : 'border-black/5 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    {selectedAgent?.avatar_url ? (
                                        <img src={selectedAgent.avatar_url} className="h-full w-full object-cover" />
                                    ) : (
                                        <>
                                            <ImageIcon className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                            <span className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-wider group-hover:text-primary">Upload</span>
                                        </>
                                    )}
                                </div>
                                {!isEditing && <p className="text-[10px] text-muted-foreground/30 text-center italic">Save first to upload</p>}
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-widest pl-1">Agent Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-secondary/50 border border-black/5 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary/20 transition-all font-medium"
                                        placeholder="e.g. Research Assistant"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-foreground/80 uppercase tracking-widest pl-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-secondary/50 border border-black/5 rounded-xl px-4 py-3 text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary/20 transition-all resize-none h-24 text-sm leading-relaxed"
                                        placeholder="Briefly describe what this agent does..."
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Instructions Section (Notion-like) */}
                    <section className="space-y-6">
                        <h2 className="text-foreground font-extrabold text-xl flex items-center gap-2">
                            <Settings className="h-5 w-5 text-primary" />
                            Instructions & Personality
                        </h2>
                        <div className="bg-secondary/50 border border-black/5 rounded-2xl p-6 focus-within:border-primary/20 transition-colors">
                            <textarea
                                value={formData.instructions}
                                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                className="w-full bg-transparent text-foreground placeholder:text-foreground/50 focus:outline-none resize-none min-h-[300px] text-base leading-relaxed"
                                placeholder="What are the specific goals, behaviors, and knowledge this agent should have? Be detailed..."
                            />
                        </div>
                    </section>

                    {/* Guardrails Section */}
                    <section className="space-y-6">
                        <h2 className="text-foreground font-extrabold text-xl flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Behavior Guardrails
                        </h2>
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={guardrailInput}
                                    onChange={(e) => setGuardrailInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addGuardrail()}
                                    className="flex-1 bg-secondary/50 border border-black/5 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/20 placeholder:text-foreground/50"
                                    placeholder="e.g. Never mention competitors..."
                                />
                                <button
                                    onClick={addGuardrail}
                                    className="bg-secondary hover:bg-muted text-foreground p-2.5 rounded-xl transition-all"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {JSON.parse(formData.guardrails || '[]').map((g: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-lg px-3 py-1.5 group animate-in zoom-in-95 duration-200">
                                        <span className="text-xs text-primary font-medium">{g}</span>
                                        <button onClick={() => removeGuardrail(i)} className="text-primary/40 hover:text-primary">
                                            <Trash className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Tone Section */}
                    <section className="space-y-6">
                        <h2 className="text-foreground font-extrabold text-xl flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Tone & Style
                        </h2>
                        <ToneGrid
                            presets={tonePresets}
                            selectedTone={formData.tone}
                            onSelect={(toneId) => setFormData({ ...formData, tone: toneId })}
                        />
                    </section>

                    {/* Knowledge Context Section */}
                    <section className="space-y-6">
                        <h2 className="text-foreground font-extrabold text-xl flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Knowledge Context (RAG)
                        </h2>
                        {isEditing ? (
                            <ContextFileUpload
                                contexts={selectedAgent?.contexts || []}
                                onUpload={(file) => uploadContext(parseInt(id), file)}
                                onRemove={(ctxId) => removeContext(parseInt(id), ctxId)}
                            />
                        ) : (
                            <div className="p-8 bg-secondary/50 border border-black/5 rounded-2xl border-dashed text-center space-y-3">
                                <p className="text-sm text-muted-foreground/40">Knowledge base features are available after saving your agent.</p>
                            </div>
                        )}
                    </section>

                    {/* Settings Section */}
                    <section className="space-y-6 pb-20">
                        <h2 className="text-foreground font-extrabold text-xl flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            Privacy & Settings
                        </h2>
                        <div className="bg-secondary/50 border border-black/5 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-foreground font-bold font-serif">Public Visibility</h3>
                                    <p className="text-sm text-foreground/60">Allow others to discover and use this agent in the community gallery.</p>
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.is_public ? 'bg-primary' : 'bg-secondary-foreground/20'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_public ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        </div>
                    </section>

                </div>

                <div className={`flex flex-col transition-all duration-300 ease-in-out border-l border-black/5 ${isConfigVisible ? 'w-[50%]' : 'w-full'} bg-[#fdfcfb]`}>
                    {/* Header */}
                    <div className="h-14 shrink-0 flex items-center px-6 border-b border-black/5 justify-between">
                        <span className="text-sm text-foreground/60 font-medium tracking-tight">Sandbox Environment</span>
                        <button
                            onClick={() => setTestChatMessages([])}
                            className="px-4 py-2 text-sm font-semibold text-foreground border border-black/10 rounded-full hover:bg-black/5 transition-all"
                        >
                            Open New Chat ↗
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {testChatMessages.length === 0 ? (
                            /* Empty State - Centered when split, higher when full-width */
                            <div className={`flex-1 flex flex-col items-center p-8 ${isConfigVisible ? 'justify-center' : 'pt-[18vh]'}`}>
                                <div className="w-full max-w-4xl">
                                    {/* Structured Black-Bordered Input Box */}
                                    <div className="rounded-[28px] overflow-hidden border-[2.5px] border-black shadow-xl transition-all bg-[#fdfcfb]">
                                        {/* Black Header Tab Area */}
                                        <div className="bg-black px-6 py-3.5 flex items-center justify-between">
                                            <span className="text-white text-sm font-bold tracking-tight">@{formData.name || 'Your Agent'}</span>
                                            <div className="flex gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                                                <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                                            </div>
                                        </div>

                                        {/* Input Body */}
                                        <div className="p-1">
                                            <textarea
                                                value={testMessage}
                                                onChange={(e) => {
                                                    setTestMessage(e.target.value);
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleTestChat();
                                                    }
                                                }}
                                                placeholder="Ask your agent anything..."
                                                className="w-full bg-transparent p-6 text-foreground text-lg placeholder:text-foreground/20 focus:outline-none resize-none min-h-[100px] max-h-[200px] leading-relaxed"
                                            />

                                            {/* Bottom Toolbar */}
                                            <div className="flex items-center justify-between px-6 py-4 border-t border-black/5 bg-[#fdfcfb]">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2.5 text-foreground/30 hover:text-black hover:bg-black/5 rounded-xl transition-all">
                                                        <Plus className="h-5 w-5" />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={handleTestChat}
                                                    disabled={isStreaming || !testMessage.trim()}
                                                    className={`p-2.5 rounded-xl transition-all ${testMessage.trim()
                                                        ? 'bg-black text-white hover:bg-black/80 shadow-lg'
                                                        : 'text-foreground/10 cursor-not-allowed'}`}
                                                >
                                                    <Send className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Chat Messages */
                            <>
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin">
                                    {testChatMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-[24px] px-6 py-4 text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? 'bg-black text-white'
                                                : 'bg-[#fdfcfb] text-foreground border border-black/5'
                                                }`}>
                                                {msg.content ? (
                                                    msg.role === 'assistant' ? (
                                                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-secondary/50 prose-pre:rounded-xl">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                {msg.content}
                                                            </ReactMarkdown>
                                                        </div>
                                                    ) : (
                                                        msg.content
                                                    )
                                                ) : (
                                                    <div className="flex gap-1.5 py-1">
                                                        <div className="h-2 w-2 bg-black/10 rounded-full animate-bounce" />
                                                        <div className="h-2 w-2 bg-black/10 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                        <div className="h-2 w-2 bg-black/10 rounded-full animate-bounce [animation-delay:0.4s]" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Bottom Structured Input Area */}
                                <div className="p-8">
                                    <div className="w-full max-w-6xl mx-auto rounded-[28px] overflow-hidden border-[2.5px] border-black shadow-xl transition-all bg-[#fdfcfb]">
                                        {/* Black Header Tab Area */}
                                        <div className="bg-black px-6 py-2.5 flex items-center justify-between">
                                            <span className="text-white/90 text-xs font-bold tracking-wider">@{formData.name || 'Your Agent'}</span>
                                            <div className="flex gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                                                <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                                            </div>
                                        </div>

                                        {/* Input Body */}
                                        <div className="p-1">
                                            <textarea
                                                value={testMessage}
                                                onChange={(e) => {
                                                    setTestMessage(e.target.value);
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleTestChat();
                                                    }
                                                }}
                                                placeholder="Continue the conversation..."
                                                className="w-full bg-transparent p-5 text-foreground placeholder:text-foreground/20 focus:outline-none resize-none min-h-[80px] max-h-[150px] leading-relaxed"
                                            />

                                            <div className="flex items-center justify-between px-6 py-3.5 border-t border-black/5 bg-[#fdfcfb]">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 text-foreground/30 hover:text-black hover:bg-black/5 rounded-xl transition-all">
                                                        <Plus className="h-5 w-5" />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={handleTestChat}
                                                    disabled={isStreaming || !testMessage.trim()}
                                                    className={`p-2.5 rounded-xl transition-all ${testMessage.trim()
                                                        ? 'bg-black text-white hover:bg-black/80 shadow-lg'
                                                        : 'text-foreground/10 cursor-not-allowed'}`}
                                                >
                                                    <Send className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
