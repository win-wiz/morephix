'use client';

import { memo } from 'react';
import { ShieldCheck, Zap, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 1.8, // 1.4s (Converter delay) + 0.4s (Converter animation partial complete)
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 1,
      duration: 0.8
    }
  }
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FeatureCard = memo(function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <motion.div variants={cardVariants} className="group relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-white p-6 lg:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 dark:border-zinc-800 dark:bg-zinc-950/80 dark:hover:shadow-primary/20">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      <div className="mb-4 flex items-center gap-3 lg:gap-4">
        <div className="inline-flex h-10 w-10 lg:h-12 lg:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white dark:bg-primary/20 dark:ring-primary/30">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-[17px] lg:text-xl font-semibold text-zinc-900 dark:text-white tracking-tight whitespace-nowrap">
          {title}
        </h3>
      </div>
      <p className="text-[14px] lg:text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
});

const features = [
  {
    title: 'Blazing Fast',
    description: 'Powered by WebAssembly and Resvg. Delivers pixel-perfect SVG to PNG conversions in milliseconds, right in your tab.',
    icon: Zap,
  },
  {
    title: '100% Local',
    description: 'Your files stay yours. This SVG to PNG converter processes everything entirely in your browser without uploading to any server.',
    icon: ShieldCheck,
  },
  {
    title: 'Total Control',
    description: 'Unlock high-res exports. Tweak dimensions, set print-grade DPI, and customize with preset or custom transparent backgrounds during your SVG to PNG conversion.',
    icon: SlidersHorizontal,
  },
];

export function FeatureCards() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-32 max-w-5xl mx-auto relative z-10"
    >
      {features.map((feature) => (
        <FeatureCard 
          key={feature.title}
          title={feature.title}
          description={feature.description}
          icon={feature.icon}
        />
      ))}
    </motion.div>
  );
}
