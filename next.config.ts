import type { NextConfig } from "next";

function buildCSP(): string {
  const isDev = process.env.NODE_ENV === 'development';
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "worker-src 'self' blob:",
    "connect-src 'self' https: http:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join('; ');
}

const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: buildCSP(),
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-wasm"],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
