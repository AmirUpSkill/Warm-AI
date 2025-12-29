import { useState, useEffect, useRef } from 'react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { PersonCard } from '@/components/PersonCard';
import { CompanyCard } from '@/components/CompanyCard';
import { type PersonCard as PersonCardType, type CompanyCard as CompanyCardType, type FileSearchCitation } from '@/lib/api';

export interface Citation {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  file_citations?: FileSearchCitation[];
  isStreaming?: boolean;
  cards?: (PersonCardType | CompanyCardType)[];
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isCardsExpanded, setIsCardsExpanded] = useState(true);

  // Typewriter effect state
  const [displayedContent, setDisplayedContent] = useState('');
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Typewriter animation - reveals characters progressively for a ChatGPT-like effect
  useEffect(() => {
    // For user messages or non-streaming, show content immediately
    if (isUser || !message.isStreaming) {
      setDisplayedContent(message.content);
      return;
    }

    // Characters per frame (adjust for speed - higher = faster)
    const charsPerFrame = 3;
    // Minimum ms between updates (lower = smoother)
    const frameDelay = 16; // ~60fps

    const animate = (timestamp: number) => {
      if (timestamp - lastTimeRef.current >= frameDelay) {
        lastTimeRef.current = timestamp;

        setDisplayedContent((prev) => {
          if (prev.length < message.content.length) {
            // Reveal next batch of characters
            const nextLength = Math.min(prev.length + charsPerFrame, message.content.length);
            return message.content.slice(0, nextLength);
          }
          return prev;
        });
      }

      // Continue animation if there's more content to reveal
      if (displayedContent.length < message.content.length) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [message.content, message.isStreaming, isUser, displayedContent.length]);

  // When streaming ends, ensure all content is displayed
  useEffect(() => {
    if (!message.isStreaming) {
      setDisplayedContent(message.content);
    }
  }, [message.isStreaming, message.content]);

  return (
    <div
      className={cn(
        'group flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] space-y-4',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-3xl px-6 py-4 shadow-chat transition-all duration-300',
            'bg-[#fcfaf7] border border-black/[0.03] text-foreground'
          )}
        >
          <div className="prose prose-sm font-sans text-[16px] leading-relaxed text-foreground max-w-none prose-p:leading-relaxed prose-pre:bg-secondary/50 prose-pre:rounded-xl">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayedContent}
            </ReactMarkdown>
            {message.isStreaming && <span className="typing-cursor" />}
          </div>

          {/* Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-black/[0.05]">
              <div className="flex flex-wrap gap-2">
                {message.citations.map((citation, i) => (
                  <a
                    key={i}
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/50 hover:bg-secondary text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${new URL(citation.url).hostname}&sz=32`}
                      alt=""
                      className="w-3.5 h-3.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"
                    />
                    <span className="truncate max-w-[150px]">
                      {citation.title || new URL(citation.url).hostname}
                    </span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-40" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Embedded Cards */}
        {message.cards && message.cards.length > 0 && (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                Related Results ({message.cards.length})
              </span>
              <button
                onClick={() => setIsCardsExpanded(!isCardsExpanded)}
                className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
              >
                {isCardsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isCardsExpanded && (
              <div className="grid grid-cols-1 gap-4 animate-in fade-in zoom-in-95 duration-300">
                {message.cards.map((card, i) => (
                  card.card_type === 'person' ? (
                    <PersonCard key={i} person={card} className="shadow-md" />
                  ) : (
                    <CompanyCard key={i} company={card} className="shadow-md" />
                  )
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
