import { withContentCollections } from "@content-collections/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/blog/ki-adhs-unterstuetzung-2026",
        destination: "/blog/ai-adhd-support-2026/de",
        permanent: true,
      },
      {
        source: "/blog/ki-musik-kreativitaet-2026",
        destination: "/blog/ai-music-creativity-2026/de",
        permanent: true,
      },
      {
        source: "/blog/ki-musik-ethik-2026",
        destination: "/blog/ai-music-ethics-2026/de",
        permanent: true,
      },
      {
        source: "/blog/ki-musik-gefuehle-ausdruecken",
        destination: "/blog/ai-music-emotional-expression/de",
        permanent: true,
      },
      {
        source: "/blog/macos-finder-webp-konverter-2026",
        destination: "/blog/macos-finder-webp-converter-2026/de",
        permanent: true,
      },
      {
        source: "/blog/eigener-ki-musik-workspace-2026",
        destination: "/blog/personal-ai-music-workspace-2026/de",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

// withContentCollections must be the outermost plugin
export default withContentCollections(nextConfig);
