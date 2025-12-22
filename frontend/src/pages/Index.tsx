import { useState, useRef, useCallback, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { OmniInput, type InputMode, type ChatMode } from '@/components/OmniInput';
import { ChatMessage, type Message, type Citation } from '@/components/ChatMessage';
import { PersonCard } from '@/components/PersonCard';
import { CompanyCard } from '@/components/CompanyCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { SuggestedQueries } from '@/components/SuggestedQueries';
import { ModeSelector, type ModeOption } from '@/components/ModeSelector';
import { WarmLogo } from '@/components/WarmLogo';
import { Command, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/use-chat-store';
import { HistorySidebar } from '@/components/HistorySidebar';
import {
  streamChat,
  searchPeople,
  searchCompanies,
  type PersonCard as PersonCardType,
  type CompanyCard as CompanyCardType,
} from '@/lib/api';

export default function Index() {
  const [mode, setMode] = useState<InputMode>('chat');
  const [chatMode, setChatMode] = useState<ChatMode>('standard');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Store integration
  const {
    currentSessionMessages: messages,
    setMessages,
    addMessage,
    currentSessionId,
    createNewSession,
    setCurrentSessionId,
    fetchSessions
  } = useChatStore();

  // Local loading state for UI feedback (store has its own isLoading for sessions)
  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Search state
  const [peopleResults, setPeopleResults] = useState<PersonCardType[]>([]);
  const [companyResults, setCompanyResults] = useState<CompanyCardType[]>([]);

  const generateId = () => Math.random().toString(36).slice(2, 9);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const handleModeSelect = (option: ModeOption) => {
    setMode(option.mode);
    if (option.chatMode) {
      setChatMode(option.chatMode);
    }
    // Clear all results when switching modes
    setPeopleResults([]);
    setCompanyResults([]);
    setMessages([]); // Clear chat messages when switching modes
  };

  const handleChatSubmit = useCallback(
    async (input: string) => {
      if (!input.trim()) return;

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: input,
      };

      // Use store action
      addMessage(userMessage);
      setIsLoading(true);

      const assistantId = generateId();
      let assistantContent = '';
      let assistantCitations: Citation[] = [];

      // Add placeholder
      addMessage({ id: assistantId, role: 'assistant', content: '', isStreaming: true });

      abortControllerRef.current = new AbortController();

      try {
        await streamChat(
          {
            message: input,
            mode: chatMode,
            conversation_id: currentSessionId || undefined // Send ID if we have one
          },
          (event) => {
            if (event.type === 'session_created' && event.session_id) {
              // New session created by backend
              setCurrentSessionId(event.session_id);
              // Refresh sessions list to show the new session
              fetchSessions();
            } else if (event.type === 'token' && event.content) {
              assistantContent += event.content;
              // Update last message
              // We need to access current messages to map
              // Use functional update pattern with useChatStore.setState or just get latest
              const currentMessages = useChatStore.getState().currentSessionMessages;
              const updated = currentMessages.map((m) =>
                m.id === assistantId
                  ? { ...m, content: assistantContent }
                  : m
              );
              setMessages(updated);

            } else if (event.type === 'citation' && event.sources) {
              assistantCitations = event.sources;
            } else if (event.type === 'done') {
              const currentMessages = useChatStore.getState().currentSessionMessages;
              const updated = currentMessages.map((m) =>
                m.id === assistantId
                  ? { ...m, isStreaming: false, citations: assistantCitations }
                  : m
              );
              setMessages(updated);
              setIsLoading(false);
            } else if (event.type === 'error') {
              toast.error(event.error || 'Stream error');
              setIsLoading(false);
            }
          },
          abortControllerRef.current.signal
        );
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Chat error:', error);
          toast.error('Failed to connect to Warm AI backend');
          // Remove failed message? Or show error state?
          const currentMessages = useChatStore.getState().currentSessionMessages;
          setMessages(currentMessages.filter((m) => m.id !== assistantId));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [chatMode, currentSessionId]
  );

  const handleSearchSubmit = useCallback(
    async (query: string) => {
      setIsLoading(true);
      try {
        if (mode === 'people') {
          console.log('Searching for people:', query);
          const response = await searchPeople(query);
          console.log('People results:', response);
          setPeopleResults(response.results);
        } else if (mode === 'companies') {
          console.log('Searching for companies:', query);
          const response = await searchCompanies(query);
          console.log('Company results:', response);
          setCompanyResults(response.results);
        }
        toast.success('Search completed!');
      } catch (error) {
        console.error('Search error:', error);
        toast.error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    },
    [mode]
  );

  const handleSubmit = useCallback(
    (input: string) => {
      if (mode === 'chat') {
        handleChatSubmit(input);
      } else {
        handleSearchSubmit(input);
      }
    },
    [mode, handleChatSubmit, handleSearchSubmit]
  );

  const handleSuggestionSelect = (query: string) => {
    handleSubmit(query);
  };

  const hasContent =
    messages.length > 0 ||
    peopleResults.length > 0 ||
    companyResults.length > 0 ||
    isLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Toaster position="top-center" />
      <ModeSelector
        open={isSelectorOpen}
        onOpenChange={setIsSelectorOpen}
        onSelect={handleModeSelect}
      />

      {/* Fixed Navigation Controls */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-4">
        <HistorySidebar>
          <button className="p-2.5 rounded-xl bg-white/50 shadow-sm border border-black/[0.03] hover:shadow-md hover:bg-white transition-all duration-300 group ring-1 ring-black/[0.01] backdrop-blur-xl">
            <Menu className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground" />
          </button>
        </HistorySidebar>

        <button
          onClick={() => {
            createNewSession();
            setPeopleResults([]);
            setCompanyResults([]);
            toast.success('Started a fresh session');
          }}
          className="flex items-center gap-2.5 hover:opacity-80 transition-all duration-300 cursor-pointer group"
        >
          <WarmLogo className="w-10 h-10 text-foreground group-hover:scale-105 transition-all duration-300" />
          <div className="flex flex-col items-start -space-y-1">
            <span className="text-xl font-serif italic text-foreground tracking-tight">warm</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 pl-0.5">AI</span>
          </div>
        </button>
      </div>

      {/* Main content area */}
      <main className="flex-1 flex flex-col">
        {/* Landing state - centered layout */}
        {!hasContent && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 animate-in fade-in duration-700">
            {/* Hero text - positioned above input, nudged up slightly */}
            <div className="text-center mb-8 -translate-y-12">
              <h1 className="text-6xl md:text-8xl font-serif text-foreground mb-6 tracking-tight leading-[1.1]">
                Network with AI
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Find people and companies on LinkedIn using natural language. Let Warm do the searching.
              </p>
            </div>

            {/* Centered Input */}
            <div className="w-full max-w-3xl mx-auto">
              <OmniInput
                mode={mode}
                chatMode={chatMode}
                onOpenSelector={() => setIsSelectorOpen(true)}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                onStop={handleStop}
              />
              <div className="mt-8 flex justify-center">
                <SuggestedQueries mode={mode} onSelect={handleSuggestionSelect} />
              </div>
            </div>
          </div>
        )}

        {/* Active state - content with fixed bottom input */}
        {hasContent && (
          <>
            {/* Scrollable results area */}
            <div className="flex-1 pt-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-full max-w-5xl mx-auto">
                {/* Chat messages */}
                {mode === 'chat' && (
                  <div className="max-w-3xl mx-auto space-y-8 pb-40">
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                  </div>
                )}

                {/* People search results */}
                {mode === 'people' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-40">
                    {isLoading && peopleResults.length === 0
                      ? Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} type="person" />
                      ))
                      : peopleResults.map((person, i) => (
                        <PersonCard key={i} person={person} />
                      ))}
                  </div>
                )}

                {/* Company search results */}
                {mode === 'companies' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-40">
                    {isLoading && companyResults.length === 0
                      ? Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} type="company" />
                      ))
                      : companyResults.map((company, i) => (
                        <CompanyCard key={i} company={company} />
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fixed bottom input */}
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background via-background to-transparent z-40 animate-in slide-in-from-bottom-4 duration-500">
              <OmniInput
                mode={mode}
                chatMode={chatMode}
                onOpenSelector={() => setIsSelectorOpen(true)}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                onStop={handleStop}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

