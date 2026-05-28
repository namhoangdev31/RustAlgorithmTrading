import type { MDXComponents } from "mdx/types";
import React from "react";
import { PreBlock } from "@/components/docs/pre-block";
import { Callout, Steps, Card, CardGroup } from "@/components/docs/mdx-elements";

// Helper to slugify text for heading IDs
const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents for Vietnamese support
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

// Helper to extract text from React children tree
const getTextContent = (children: React.ReactNode): string => {
  if (!children) return "";
  if (typeof children === "string") return children;
  if (typeof children === "number") return children.toString();
  if (Array.isArray(children)) return children.map(getTextContent).join("");
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    return props.children ? getTextContent(props.children) : "";
  }
  return "";
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ className, children, ...props }) => {
      const id = slugify(getTextContent(children));
      return (
        <h1
          id={id}
          className="scroll-m-20 text-4xl font-extrabold tracking-tight text-foreground mb-6"
          {...props}
        >
          {children}
        </h1>
      );
    },
    h2: ({ className, children, ...props }) => {
      const id = slugify(getTextContent(children));
      return (
        <h2
          id={id}
          className="scroll-m-20 border-b border-border/40 pb-2 text-2xl font-bold tracking-tight text-foreground mt-10 mb-4 first:mt-0"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ className, children, ...props }) => {
      const id = slugify(getTextContent(children));
      return (
        <h3
          id={id}
          className="scroll-m-20 text-xl font-semibold tracking-tight text-foreground mt-8 mb-4"
          {...props}
        >
          {children}
        </h3>
      );
    },
    h4: ({ className, children, ...props }) => {
      const id = slugify(getTextContent(children));
      return (
        <h4
          id={id}
          className="scroll-m-20 text-lg font-medium tracking-tight text-foreground mt-6 mb-2"
          {...props}
        >
          {children}
        </h4>
      );
    },
    p: ({ className, ...props }) => (
      <p
        className="leading-7 [&:not(:first-child)]:mt-4 text-muted-foreground mb-4"
        {...props}
      />
    ),
    a: ({ className, ...props }) => (
      <a
        className="font-medium text-primary underline underline-offset-4 hover:text-emerald-400 transition-colors"
        {...props}
      />
    ),
    ul: ({ className, ...props }) => (
      <ul className="my-4 ml-6 list-disc [&>li]:mt-2 text-muted-foreground" {...props} />
    ),
    ol: ({ className, ...props }) => (
      <ol className="my-4 ml-6 list-decimal [&>li]:mt-2 text-muted-foreground" {...props} />
    ),
    li: ({ className, ...props }) => <li className="text-muted-foreground" {...props} />,
    blockquote: ({ className, ...props }) => (
      <blockquote
        className="mt-6 border-l-2 border-primary pl-6 italic text-muted-foreground/80 bg-primary/5 py-2 pr-4 rounded-r-md"
        {...props}
      />
    ),
    img: ({ className, alt, ...props }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className="rounded-lg border border-border/40 max-w-full my-6 shadow-md"
        alt={alt}
        {...props}
      />
    ),
    hr: ({ ...props }) => <hr className="my-8 border-border/40" {...props} />,
    table: ({ className, ...props }) => (
      <div className="my-6 w-full overflow-y-auto rounded-lg border border-border/40">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    ),
    tr: ({ className, ...props }) => (
      <tr className="m-0 border-t border-border/40 even:bg-muted/20" {...props} />
    ),
    th: ({ className, ...props }) => (
      <th
        className="border-b border-border/40 px-4 py-3 text-left font-bold text-foreground bg-muted/30 [&[align=center]]:text-center [&[align=right]]:text-right"
        {...props}
      />
    ),
    td: ({ className, ...props }) => (
      <td
        className="px-4 py-3 text-left text-muted-foreground [&[align=center]]:text-center [&[align=right]]:text-right"
        {...props}
      />
    ),
    pre: PreBlock,
    code: ({ className, ...props }) => (
      <code
        className="relative rounded bg-zinc-900 border border-zinc-800 px-[0.3rem] py-[0.2rem] font-mono text-sm text-emerald-400"
        {...props}
      />
    ),
    Callout,
    Steps,
    Card,
    CardGroup,
    ...components,
  };
}
