'use client';

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/utils';

// Extract constant data to prevent recreation on every render
const FAQS = [
  {
    question: "Will I lose quality after converting SVG to PNG?",
    answer: "SVG is a vector format that scales infinitely without losing quality, while PNG is a raster format that becomes pixelated when enlarged. To avoid pixelation during your SVG to PNG conversion, we recommend specifying a larger width (e.g., 1024px or 2048px) and increasing the DPI before exporting. This ensures the edges remain crisp on high-resolution displays."
  },
  {
    question: "Does the SVG to PNG conversion support transparent backgrounds?",
    answer: "Yes. PNG naturally supports an alpha channel for transparency. If your original SVG has a transparent background, the resulting PNG will also be transparent by default. You can also explicitly set a custom background color using the \"Export Settings\" panel if you prefer."
  },
  {
    question: "Is this SVG to PNG converter secure?",
    answer: "Absolutely. This tool uses a WebAssembly engine to run the core conversion logic directly in your browser. Your design files are processed locally on your device—they are never uploaded, stored, or transmitted to any external server."
  },
  {
    question: "What SVG features are supported?",
    answer: "We use the industry-leading resvg rendering engine, which supports almost all static SVG 1.1 features, including complex paths, gradients, and filters. However, please note that JavaScript animations, CSS animations, or external web fonts referenced inside the SVG may not render correctly in the local environment."
  },
  {
    question: "Is there a file size limit for SVG to PNG conversion?",
    answer: "Because the SVG to PNG conversion happens locally in your browser, there are no artificial file size limits. However, extremely large or complex SVGs might require significant memory and CPU power from your device to process. For most typical design assets, the conversion is practically instantaneous."
  }
] as const;

// Sub-component for individual FAQ item to optimize rendering
const FaqItem = memo(function FaqItem({ 
  faq, 
  isOpen, 
  onClick 
}: { 
  faq: typeof FAQS[number]; 
  isOpen: boolean; 
  onClick: () => void; 
}) {
  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between py-6 text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-4 rounded-sm"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold text-foreground pr-8">
          {faq.question}
        </h3>
        <ChevronDown 
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180 text-primary"
          )} 
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[17px] leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const SvgToPngFaq = memo(function SvgToPngFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Open the first item by default

  return (
    <div className="max-w-3xl mx-auto">
      <SectionHeader 
        tag="Help Center"
        title="Frequently Asked Questions"
      />
      <div className="mt-8 flex flex-col">
        {FAQS.map((faq, index) => (
          <FaqItem 
            key={index} 
            faq={faq} 
            isOpen={openIndex === index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
});