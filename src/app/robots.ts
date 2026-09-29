import type { MetadataRoute } from "next";
import { DATA } from "@/data/resume";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    // Keep the sitemap on the same canonical origin as page metadata.
    sitemap: new URL("/sitemap.xml", DATA.url).href,
  };
}
