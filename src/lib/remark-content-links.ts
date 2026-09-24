interface MdxNode {
  type: string;
  name?: string | null;
  children?: MdxNode[];
}

// Literal JSX <a> tags bypass MDX's `a` component mapping. Route them through
// the same component, including image links and dynamic/spread attributes.
export function remarkContentLinks() {
  return (tree: MdxNode) => {
    const walk = (node: MdxNode) => {
      if (
        (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
        node.name === "a"
      ) {
        node.name = "ContentLink";
      }

      node.children?.forEach(walk);
    };

    walk(tree);
  };
}
