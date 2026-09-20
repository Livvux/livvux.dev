"use client";

import { useRef, type ComponentProps, type ReactNode } from "react";
import { Copy } from "lucide-react";

import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { cn } from "@/lib/utils";

type Locale = "en" | "de";

const copy: Record<
  Locale,
  {
    manual: { title: string; caption: string };
    sync: { title: string; caption: string };
    nodes: { facebook: string; importer: string; wordpress: string; website: string };
    manualFrom: string;
    manualTo: string;
  }
> = {
  en: {
    manual: {
      title: "By hand",
      caption: "You are the sync: copy, re-check, re-upload — for every change.",
    },
    sync: {
      title: "One-way sync",
      caption: "Approved data moves by itself. People stay in control.",
    },
    nodes: { facebook: "Facebook", importer: "Importer", wordpress: "WordPress", website: "Website" },
    manualFrom: "Facebook album",
    manualTo: "Website",
  },
  de: {
    manual: {
      title: "Von Hand",
      caption: "Der Mensch ist der Abgleich: kopieren, prüfen, erneut hochladen — bei jeder Änderung.",
    },
    sync: {
      title: "Einseitiger Abgleich",
      caption: "Freigegebene Daten wandern von selbst. Menschen bleiben in der Kontrolle.",
    },
    nodes: { facebook: "Facebook", importer: "Abgleich", wordpress: "WordPress", website: "Website" },
    manualFrom: "Facebook-Album",
    manualTo: "Website",
  },
};

function Node({ label, ...props }: ComponentProps<"div"> & { label: ReactNode }) {
  return (
    <div
      {...props}
      className="z-10 rounded-full border bg-background px-2.5 py-1.5 text-center text-xs font-medium shadow-sm sm:px-3 sm:text-sm"
    >
      {label}
    </div>
  );
}

function Card({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col rounded-xl border bg-card p-5">
      <figcaption className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </figcaption>
      <div className="flex-1">{children}</div>
      <p className="mt-4 text-sm text-muted-foreground">{caption}</p>
    </figure>
  );
}

export function SyncComparison({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale] ?? copy.en;

  const manualRef = useRef<HTMLDivElement>(null);
  const syncRef = useRef<HTMLDivElement>(null);
  const facebookRef = useRef<HTMLDivElement>(null);
  const importerRef = useRef<HTMLDivElement>(null);
  const wordpressRef = useRef<HTMLDivElement>(null);
  const websiteRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn("not-prose my-8 grid gap-4 md:grid-cols-2 md:gap-6")}>
      <Card title={t.manual.title} caption={t.manual.caption}>
        <div ref={manualRef} className="relative flex h-52 flex-col items-center justify-between px-1">
          <Node label={t.manualFrom} />
          <div className="relative flex flex-1 items-center justify-center">
            <div className="h-full border-l-2 border-dashed border-muted-foreground/40" />
            <Copy className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-card p-1 text-muted-foreground" />
          </div>
          <Node label={t.manualTo} />
        </div>
      </Card>
      <Card title={t.sync.title} caption={t.sync.caption}>
        <div ref={syncRef} className="relative flex h-52 flex-col items-center justify-between px-1">
          <Node ref={facebookRef} label={t.nodes.facebook} />
          <Node ref={importerRef} label={t.nodes.importer} />
          <Node ref={wordpressRef} label={t.nodes.wordpress} />
          <Node ref={websiteRef} label={t.nodes.website} />
          <AnimatedBeam containerRef={syncRef} fromRef={facebookRef} toRef={importerRef} duration={3} />
          <AnimatedBeam containerRef={syncRef} fromRef={importerRef} toRef={wordpressRef} duration={3} delay={1} />
          <AnimatedBeam containerRef={syncRef} fromRef={wordpressRef} toRef={websiteRef} duration={3} delay={2} />
        </div>
      </Card>
    </div>
  );
}
