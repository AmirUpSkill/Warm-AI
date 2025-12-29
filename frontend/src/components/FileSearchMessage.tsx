import { FileType, ExternalLink, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type FileSearchCitation } from '@/lib/api';

interface FileSearchMessageProps {
    content: string;
    fileCitations?: FileSearchCitation[];
    onCitationClick: (citation: FileSearchCitation) => void;
    isStreaming?: boolean;
}

export function FileSearchMessage({
    content,
    fileCitations,
    onCitationClick,
    isStreaming
}: FileSearchMessageProps) {
    // Simple heuristic to detect if content has citations that might be mapped
    // Gemini often returns text like [1], [2] or names. 
    // For simplicity, we show the citations as clear buttons at the bottom for now.

    return (
        <div className="flex flex-col gap-4">
            <div className="text-foreground leading-relaxed font-sans whitespace-pre-wrap">
                {content}
                {isStreaming && (
                    <span className="inline-block w-1.5 h-4 bg-foreground/20 animate-pulse ml-1 rounded-full align-middle" />
                )}
            </div>

            {fileCitations && fileCitations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {fileCitations.map((citation, idx) => (
                        <button
                            key={idx}
                            onClick={() => onCitationClick(citation)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200",
                                "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground",
                                "border border-black/[0.03] shadow-sm hover:shadow"
                            )}
                        >
                            <FileType className="w-3.5 h-3.5" />
                            <span>{citation.source_title}</span>
                            <ExternalLink className="w-3 h-3 opacity-40" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
