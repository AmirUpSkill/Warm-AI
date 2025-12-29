import { useState, useRef, useCallback, useEffect } from 'react';
import { OmniInput, type InputMode, type ChatMode } from '@/components/OmniInput';
import { ChatMessage, type Message, type Citation } from '@/components/ChatMessage';
import { PersonCard } from '@/components/PersonCard';
import { CompanyCard } from '@/components/CompanyCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { SuggestedQueries } from '@/components/SuggestedQueries';
import { ModeSelector, type ModeOption } from '@/components/ModeSelector';
import { Command, Menu, FileText, X, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/store/use-chat-store';
import { Sidebar } from '@/components/Sidebar';
import { AppHeader } from '@/components/AppHeader';
import { FileUploadZone } from '@/components/FileUploadZone';
import { FileSearchMessage } from '@/components/FileSearchMessage';
import { FileCitationPreview } from '@/components/FileCitationPreview';
import {
  streamChat,
  searchPeople,
  searchCompanies,
  uploadFileForSearch,
  type PersonCard as PersonCardType,
  type CompanyCard as CompanyCardType,
  type FileSearchCitation
} from '@/lib/api';

export default function Index() {
  const [mode, setMode] = useState<InputMode>('chat');
  const [chatMode, setChatMode] = useState<ChatMode>('standard');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // File Search State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    sessionId: number;
    fileName: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<FileSearchCitation | null>(null);
  const [isCitationPreviewOpen, setIsCitationPreviewOpen] = useState(false);

  // Store integration
  const {
    currentSessionMessages: messages,
    setMessages,
    addMessage,
    currentSessionId,
    currentSessionMeta,
    createNewSession,
    setCurrentSessionId,
    setCurrentSessionMeta,
    fetchSessions,
    isSidebarOpen
  } = useChatStore();

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
    setMode(option.mode as InputMode);
    if (option.chatMode) {
      setChatMode(option.chatMode);
    } else if (option.mode === 'file_search') {
      setChatMode('file_search');
    }

    // Reset states
    setPeopleResults([]);
    setCompanyResults([]);
    setMessages([]);
    setUploadedFile(null);
    setUploadError(null);
    setCurrentSessionMeta(null);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await uploadFileForSearch(file);
      setCurrentSessionId(result.session_id);
      setCurrentSessionMeta({
        id: result.session_id,
        title: `File: ${result.file_name}`,
        mode: 'file_search',
        file_name: result.file_name,
        file_search_store_name: result.store_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setUploadedFile({
        sessionId: result.session_id,
        fileName: result.file_name
      });
      fetchSessions();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const clearFileUpload = () => {
    setUploadedFile(null);
    setMessages([]);
    setUploadError(null);
  };

  const handleChatSubmit = useCallback(
    async (input: string) => {
      if (!input.trim()) return;

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: input,
      };

      addMessage(userMessage);
      setIsLoading(true);

      const assistantId = generateId();
      let assistantContent = '';
      let fileCitations: FileSearchCitation[] = [];

      addMessage({ id: assistantId, role: 'assistant', content: '', isStreaming: true });

      abortControllerRef.current = new AbortController();

      try {
        await streamChat(
          {
            message: input,
            mode: chatMode,
            conversation_id: currentSessionId || undefined
          },
          (event) => {
            if (event.type === 'session_created' && event.session_id) {
              setCurrentSessionId(event.session_id);
              fetchSessions();
            } else if (event.type === 'token' && event.content) {
              assistantContent += event.content;
              const updated = useChatStore.getState().currentSessionMessages.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              );
              setMessages(updated);
            } else if (event.type === 'file_citation' && event.content) {
              try {
                fileCitations = JSON.parse(event.content);
              } catch (e) {
                console.error('Failed to parse file citations:', e);
              }
            } else if (event.type === 'done') {
              const updated = useChatStore.getState().currentSessionMessages.map((m) =>
                m.id === assistantId ? {
                  ...m,
                  isStreaming: false,
                  file_citations: fileCitations
                } : m
              );
              setMessages(updated);
              setIsLoading(false);
            } else if (event.type === 'error') {
              setIsLoading(false);
            }
          },
          abortControllerRef.current.signal
        );
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Chat error:', error);
          const currentMessages = useChatStore.getState().currentSessionMessages;
          setMessages(currentMessages.filter((m) => m.id !== assistantId));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [chatMode, currentSessionId, addMessage, setCurrentSessionId, fetchSessions, setMessages]
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
      } finally {
        setIsLoading(false);
      }
    },
    [mode]
  );

  const handleSubmit = useCallback(
    (input: string) => {
      if (mode === 'chat' || mode === 'file_search') {
        handleChatSubmit(input);
      } else {
        handleSearchSubmit(input);
      }
    },
    [mode, handleChatSubmit, handleSearchSubmit]
  );

  useEffect(() => {
    if (!currentSessionMeta) return;

    if (currentSessionMeta.mode === 'file_search') {
      setMode('file_search');
      setChatMode('file_search');
      setUploadedFile({
        sessionId: currentSessionMeta.id,
        fileName: currentSessionMeta.file_name || 'Uploaded Document'
      });
    } else if (mode === 'file_search' && currentSessionMeta.mode !== 'file_search') {
      setMode('chat');
      setChatMode('standard');
      setUploadedFile(null);
    }
  }, [currentSessionMeta, mode]);

  const handleCitationClick = (citation: FileSearchCitation) => {
    setSelectedCitation(citation);
    setIsCitationPreviewOpen(true);
  };

  const hasContent =
    messages.length > 0 ||
    peopleResults.length > 0 ||
    companyResults.length > 0 ||
    isLoading ||
    (mode === 'file_search' && uploadedFile);

  return (
    <div className="min-h-screen bg-background flex font-sans overflow-hidden">

      <Sidebar />

      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 relative",
        isSidebarOpen ? "ml-0" : "ml-0" // Sidebar is fixed/absolute on mobile, but here we can just use flex
      )}>
        <AppHeader />

        <ModeSelector
          open={isSelectorOpen}
          onOpenChange={setIsSelectorOpen}
          onSelect={handleModeSelect}
        />

        <FileCitationPreview
          isOpen={isCitationPreviewOpen}
          onClose={() => setIsCitationPreviewOpen(false)}
          citation={selectedCitation}
        />

        {/* Old header removed */}

        <main className="flex-1 flex flex-col">
          {!hasContent && (
            <div className="flex-1 flex flex-col items-center justify-center px-4 animate-in fade-in duration-700">
              <div className="text-center mb-8 -translate-y-12">
                <h1 className="text-6xl md:text-8xl font-serif text-foreground mb-6 tracking-tight leading-[1.1]">
                  {mode === 'file_search' ? 'Knowledge Search' : 'Network with AI'}
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                  {mode === 'file_search'
                    ? 'Upload a document and ask personal AI anything about its contents.'
                    : 'Find people and companies on LinkedIn using natural language. Let Warm do the searching.'}
                </p>
              </div>

              {mode === 'file_search' && !uploadedFile && (
                <FileUploadZone
                  onFileSelect={handleFileUpload}
                  isUploading={isUploading}
                  error={uploadError}
                  onClear={clearFileUpload}
                />
              )}

              {(mode !== 'file_search' || uploadedFile) && (
                <div className="w-full max-w-3xl mx-auto">
                  <OmniInput
                    mode={mode}
                    chatMode={chatMode}
                    onOpenSelector={() => setIsSelectorOpen(true)}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    onStop={handleStop}
                    isFileInputDisabled={mode === 'file_search' && !uploadedFile}
                  />
                  <div className="mt-8 flex justify-center">
                    <SuggestedQueries mode={mode} onSelect={(q) => handleSubmit(q)} />
                  </div>
                </div>
              )}
            </div>
          )}

          {hasContent && (
            <>
              <div className="flex-1 pt-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-full max-w-5xl mx-auto">

                  {mode === 'file_search' && !uploadedFile && !isLoading && messages.length === 0 && (
                    <div className="max-w-3xl mx-auto mt-20">
                      <FileUploadZone
                        onFileSelect={handleFileUpload}
                        isUploading={isUploading}
                        error={uploadError}
                        onClear={clearFileUpload}
                      />
                    </div>
                  )}

                  {(mode === 'chat' || mode === 'file_search') && (
                    <div className="max-w-3xl mx-auto space-y-8 pb-40">
                      {messages.map((message) => (
                        message.role === 'assistant' && mode === 'file_search' ? (
                          <div key={message.id} className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-2xl bg-foreground flex items-center justify-center flex-shrink-0">
                              <Flame className="w-6 h-6 text-background" />
                            </div>
                            <FileSearchMessage
                              content={message.content}
                              fileCitations={message.file_citations}
                              onCitationClick={handleCitationClick}
                              isStreaming={message.isStreaming}
                            />
                          </div>
                        ) : (
                          <ChatMessage key={message.id} message={message} />
                        )
                      ))}
                    </div>
                  )}

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

              <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-background via-background to-transparent z-40 animate-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-3xl mx-auto">
                  {uploadedFile && mode === 'file_search' && (
                    <div className="mb-4 flex justify-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-black/[0.03] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <FileText className="w-4 h-4 text-foreground/50" />
                        <span className="text-sm font-medium text-foreground">{uploadedFile.fileName}</span>
                        <button
                          onClick={clearFileUpload}
                          className="p-1 hover:bg-black/5 rounded-lg transition-colors ml-1"
                        >
                          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                    </div>
                  )}

                  <OmniInput
                    mode={mode}
                    chatMode={chatMode}
                    onOpenSelector={() => setIsSelectorOpen(true)}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    onStop={handleStop}
                    isFileInputDisabled={mode === 'file_search' && !uploadedFile}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
