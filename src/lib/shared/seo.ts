import { Metadata } from 'next';
import { SITE } from './tools';

type SEOProps = {
  title: string;
  description: string;
  keywords: string[];
  path?: string;
};

/**
 * Generate standardized SEO metadata for any page/tool.
 * 
 * --- SEO Design Philosophy ---
 * 1. Strict Length Constraints:
 *    - Title: <= 60 characters
 *    - Description: <= 160 characters
 *    - Keywords: <= 100 characters combined
 * 2. Keyword Density (On-Page):
 *    - Beyond TDK, ensure the tool's core keyword (e.g., "svg to png") 
 *      has a natural, high density in the actual page content.
 *    - Target components like Hero subtitle, Feature cards, About sections, and FAQs 
 *      to organically embed the primary keyword and its variations (e.g., "SVG to PNG converter", "SVG to PNG conversion").
 * -----------------------------
 */
export function constructSEO({ title, description, keywords, path }: SEOProps): Metadata {
  const fullTitle = `${title} — ${SITE.name}`;
  // Validate constraints (for development warnings or silent enforcement)
  if (fullTitle.length > 60) {
    console.warn(`[SEO Warning] Title is too long: ${fullTitle.length} chars (> 60). "${fullTitle}"`);
  }
  if (description.length > 160) {
    console.warn(`[SEO Warning] Description is too long: ${description.length} chars (> 160). "${description}"`);
  }
  const keywordsString = keywords.join(', ');
  if (keywordsString.length > 100) {
    console.warn(`[SEO Warning] Keywords are too long: ${keywordsString.length} chars (> 100). "${keywordsString}"`);
  }

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      url: path ? `${SITE.url}${path}` : SITE.url,
      siteName: SITE.name,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
    },
  };
}
