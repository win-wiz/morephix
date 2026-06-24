import type { Metadata } from 'next';
import { constructSEO } from '@/lib/shared/seo';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { HeroSection, FeatureCards, AboutArticle, ConverterSection, FaqSection } from './_components';

export const metadata: Metadata = constructSEO({
  title: 'SVG to PNG',
  description: 'Free, privacy-first SVG to PNG converter. Runs locally in browser with no server uploads. Supports custom dimensions, DPI, and transparent backgrounds.',
  keywords: ['svg to png', 'svg converter', 'vector to bitmap', 'batch convert svg'],
  path: '/svg-to-png',
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'SVG to PNG Converter',
  description: 'Free, privacy-first SVG to PNG converter. Runs locally in browser with no server uploads.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function SvgToPngPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="relative flex-1 overflow-hidden selection:bg-primary selection:text-primary-foreground">
        {/* Subtle background for the hero section */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </div>

        {/* Minimalist ambient glow with primary color injection */}
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 h-[400px] w-[800px] opacity-40 dark:opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent dark:from-primary/30 dark:via-primary/10 blur-3xl rounded-full"></div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <HeroSection />
          <ConverterSection />
          <FeatureCards />
          <AboutArticle />

          <FaqSection />
        </div>
      </main>
      <Footer />
    </>
  );
}
