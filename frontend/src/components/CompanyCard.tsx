import { type CompanyCard as CompanyCardType } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, ExternalLink, MessageSquarePlus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyCardProps {
  company: CompanyCardType;
  className?: string;
}

export function CompanyCard({ company, className }: CompanyCardProps) {
  return (
    <Card className={cn(
      "group relative overflow-hidden bg-[#fcfaf7] border-black/[0.03] shadow-soft hover:shadow-lg transition-all duration-500 rounded-3xl p-6",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Badge variant="secondary" className="mb-4 bg-accent-emerald/5 text-accent-emerald border-none px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold">
            Company
          </Badge>
          <h3 className="text-2xl font-serif text-foreground mb-1 group-hover:text-accent-emerald transition-colors duration-300">
            {company.name}
          </h3>
          <p className="text-sm font-medium text-muted-foreground mb-4 leading-relaxed line-clamp-3">
            {company.description}
          </p>
        </div>

        {company.logo_url ? (
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-sm border border-black/[0.05] bg-white p-2">
            <img
              src={company.logo_url}
              alt={company.name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center border border-black/[0.05]">
            <Building2 className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <div className="space-y-3 mt-4">
        {company.industry && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="w-3.5 h-3.5 text-accent-emerald/60" />
            <span className="font-medium line-clamp-1">{company.industry}</span>
          </div>
        )}
        {company.location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground/40" />
            <span>{company.location}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-8 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
        <a
          href={company.website_url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-foreground text-background py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Website
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
