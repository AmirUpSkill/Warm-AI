import type { InputMode } from './OmniInput';

interface SuggestedQueriesProps {
  mode: InputMode;
  onSelect: (query: string) => void;
}

const suggestions: Record<InputMode, string[]> = {
  chat: [
    'How do I optimize my LinkedIn profile?',
    'Best practices for LinkedIn outreach',
  ],
  people: [
    'AI Engineers in Berlin',
    'Senior Product Managers at FAANG',
    'Founders of fintech startups in London',
  ],
  companies: [
    'Seed stage fintech startups',
    'YC-backed developer tools companies',
    'Enterprise SaaS in healthcare',
  ],
};

export function SuggestedQueries({ mode, onSelect }: SuggestedQueriesProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {suggestions[mode].map((query, i) => (
        <button
          key={i}
          onClick={() => onSelect(query)}
          className="px-3 py-1.5 rounded-full bg-card/50 hover:bg-card border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-all"
        >
          Try: "{query}"
        </button>
      ))}
    </div>
  );
}
