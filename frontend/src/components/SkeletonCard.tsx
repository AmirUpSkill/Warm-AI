import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  type: 'person' | 'company';
  className?: string;
}

export function SkeletonCard({ type, className }: SkeletonCardProps) {
  return (
    <div className={cn('glass-surface rounded-xl p-4', className)}>
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            'shimmer',
            type === 'person' ? 'w-12 h-12 rounded-full' : 'w-12 h-12 rounded-xl'
          )}
        />
        <div className="flex-1 space-y-2">
          <div className="shimmer h-4 w-3/4 rounded" />
          <div className="shimmer h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="shimmer h-3 w-full rounded" />
        <div className="shimmer h-3 w-2/3 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="shimmer h-6 w-16 rounded" />
        <div className="shimmer h-6 w-16 rounded" />
        <div className="shimmer h-6 w-16 rounded" />
      </div>
    </div>
  );
}
