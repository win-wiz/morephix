import type { Metadata } from "next";
import { SITE } from "@/lib/shared/tools";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Pro Image Processing & AI Tools`,
    template: `%s — ${SITE.name}`,
  },
  description: `${SITE.name}: ${SITE.tagline}`,
  keywords: ["image tools", "ai generation", "svg to png", "remove bg", "upscaler"],
  openGraph: {
    title: `${SITE.name} — Pro Image Processing & AI Tools`,
    description: SITE.tagline,
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — Pro Image Processing & AI Tools`,
    description: SITE.tagline,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  description: SITE.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
