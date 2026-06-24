import Link from 'next/link';
import { SITE } from '@/lib/shared/tools';
import { ToolsNav } from './header-nav/tools-nav';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-20 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center transition-opacity">
            {/* The Monogram 'M' (Acts as the Icon/Favicon) */}
            <div className="relative flex items-center justify-center mr-1">
              <svg 
                viewBox="0 0 24 24" 
                className="w-7 h-7 transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)] group-hover:scale-105"
              >
                {/* Left Pillar */}
                <rect 
                  x="5" y="4" width="3.5" height="16" rx="1.5" 
                  className="fill-foreground transition-all duration-500 group-hover:-translate-y-1" 
                />
                {/* Right Pillar */}
                <rect 
                  x="15.5" y="4" width="3.5" height="16" rx="1.5" 
                  className="fill-foreground transition-all duration-500 group-hover:translate-y-1" 
                />
                {/* Center Morphing Diamond (Gradient AI/Magic) */}
                <defs>
                  <linearGradient id="magicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" /> {/* Indigo-400 */}
                    <stop offset="100%" stopColor="#4f46e5" /> {/* Indigo-600 */}
                  </linearGradient>
                </defs>
                <rect 
                  x="9" y="5.5" width="6" height="6" rx="1.5" 
                  fill="url(#magicGradient)"
                  className="origin-[12px_8.5px] rotate-45 transition-all duration-500 group-hover:rotate-[135deg] group-hover:scale-110 shadow-sm" 
                />
              </svg>
            </div>
            
            {/* Typographic Wordmark with Strong Variations & Brand Accent */}
            <div className="flex items-baseline text-[1.45rem] leading-none select-none ml-1 mt-[2px] group">
              <span 
                className="font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-indigo-600/80 transition-all duration-500" 
                style={{ letterSpacing: '-0.04em' }}
              >
                More
              </span>
              <span className="font-light italic text-muted-foreground tracking-tight ml-[1px] transition-colors duration-500 group-hover:text-foreground">
                phi
              </span>
              <span className="font-light italic text-indigo-600 dark:text-indigo-500 tracking-tight transition-all duration-500 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]">
                x
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <ToolsNav />
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <ThemeToggle />
          {/* <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a> */}
        </div>
      </div>
    </header>
  );
}
