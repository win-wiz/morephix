import { memo } from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  tag?: string;
  title: React.ReactNode;
  className?: string;
}

export const SectionHeader = memo(function SectionHeader({ 
  tag, 
  title,
  className
}: SectionHeaderProps) {
  return (
    <div className={cn("text-center mb-12", className)}>
      {tag && (
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
          {tag}
        </div>
      )}
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
    </div>
  );
});
