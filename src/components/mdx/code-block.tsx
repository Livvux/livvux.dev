import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { codeToHtml } from "shiki/bundle/web";
import { cn } from "@/lib/utils";
import { CodeCopyButton } from "@/components/mdx/code-copy-button";

type CodeProperties = ComponentProps<"code"> & {
  "data-meta"?: string;
  "data-title"?: string;
};

function textFrom(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFrom).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textFrom(node.props.children);
  return "";
}

/** RSC: highlighting happens at build time/SSR, not in every reader's browser. */
export async function CodeBlock({ children, ...props }: ComponentProps<"pre">) {
  const element = Children.toArray(children).find((child) => isValidElement(child));
  const codeProps = isValidElement<CodeProperties>(element) ? element.props : undefined;
  const source = textFrom(codeProps?.children ?? children);
  const className = codeProps?.className ?? "";
  const language = /language-([a-z0-9-]+)/i.exec(className)?.[1] ?? "plaintext";
  const meta = codeProps?.["data-meta"] ?? "";
  const title = codeProps?.["data-title"] ?? /(?:^|\s)(?:title|filename)="([^"]+)"/.exec(meta)?.[1];

  let highlighted: string | null = null;
  try {
    const html = await codeToHtml(source, {
      lang: language,
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    });
    // Shiki returns trusted, escaped HTML with one <pre><code> block.
    highlighted = /<code[^>]*>([\s\S]*?)<\/code>/i.exec(html)?.[1] ?? null;
  } catch {
    // Unsupported language: retain complete, copyable plain text.
  }

  return <div className="group relative my-6 overflow-hidden rounded-xl border border-border">
    {title && <div className="border-b border-border bg-muted/50 p-3 text-xs font-medium text-foreground">{title}</div>}
    <div className="relative">
      <CodeCopyButton code={source} />
      <pre {...props} className={cn("m-0! overflow-x-auto p-4! pr-12! font-mono!", props.className)}>
        {highlighted !== null
          ? <code className={`shiki ${className}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
          : <code className={className}>{source}</code>}
      </pre>
    </div>
  </div>;
}
