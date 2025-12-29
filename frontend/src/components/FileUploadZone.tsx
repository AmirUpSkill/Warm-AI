import { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
    onFileSelect: (file: File) => void;
    isUploading: boolean;
    uploadedFileName?: string;
    error?: string | null;
    onClear: () => void;
}

export function FileUploadZone({
    onFileSelect,
    isUploading,
    uploadedFileName,
    error,
    onClear
}: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onFileSelect(files[0]);
        }
    }, [onFileSelect]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileSelect(files[0]);
        }
    }, [onFileSelect]);

    if (uploadedFileName) {
        return (
            <div className="w-full max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white/50 backdrop-blur-xl border border-green-100 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground tracking-tight">File Ready</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <File className="w-3.5 h-3.5" />
                                {uploadedFileName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClear}
                        className="p-2 hover:bg-black/5 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative group cursor-pointer transition-all duration-300",
                    "border-2 border-dashed rounded-[2.5rem] p-12 text-center",
                    isDragging
                        ? "border-foreground bg-foreground/5 scale-[1.01]"
                        : "border-black/[0.08] bg-[#fcfaf7] hover:border-black/20 hover:bg-[#f8f5f0]",
                    isUploading && "pointer-events-none opacity-70"
                )}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".pdf,.txt,.docx,.html,.md"
                    disabled={isUploading}
                />

                <div className="flex flex-col items-center gap-4">
                    <div className={cn(
                        "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-sm",
                        isDragging ? "bg-foreground text-background scale-110" : "bg-white text-foreground/40"
                    )}>
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                            <Upload className="w-8 h-8" />
                        )}
                    </div>

                    <div>
                        <h3 className="text-xl font-serif italic text-foreground mb-1">
                            {isUploading ? "Indexing Document..." : "Upload your Document"}
                        </h3>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
                            {isUploading
                                ? "This takes a few seconds to process and embed."
                                : "Drag & drop or click to upload PDF, TXT, or DOCX (Max 100MB)"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
