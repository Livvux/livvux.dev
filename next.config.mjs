import { withContentCollections } from "@content-collections/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async redirects() {
    return [
      // Consolidate www and apex before canonical/analytics handling.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.livvux.dev" }],
        destination: "https://livvux.dev/:path*",
        permanent: true,
      },
      { source: "/blog/ki-adhs-unterstuetzung-2026", destination: "/blog/ai-adhd-support-2026/de", permanent: true },
      { source: "/blog/ki-musik-kreativitaet-2026", destination: "/blog/ai-music-creativity-2026/de", permanent: true },
      { source: "/blog/ki-musik-ethik-2026", destination: "/blog/ai-music-ethics-2026/de", permanent: true },
      { source: "/blog/ki-musik-gefuehle-ausdruecken", destination: "/blog/ai-music-emotional-expression/de", permanent: true },
      { source: "/blog/macos-finder-webp-konverter-2026", destination: "/blog/macos-finder-webp-converter-2026/de", permanent: true },
      { source: "/blog/eigener-ki-musik-workspace-2026", destination: "/blog/personal-ai-music-workspace-2026/de", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Defence in depth, not an access control: robots.txt still disallows API
        // crawling. Never apply noindex to HTML pages or social-preview images.
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

// withContentCollections must be the outermost plugin
export default withContentCollections(nextConfig);
