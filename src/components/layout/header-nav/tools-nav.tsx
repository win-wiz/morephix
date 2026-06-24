'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { TOOLS, TOOL_CATEGORIES } from '@/lib/shared/tools';

export function ToolsNav() {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback((categoryId: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenCategory(categoryId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setOpenCategory(null);
    }, 150);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const toolsByCategory = TOOL_CATEGORIES.map(category => ({
    ...category,
    items: TOOLS.filter(tool => tool.category === category.id)
  }));

  return (
    <div className="flex items-center gap-6">
      {toolsByCategory.map((category) => (
        <DropdownMenu 
          key={category.id} 
          open={openCategory === category.id} 
          onOpenChange={(open) => {
            if (!open) {
              setOpenCategory(null);
            } else {
              setOpenCategory(category.id);
            }
          }}
        >
          <DropdownMenuTrigger
            className={`inline-flex items-center gap-1 transition-colors outline-none cursor-default font-medium ${openCategory === category.id ? 'text-foreground' : 'hover:text-foreground'}`}
            onMouseEnter={() => handleMouseEnter(category.id)}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          >
            {category.label}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openCategory === category.id ? 'rotate-180 opacity-100' : 'opacity-50'}`} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[320px] p-4"
            onMouseEnter={() => handleMouseEnter(category.id)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex flex-col gap-1.5">
              {category.items.map((tool) => {
                const isAvailable = tool.status === 'available';
                return (
                  <DropdownMenuItem
                    key={tool.href}
                    disabled={!isAvailable}
                    render={isAvailable ? <Link href={tool.href} /> : undefined}
                    className="group flex flex-col items-start p-3 outline-none transition-colors hover:bg-accent focus:bg-accent rounded-xl cursor-default"
                  >
                    <div className="flex w-full items-center justify-between mb-1.5">
                      <span
                        className={`text-sm font-semibold tracking-tight ${isAvailable ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        {tool.title}
                      </span>
                      <div className="flex items-center gap-2">
                        {tool.isNew && (
                          <span className="rounded-full bg-foreground text-background px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                            New
                          </span>
                        )}
                        {isAvailable ? (
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
                        ) : (
                          <span className="rounded-full bg-secondary border border-border/50 px-2 py-0.5 text-[9px] font-bold text-secondary-foreground uppercase tracking-wider">
                            Soon
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground leading-relaxed opacity-80 whitespace-normal">
                      {tool.description}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
}
