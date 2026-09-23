"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Locale = "en" | "de";
type Status = "idle" | "loading" | "ready" | "error";

type TwitterApi = {
  widgets: {
    createTweet: (
      id: string,
      element: HTMLElement,
      options: {
        lang: Locale;
        dnt: boolean;
        conversation: "none";
        theme: "light";
      },
    ) => Promise<HTMLElement | undefined>;
  };
};

const labels = {
  en: {
    title: "Post on X",
    notice: "Load the original post from X. Your browser will connect to X and its content providers.",
    load: "Load post from X",
    loading: "Loading the original post…",
    error: "The post could not be loaded. You can still open the original on X.",
    link: "Read the original post on X",
  },
  de: {
    title: "Beitrag auf X",
    notice: "Lade den Originalbeitrag von X. Dein Browser verbindet sich dabei mit X und dessen Inhaltsanbietern.",
    load: "Beitrag von X laden",
    loading: "Der Originalbeitrag wird geladen…",
    error: "Der Beitrag konnte nicht geladen werden. Du kannst das Original weiterhin auf X öffnen.",
    link: "Originalbeitrag auf X lesen",
  },
} as const;

/** Loads the official widget only after a reader opts in; no copied tweet text. */
export function TweetEmbed({ id, lang = "en" }: { id: string; lang?: Locale }) {
  const [enabled, setEnabled] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const container = useRef<HTMLDivElement>(null);
  const text = labels[lang];
  const href = `https://x.com/i/web/status/${encodeURIComponent(id)}`;

  // Also handles blocked scripts and widget promises that never resolve.
  useEffect(() => {
    if (status !== "loading") return;
    const timeout = window.setTimeout(() => setStatus("error"), 15000);
    return () => window.clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    if (!enabled || !scriptReady || !container.current) return;

    // X owns this child, not the React-managed container. Separate targets make
    // cleanup safe under Strict Mode and when navigating between translations.
    const target = document.createElement("div");
    target.style.width = "100%";
    target.style.maxWidth = "550px";
    container.current.appendChild(target);
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        const api = (window as Window & { twttr?: TwitterApi }).twttr;
        if (!api?.widgets?.createTweet) throw new Error("X widget unavailable");
        return api.widgets.createTweet(id, target, {
          lang,
          dnt: true,
          conversation: "none",
          theme: "light",
        });
      })
      .then((element) => {
        if (!cancelled) setStatus(element ? "ready" : "error");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      target.remove();
    };
  }, [enabled, scriptReady, id, lang]);

  return (
    <section
      aria-label={text.title}
      className="not-prose my-8 rounded-xl border border-border p-4 text-sm"
    >
      {!enabled && (
        <div className="space-y-3">
          <p className="text-muted-foreground">{text.notice}</p>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => {
              setStatus("loading");
              setEnabled(true);
            }}
          >
            {text.load}
          </button>
        </div>
      )}
      <div role="status" aria-live="polite" className="text-muted-foreground">
        {status === "loading" ? <p>{text.loading}</p> : null}
        {status === "error" ? <p>{text.error}</p> : null}
      </div>
      <div
        ref={container}
        aria-busy={status === "loading"}
        className="flex min-w-0 justify-center overflow-x-auto"
      />
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block underline underline-offset-4"
      >
        {text.link}
      </a>
      {enabled && (
        <Script
          id="x-tweet-widgets"
          src="https://platform.twitter.com/widgets.js"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
          onError={() => setStatus("error")}
        />
      )}
    </section>
  );
}
