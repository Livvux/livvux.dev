import type { ComponentProps } from "react";
import type { ExtraProps } from "react-markdown";
import { getExternalLinkProps } from "@/lib/external-links";

// Shared by Markdown and MDX; no effect or client-side click interception needed.
export function ContentLink(props: ComponentProps<"a"> & ExtraProps) {
  const anchorProps = { ...props };
  // react-markdown includes its syntax-tree node, which is not a DOM attribute.
  delete anchorProps.node;

  return <a {...anchorProps} {...getExternalLinkProps(props.href, props.rel)} />;
}
