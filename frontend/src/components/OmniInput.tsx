import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare, Users, Building2, ArrowUp, Square, Sparkles, Globe, ChevronDown, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InputMode = 'chat' | 'people' | 'companies' | 'file_search';
export type ChatMode = 'standard' | 'web_search' | 'file_search';

interface OmniInputProps {
  mode: InputMode;
  chatMode: ChatMode;
  onOpenSelector: () => void;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  onStop?: () => void;
  isFileInputDisabled?: boolean;
}

const placeholders: Record<InputMode, string> = {
  chat: 'Ask anything about LinkedIn networking...',
  people: 'Find professionals...',
  companies: 'Search companies...',
  file_search: 'Ask anything about your uploaded document...',
};

const modeIcons = {
  chat: MessageSquare,
  people: Users,
  companies: Building2,
  file_search: FileText,
};

const chatModeIcons = {
  standard: MessageSquare,
  web_search: Globe,
  file_search: FileText,
};

export function OmniInput({
  mode,
  chatMode,
  onOpenSelector,
  onSubmit,
  isLoading = false,
  onStop,
  isFileInputDisabled = false,
}: OmniInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (value.trim() && !isLoading && !isFileInputDisabled) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentModeIcon = useMemo(() => {
    if (mode === 'chat') {
      const Icon = chatModeIcons[chatMode as keyof typeof chatModeIcons] || MessageSquare;
      return <Icon className="w-4 h-4 text-foreground/70" />;
    }
    const Icon = modeIcons[mode as keyof typeof modeIcons] || MessageSquare;
    return <Icon className="w-4 h-4 text-foreground/70" />;
  }, [mode, chatMode]);

  const currentModeLabel = useMemo(() => {
    if (mode === 'chat') {
      return chatMode === 'web_search' ? 'Web Search' : 'Chat';
    }
    if (mode === 'file_search') return 'File Search';
    return mode === 'people' ? 'People' : 'Companies';
  }, [mode, chatMode]);

  const isDisabled = isLoading || (mode === 'file_search' && isFileInputDisabled);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className={cn(
        "bg-[#fcfaf7] rounded-3xl p-2 shadow-soft border border-black/[0.03] transition-all duration-300",
        isDisabled && "opacity-60 grayscale-[0.5]"
      )}>
        <div className="flex flex-col">
          {/* Text input */}
          <div className="px-5 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholders[mode] || placeholders.chat}
              rows={1}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none text-lg leading-relaxed font-sans"
              disabled={isDisabled}
            />
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-2 pb-1 pt-1">
            <button
              onClick={onOpenSelector}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/80 hover:bg-secondary text-sm font-medium transition-all group"
            >
              <div className="flex items-center justify-center p-1 rounded-lg bg-[#fcfaf7] shadow-sm ring-1 ring-black/[0.05]">
                {currentModeIcon}
              </div>
              <span className="text-foreground/80 group-hover:text-foreground">{currentModeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <button
              onClick={isLoading ? onStop : handleSubmit}
              disabled={(!value.trim() && !isLoading) || (mode === 'file_search' && isFileInputDisabled)}
              className={cn(
                'p-3 rounded-2xl transition-all duration-200 transform active:scale-95',
                isLoading
                  ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                  : (value.trim() && !isFileInputDisabled)
                    ? 'bg-foreground text-background hover:opacity-90 shadow-md'
                    : 'bg-secondary text-muted-foreground opacity-30 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Square className="w-5 h-5 fill-current" />
              ) : (
                <ArrowUp className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
