import { X, FileText, Quote, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type FileSearchCitation } from '@/lib/api';

interface FileCitationPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    citation: FileSearchCitation | null;
}

export function FileCitationPreview({
    isOpen,
    onClose,
    citation
}: FileCitationPreviewProps) {
    if (!isOpen || !citation) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Content */}
            <div className="relative w-full max-w-2xl bg-[#fcfaf7] rounded-[2.5rem] shadow-2xl border border-black/[0.05] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-400">
                {/* Header */}
                <div className="px-8 py-6 border-b border-black/[0.03] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground tracking-tight">Source Context</h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-60">
                                {citation.source_title}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-black/5 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[60vh] overflow-y-auto font-sans leading-relaxed">
                    <div className="flex gap-4 items-start text-muted-foreground mb-4">
                        <Quote className="w-8 h-8 opacity-10 flex-shrink-0 rotate-180" />
                        <p className="text-xs uppercase tracking-widest font-bold opacity-40 pt-3">Exerpt from document</p>
                    </div>

                    <div className="relative group">
                        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-foreground/10 rounded-full" />
                        <p className="text-lg text-foreground/90 whitespace-pre-wrap pl-2">
                            <span className="bg-yellow-100/80 px-1 rounded shadow-[0_0_10px_rgba(254,240,138,0.5)] border-b-2 border-yellow-200">
                                {citation.text_segment}
                            </span>
                        </p>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground text-background font-medium hover:opacity-90 transition-all shadow-md group"
                        >
                            <span>Back to Chat</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
