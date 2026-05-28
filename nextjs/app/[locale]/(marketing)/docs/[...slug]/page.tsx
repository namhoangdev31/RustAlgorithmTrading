import React from "react";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { docsNavigation } from "@/lib/docs";
import { ArrowLeft, ArrowRight, ChevronRight, Edit3 } from "lucide-react";

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string[];
  }>;
}

// Statically compile all valid documentation paths at build time
export async function generateStaticParams() {
  const paths: { slug: string[] }[] = [];
  docsNavigation.forEach((group) => {
    group.items.forEach((item) => {
      paths.push({
        slug: item.slug.split("/"),
      });
    });
  });
  return paths;
}

export default async function DocPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const slugPath = slug.join("/");

  let Content;
  try {
    // Attempt to load .md file
    const mdxModule = await import(`../content/${slugPath}.md`);
    Content = mdxModule.default;
  } catch (err) {
    try {
      // Attempt to load .mdx file
      const mdxModule = await import(`../content/${slugPath}.mdx`);
      Content = mdxModule.default;
    } catch (err2) {
      try {
        // Attempt to load index file if directory
        const mdxModule = await import(`../content/${slugPath}/index.md`);
        Content = mdxModule.default;
      } catch (err3) {
        notFound();
      }
    }
  }

  // Find document category and title for breadcrumbs
  let currentGroupTitle = "";
  let currentDocTitle = "";

  for (const group of docsNavigation) {
    const item = group.items.find((i) => i.slug === slugPath);
    if (item) {
      currentGroupTitle = group.title;
      currentDocTitle = item.title;
      break;
    }
  }

  // Calculate Next and Previous Docs
  const allDocs = docsNavigation.flatMap((group) => group.items);
  const currentIndex = allDocs.findIndex((item) => item.slug === slugPath);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;

  // Paths formatted with locale support
  const prevPath = prevDoc ? `/docs/${prevDoc.slug}` : "";
  const nextPath = nextDoc ? `/docs/${nextDoc.slug}` : "";

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium border-b border-zinc-800/40 pb-4 mb-4">
        <Link href="/docs" className="hover:text-primary transition-colors">
          Docs
        </Link>
        {currentGroupTitle && (
          <>
            <ChevronRight className="size-3 text-zinc-600" />
            <span className="text-zinc-400">{currentGroupTitle}</span>
          </>
        )}
        {currentDocTitle && (
          <>
            <ChevronRight className="size-3 text-zinc-600" />
            <span className="text-zinc-300 font-semibold">{currentDocTitle}</span>
          </>
        )}
      </nav>

      {/* Main MDX Content */}
      <article className="prose prose-zinc dark:prose-invert max-w-none text-zinc-300">
        <Content />
      </article>

      {/* Footer Page Navigation */}
      <div className="border-t border-zinc-800/60 pt-8 mt-12 grid grid-cols-2 gap-4">
        {prevDoc ? (
          <Link
            href={prevPath}
            className="flex flex-col items-start gap-1 p-4 rounded-lg border border-zinc-800/60 bg-zinc-950/40 hover:bg-zinc-900/30 hover:border-zinc-700/60 transition-all group text-left"
          >
            <span className="flex items-center gap-1 text-xs text-zinc-500 font-semibold">
              <ArrowLeft className="size-3 group-hover:-translate-x-1 transition-transform" />
              PREVIOUS
            </span>
            <span className="text-sm font-semibold text-zinc-300 group-hover:text-primary transition-colors">
              {prevDoc.title}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {nextDoc ? (
          <Link
            href={nextPath}
            className="flex flex-col items-end gap-1 p-4 rounded-lg border border-zinc-800/60 bg-zinc-950/40 hover:bg-zinc-900/30 hover:border-zinc-700/60 transition-all group text-right"
          >
            <span className="flex items-center gap-1 text-xs text-zinc-500 font-semibold">
              NEXT
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </span>
            <span className="text-sm font-semibold text-zinc-300 group-hover:text-primary transition-colors">
              {nextDoc.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Edit on GitHub link */}
      <div className="flex items-center justify-end text-xs text-zinc-500 mt-6 pt-4 border-t border-zinc-800/20">
        <a
          href={`https://github.com/namhoangdev31/RustAlgorithmTrading/blob/main/nextjs/app/%5Blocale%5D/%28marketing%29/docs/content/${slugPath}.md`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-zinc-300 transition-colors"
        >
          <Edit3 className="size-3.5" />
          <span>Edit this page on GitHub</span>
        </a>
      </div>
    </div>
  );
}
