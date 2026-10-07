import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DATA } from "@/data/resume";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { StructuredData } from "@/components/structured-data";
import { siteStructuredData } from "@/lib/seo";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-mono",
});

// Set SEO_NOINDEX=true when building a non-production deployment.
const indexable = process.env.SEO_NOINDEX !== "true" && process.env.VERCEL_ENV !== "preview";

export const metadata: Metadata = {
  metadataBase: new URL(DATA.url),
  title: { default: DATA.name, template: `%s | ${DATA.name}` },
  description: DATA.description,
  authors: [{ name: DATA.name, url: DATA.url }],
  creator: DATA.name,
  publisher: DATA.name,
  openGraph: {
    title: DATA.name,
    description: DATA.description,
    url: DATA.url,
    siteName: DATA.name,
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: indexable,
    follow: true,
    googleBot: {
      index: indexable,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: { title: DATA.name, description: DATA.description, card: "summary_large_image" },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="describedby" href={new URL("/llms.txt", DATA.url).href} type="text/plain" title="Site guide for AI assistants" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased relative", geist.variable, geistMono.variable)}>
        <StructuredData data={siteStructuredData()} />
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider delayDuration={0}>
            <div className="absolute inset-0 top-0 left-0 right-0 h-[100px] overflow-hidden z-0" aria-hidden="true">
              <FlickeringGrid
                className="h-full w-full"
                squareSize={2}
                gridGap={2}
                style={{ maskImage: "linear-gradient(to bottom, black, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent)" }}
              />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto py-12 pb-24 sm:py-24 px-6">{children}</div>
            <Navbar />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
