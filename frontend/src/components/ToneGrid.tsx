import { TonePreset } from '@/types/agent';
import { Check } from 'lucide-react';

interface ToneGridProps {
    presets: TonePreset[];
    selectedTone: string;
    onSelect: (toneId: string) => void;
}

export function ToneGrid({ presets, selectedTone, onSelect }: ToneGridProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {presets.map((preset) => (
                <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelect(preset.id)}
                    className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all ${selectedTone === preset.id
                        ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/50'
                        : 'bg-secondary/50 border-black/5 hover:border-black/10 hover:bg-secondary'
                        }`}
                >
                    <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-sm font-medium ${selectedTone === preset.id ? 'text-primary' : 'text-foreground'}`}>
                            {preset.name}
                        </span>
                        {selectedTone === preset.id && (
                            <Check className="h-4 w-4 text-primary" />
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed">
                        {preset.description}
                    </p>
                </button>
            ))}
        </div>
    );
}
