'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader } from '@/components/ui/section-header';

// --- Reusable Sub-components ---

export interface HighlightCardProps {
  title: string;
  description: React.ReactNode;
  icon: LucideIcon;
  className?: string;
}

export const HighlightCard = memo(function HighlightCard({ 
  title, 
  description, 
  icon: Icon,
  className
}: HighlightCardProps) {
  return (
    <div className={cn("rounded-[1.5rem] border border-primary/10 bg-primary/5 p-6 md:p-8 shadow-sm", className)}>
      <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2.5">
        <Icon className="w-5 h-5 text-primary" />
        {title}
      </h3>
      <p className="text-[16px] text-muted-foreground/90 m-0">
        {description}
      </p>
    </div>
  );
});

// --- Constants ---

const MOTION_CONFIG = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, ease: "easeOut" }
} as const;

// --- Main Component ---

export const AboutArticle = memo(function AboutArticle() {
  return (
    <motion.div 
      initial={MOTION_CONFIG.initial}
      whileInView={MOTION_CONFIG.whileInView}
      viewport={MOTION_CONFIG.viewport}
      transition={MOTION_CONFIG.transition}
      className="max-w-3xl mx-auto mb-16 md:mb-24"
    >
      <SectionHeader 
        tag="Understanding the Format"
        title="Why Convert SVG to PNG?"
      />
      
      <div className="text-[17px] leading-relaxed text-muted-foreground space-y-6">
        <p>
          <strong className="text-foreground font-semibold">SVG (Scalable Vector Graphics)</strong> relies on mathematical equations to render images, allowing infinite scaling without quality loss. <strong className="text-foreground font-semibold">PNG (Portable Network Graphics)</strong>, on the other hand, is a raster-based bitmap format using a grid of pixels, uniquely supporting transparent backgrounds. When you use an <strong className="text-foreground font-medium">SVG to PNG converter</strong>, you bridge the gap between flexible vector designs and universal image compatibility.
        </p>
        <p>
          While SVGs are ideal for modern web design and vector logos, many contexts still don&apos;t support them. Social media platforms, email signatures, legacy software, and traditional presentation tools often require rasterized formats, making <strong className="text-foreground font-medium">SVG to PNG conversion</strong> a necessary step in your design workflow.
        </p>
        
        <HighlightCard 
          icon={ShieldCheck}
          title="True Local Processing"
          description={
            <>
              Traditional online <strong className="text-foreground font-medium">SVG to PNG converters</strong> upload your files to a cloud server, which is slow and introduces data privacy risks. We bring the underlying rendering engine directly into your browser via WebAssembly, achieving true <strong className="text-foreground font-medium">local conversion</strong>. Your designs never leave your device.
            </>
          }
          className="!mt-10"
        />
      </div>
    </motion.div>
  );
});
