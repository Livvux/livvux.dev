"use client";

import { ContentLink } from "@/components/content-link";
import SpotlightCard from "@/components/react-bits/spotlight-card";
import { getExternalLinkProps } from "@/lib/external-links";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useState, type CSSProperties } from "react";
import Markdown from "react-markdown";

function ProjectPlaceholder({ title }: { title: string }) {
  return (
    <div className="relative flex h-48 items-center justify-center bg-muted/40 px-6 text-center">
      <span className="absolute left-4 top-4 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Project
      </span>
      <span className="text-balance text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </span>
    </div>
  );
}

function ProjectImage({ src, alt }: { src: string; alt: string }) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return <ProjectPlaceholder title={alt} />;
  }

  return (
    <Image
      src={src.startsWith("/") ? src : `/${src}`}
      alt={alt}
      width={640}
      height={384}
      sizes="(max-width: 639px) calc(100vw - 3rem), 320px"
      loading="lazy"
      className="w-full h-48 object-cover"
      onError={() => setImageError(true)}
    />
  );
}

interface Props {
  title: string;
  href?: string;
  description: string;
  dates: string;
  tags: readonly string[];
  link?: string;
  image?: string;
  video?: string;
  links?: readonly {
    icon: React.ReactNode;
    type: string;
    href: string;
  }[];
  className?: string;
}

export function ProjectCard({
  title,
  href,
  description,
  dates,
  tags,
  link,
  image,
  video,
  links,
  className,
}: Props) {
  const { resolvedTheme } = useTheme();

  return (
    <SpotlightCard
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      spotlightColor="var(--foreground)"
      intensity={0.08}
      borderGlow={0.4}
      softness={0.85}
      smoothing={0.18}
      proximity={0}
      flare={false}
      style={{
        "--spotlight-card-surface": "var(--background)",
        "--spotlight-card-border": "transparent",
        "--spotlight-card-shadow": "none",
      } as CSSProperties}
      className={cn(
        "flex flex-col h-full border border-border rounded-xl overflow-hidden p-0",
        className
      )}
    >
      <div className="relative shrink-0">
        <Link
          href={href || "#"}
          {...getExternalLinkProps(href)}
          className="block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {video ? (
            <video
              src={video}
              poster={image ? (image.startsWith("/") ? image : `/${image}`) : undefined}
              preload="none"
              aria-label={`${title} preview`}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-48 object-cover"
            />
          ) : image ? (
            <ProjectImage src={image} alt={title} />
          ) : (
            <ProjectPlaceholder title={title} />
          )}
        </Link>
        {links && links.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-wrap gap-2">
            {links.map((link, idx) => (
              <Link
                href={link.href}
                key={idx}
                {...getExternalLinkProps(link.href)}
                onClick={(e) => e.stopPropagation()}
                className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Badge
                  className="flex items-center gap-1.5 text-xs bg-black text-white hover:bg-black/90"
                  variant="default"
                >
                  {link.icon}
                  {link.type}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">
              <Link
                href={href || "#"}
                {...getExternalLinkProps(href)}
                className="hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {title}
              </Link>
            </h3>
            <time className="text-xs text-muted-foreground">{dates}</time>
          </div>
          <Link
            href={href || "#"}
            {...getExternalLinkProps(href)}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label={`Open ${title}`}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="text-xs flex-1 prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
          <Markdown components={{ a: ContentLink }}>{description}</Markdown>
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="text-[11px] font-medium border border-border h-6 w-fit px-2"
                variant="outline"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </SpotlightCard>
  );
}
