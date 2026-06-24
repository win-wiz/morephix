'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { SvgToPngFaq } from '@/components/svg-pipeline/svg-to-png-faq';

const MOTION_CONFIG = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.7, ease: "easeOut" }
} as const;

export const FaqSection = memo(function FaqSection() {
  return (
    <motion.div 
      initial={MOTION_CONFIG.initial}
      whileInView={MOTION_CONFIG.whileInView}
      viewport={MOTION_CONFIG.viewport}
      transition={MOTION_CONFIG.transition}
      className="pt-5"
    >
      <SvgToPngFaq />
    </motion.div>
  );
});
