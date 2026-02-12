import { useRef, useState } from 'react';
import { Upload, X, FileText, Loader2, Plus } from 'lucide-react';
import { AgentContext } from '@/types/agent';

interface ContextFileUploadProps {
    contexts: AgentContext[];
    onUpload: (file: File) => Promise<void>;
    onRemove: (contextId: number) => Promise<void>;
}

export function ContextFileUpload({ contexts, onUpload, onRemove }: ContextFileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await onUpload(file);
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {contexts.map((ctx) => (
                    <div
                        key={ctx.id}
                        className="flex items-center gap-2 bg-secondary/50 border border-black/5 rounded-lg px-3 py-2 group"
                    >
                        <FileText className="h-4 w-4 text-muted-foreground/40" />
                        <span className="text-sm text-foreground/80 max-w-[150px] truncate">{ctx.file_name}</span>
                        <button
                            type="button"
                            onClick={() => onRemove(ctx.id)}
                            className="p-1 hover:bg-black/5 rounded-md transition-colors"
                        >
                            <X className="h-3 w-3 text-muted-foreground/40 hover:text-red-500" />
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-primary/5 border border-primary/10 hover:bg-primary/10 rounded-lg px-4 py-2 transition-all group disabled:opacity-50"
                >
                    {isUploading ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                        <Plus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    )}
                    <span className="text-sm font-medium text-primary">Add Context File (PDF, TXT)</span>
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.txt,.md,.docx"
                onChange={handleFileChange}
            />

            <p className="text-xs text-muted-foreground/60 italic font-medium">
                These files will be indexed and used by the agent as RAG context (Gemini File Search).
            </p>
        </div>
    );
}
