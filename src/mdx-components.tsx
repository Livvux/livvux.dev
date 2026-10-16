import { ContentLink } from "@/components/content-link";
import { CodeBlock } from "@/components/mdx/code-block";
import { MediaContainer } from "@/components/mdx/media-container";
import { MarketShareChart } from "@/components/mdx/market-share-chart";
import { SyncComparison } from "@/components/mdx/sync-comparison";
import { TweetEmbed } from "@/components/mdx/tweet-embed";
import type { ComponentProps } from "react";

type CodeProps = ComponentProps<"code"> & { "data-language"?: string };

export const mdxComponents = {
  ContentLink,
  a: ContentLink,
  MediaContainer,
  MarketShareChart,
  SyncComparison,
  TweetEmbed,
  pre: (props: ComponentProps<"pre">) => <CodeBlock {...props} />,
  hr: (props: ComponentProps<"hr">) => (
    <div className="my-10 flex w-full items-center" {...props}>
      <div className="flex-1 h-px bg-border" style={{ maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }} />
    </div>
  ),
  table: (props: ComponentProps<"table">) => (
    <div className="my-6 border border-border rounded-xl overflow-hidden">
      <div className="w-full overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable article table">
        <table className="m-0! w-full min-w-full border-separate border-spacing-0" {...props} />
      </div>
    </div>
  ),
  code: ({ children, ...props }: CodeProps) => {
    if (props["data-language"]) return <code {...props}>{children}</code>;
    return <code className="px-1.5 py-0.5 rounded-md bg-muted/60 dark:bg-muted/40 text-sm font-mono text-foreground/90" {...props}>{children}</code>;
  },
} as const;
