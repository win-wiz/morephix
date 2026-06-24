'use client';

import dynamic from 'next/dynamic';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

// Lazy load the TypingAnimation component since it runs on the client
// and uses state/intervals that aren't needed for the initial static HTML
const TypingAnimation = dynamic(
  () => import('@/components/magicui/typing-animation').then(mod => mod.TypingAnimation),
  { 
    ssr: false,
    loading: () => (
      <h1 className="mb-6 text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 via-primary to-zinc-500 dark:from-white dark:via-primary/80 dark:to-zinc-400 md:text-7xl drop-shadow-sm leading-[5rem]">
        <span className="opacity-0">SVG to PNG Converter</span>
      </h1>
    )
  }
);

// Memoize static parts to prevent re-renders if parent re-renders
const TrustBadge = () => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="mb-6 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-sm dark:border-primary/60 dark:bg-primary/20 dark:text-blue-200"
  >
    <ShieldCheck className="h-4 w-4" />
    <span>100% Local & Privacy First</span>
  </motion.div>
);

const Subtitle = () => (
  <motion.p 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 1, ease: "easeOut" }}
    className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 md:text-xl"
  >
    Transform your vector graphics with our free SVG to PNG converter.
    <br className="hidden sm:block" />
    Instantly export high-quality PNGs directly in your browser, no server uploads needed.
  </motion.p>
);

export function HeroSection() {
  return (
    <div className="mb-12 flex flex-col items-center text-center">
      <TrustBadge />

      <TypingAnimation 
        text="SVG to PNG Converter" 
        duration={50}
        className="mb-6 text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 via-primary to-zinc-500 dark:from-white dark:via-primary/80 dark:to-zinc-400 md:text-7xl drop-shadow-sm"
      />
      
      <Subtitle />
    </div>
  );
}
