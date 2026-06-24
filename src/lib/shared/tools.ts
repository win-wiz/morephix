export type ToolCategory = 'convert' | 'enhance' | 'generate';

export type Tool = {
  href: string;
  title: string;
  description: string;
  category: ToolCategory;
  status: 'available' | 'soon';
  isNew?: boolean;
};

export const SITE = {
  name: 'Morephix',
  tagline: 'More than pixels, morph your imagination. The professional image & AI workshop.',
  wordless: 'https://wordless.online/',
  url: 'https://morephix.com',
} as const;

export const TOOL_CATEGORIES = [
  { id: 'convert', label: 'Format & Convert' },
  // { id: 'enhance', label: 'Enhance & Edit' },
  // { id: 'generate', label: 'AI Generation' },
] as const;

export const TOOLS: Tool[] = [
  {
    href: '/svg-to-png',
    title: 'SVG to PNG',
    description: 'Render vector SVGs to PNGs with batch support, custom dimensions, DPI, and transparent backgrounds.',
    category: 'convert',
    status: 'available',
  },
  /*
  {
    href: '/jpg-to-webp',
    title: 'JPG to WebP',
    description: 'Compress and convert images to next-gen WebP format for web performance.',
    category: 'convert',
    status: 'soon',
  },
  {
    href: '/upscale',
    title: 'AI Upscaler',
    description: 'Enhance image resolution up to 4x without losing detail using neural networks.',
    category: 'enhance',
    status: 'soon',
  },
  {
    href: '/remove-bg',
    title: 'Background Remover',
    description: 'Instantly extract subjects from their backgrounds with pixel-perfect edges.',
    category: 'enhance',
    status: 'soon',
  },
  {
    href: '/text-to-image',
    title: 'Text to Image',
    description: 'Generate high-quality images and conceptual art from text prompts.',
    category: 'generate',
    status: 'soon',
    isNew: true,
  },
  */
];
