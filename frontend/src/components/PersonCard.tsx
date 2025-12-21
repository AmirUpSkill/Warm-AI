import { type PersonCard as PersonCardType } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, ExternalLink, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PersonCardProps {
  person: PersonCardType;
  className?: string;
}

export function PersonCard({ person, className }: PersonCardProps) {
  return (
    <Card className={cn(
      "group relative overflow-hidden bg-[#fcfaf7] border-black/[0.03] shadow-soft hover:shadow-lg transition-all duration-500 rounded-3xl p-6",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Badge variant="secondary" className="mb-4 bg-accent-blue/5 text-accent-blue border-none px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold">
            Person
          </Badge>
          <h3 className="text-2xl font-serif text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
            {person.name}
          </h3>
          <p className="text-sm font-medium text-muted-foreground mb-4 leading-relaxed line-clamp-2">
            {person.headline}
          </p>
        </div>

        {person.image_url && (
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-black/[0.05]">
            <img
              src={person.image_url}
              alt={person.name}
              className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        )}
      </div>

      <div className="space-y-3 mt-4">
        {person.company && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Briefcase className="w-3.5 h-3.5 text-accent-blue/60" />
            <span className="font-medium">{person.company}</span>
          </div>
        )}
        {person.location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground/40" />
            <span>{person.location}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-8 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
        <a
          href={person.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-foreground text-background py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
        >
          View Profile
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button
          title="Add to Chat"
          className="p-2.5 rounded-xl border border-black/[0.05] hover:bg-secondary transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
