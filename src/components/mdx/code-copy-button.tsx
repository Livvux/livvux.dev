"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return <Button
    type="button"
    onClick={async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    }}
    variant="outline"
    size="icon"
    className="absolute right-3 top-3 z-10 size-8 cursor-pointer rounded-md border border-border bg-background text-foreground opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
    aria-label={copied ? "Code copied" : "Copy code"}
  >
    {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
  </Button>;
}
