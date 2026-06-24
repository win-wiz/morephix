'use client';

import { ConverterApp } from '@/components/svg-pipeline/converter-app';
import { motion } from 'framer-motion';

export function ConverterSection() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-3xl mb-24"
    >
      <ConverterApp />
    </motion.div>
  );
}
