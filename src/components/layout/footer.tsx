import Link from 'next/link';
import { SITE, TOOLS } from '@/lib/shared/tools';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-border/40 bg-muted/20 py-12">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-12 text-sm text-muted-foreground">
          <div className="space-y-4 max-w-sm">
            <h3 className="text-foreground font-semibold tracking-tight">{SITE.name}</h3>
            <p className="text-xs leading-relaxed">{SITE.tagline}</p>
          </div>
          
          <div className="flex gap-16 md:gap-24">
            <div className="space-y-4">
              <h3 className="text-foreground font-semibold tracking-tight">Tools</h3>
              <ul className="space-y-2.5">
                {TOOLS.filter((t) => t.status === 'available').map((tool) => (
                  <li key={tool.href}>
                    <Link href={tool.href} className="hover:text-foreground transition-colors inline-block text-xs">
                      {tool.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-foreground font-semibold tracking-tight">Links</h3>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href={SITE.wordless}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors inline-block text-xs"
                  >
                    Wordless
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-border/40 pt-6 text-xs text-muted-foreground">
          <p>
            © {year} {SITE.name}. All rights reserved.
          </p>
          <p className="mt-2 sm:mt-0">Privacy-first online image converter</p>
        </div>
      </div>
    </footer>
  );
}
