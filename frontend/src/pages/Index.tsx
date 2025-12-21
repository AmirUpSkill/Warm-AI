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
import { Command } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
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
    setPeopleResults([]);
    setCompanyResults([]);
  };

  const handleChatSubmit = useCallback(
    async (input: string) => {
      if (!input.trim()) return;

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: input,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const assistantId = generateId();
      let assistantContent = '';
      let assistantCitations: Citation[] = [];

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', isStreaming: true },
      ]);

      abortControllerRef.current = new AbortController();

      try {
        await streamChat(
          { message: input, mode: chatMode },
          (event) => {
            if (event.type === 'token' && event.content) {
              assistantContent += event.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            } else if (event.type === 'citation' && event.sources) {
              assistantCitations = event.sources;
            } else if (event.type === 'done') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, isStreaming: false, citations: assistantCitations }
                    : m
                )
              );
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
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [chatMode]
  );

  const handleSearchSubmit = useCallback(
    async (query: string) => {
      setIsLoading(true);
      try {
        if (mode === 'people') {
          const response = await searchPeople(query);
          setPeopleResults(response.results);
        } else if (mode === 'companies') {
          const response = await searchCompanies(query);
          setCompanyResults(response.results);
        }
      } catch (error) {
        toast.error('Search failed. Check if the backend is running.');
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

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 pointer-events-none">
        <button
          onClick={() => {
            setMessages([]);
            setPeopleResults([]);
            setCompanyResults([]);
          }}
          className="flex items-center gap-2.5 pointer-events-auto hover:opacity-80 transition-opacity cursor-pointer group"
        >
          <div className="p-1.5 rounded-xl bg-[#fcfaf7] shadow-sm border border-black/[0.03] group-hover:shadow-md transition-all duration-300">
            <WarmLogo className="w-9 h-9 text-foreground" />
          </div>
          <span className="text-xl font-medium tracking-tight font-serif italic">warm</span>
        </button>

        <nav className="flex items-center gap-6 pointer-events-auto">
          <button
            onClick={() => setIsSelectorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            <Command className="w-3 h-3" />
            <span className="opacity-60">Commands</span>
            <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white text-[10px] font-bold border border-black/[0.05] shadow-sm">K</kbd>
          </button>
        </nav>
      </header>

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
            <div className="flex-1 pt-24 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

