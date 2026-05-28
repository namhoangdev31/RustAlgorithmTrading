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

// Statically compile all valid documentation paths and their directories at build time
export async function generateStaticParams() {
  const paths: { slug: string[] }[] = [];
  const addedSlugs = new Set<string>();

  docsNavigation.forEach((group) => {
    group.items.forEach((item) => {
      // Add the file slug itself
      if (!addedSlugs.has(item.slug)) {
        addedSlugs.add(item.slug);
        paths.push({
          slug: item.slug.split("/"),
        });
      }

      // Add parent directories too
      const parts = item.slug.split("/");
      if (parts.length > 1) {
        for (let i = 1; i < parts.length; i++) {
          const parentSlug = parts.slice(0, i).join("/");
          if (!addedSlugs.has(parentSlug)) {
            addedSlugs.add(parentSlug);
            paths.push({
              slug: parts.slice(0, i),
            });
          }
        }
      }
    });
  });

  return paths;
}

export default async function DocPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const slugPath = slug.join("/");

  let Content;
  let isDirectoryIndex = false;
  let childDocs: { title: string; slug: string }[] = [];

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
        // Dynamic directory index check
        childDocs = docsNavigation
          .flatMap((group) => group.items)
          .filter((item) => item.slug.startsWith(`${slugPath}/`));

        if (childDocs.length > 0) {
          isDirectoryIndex = true;
        } else {
          notFound();
        }
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

  // If it's a directory index and we couldn't find doc title/group title
  if (isDirectoryIndex && !currentDocTitle) {
    const firstChild = childDocs[0];
    const group = docsNavigation.find((g) =>
      g.items.some((i) => i.slug === firstChild.slug)
    );
    if (group) {
      currentGroupTitle = group.title;
    }
    currentDocTitle = slug[slug.length - 1].replace(/-/g, " ");
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
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium border-b border-border/40 pb-4 mb-4">
        <Link href="/docs" className="hover:text-primary transition-colors">
          Docs
        </Link>
        {currentGroupTitle && (
          <>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <span className="text-muted-foreground/80">{currentGroupTitle}</span>
          </>
        )}
        {currentDocTitle && (
          <>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <span className="text-foreground font-semibold capitalize">{currentDocTitle}</span>
          </>
        )}
      </nav>

      {/* Main Content */}
      {isDirectoryIndex ? (
        <div className="space-y-6">
          <div className="space-y-2 border-b border-border/40 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl capitalize">
              {slug[slug.length - 1].replace(/-/g, " ")}
            </h1>
            <p className="text-base text-muted-foreground">
              Select a document from the list below to explore this section.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {childDocs.map((doc) => (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="group p-5 rounded-lg border border-border/65 bg-card/25 hover:bg-muted/40 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all flex flex-col justify-between min-h-[120px]"
              >
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 font-mono opacity-80">
                    docs/{doc.slug}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary font-medium mt-4 group-hover:underline">
                  <span>Read document</span>
                  <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          {Content && <Content />}
        </article>
      )}

      {/* Footer Page Navigation */}
      {!isDirectoryIndex && (prevDoc || nextDoc) && (
        <div className="border-t border-border/60 pt-8 mt-12 grid grid-cols-2 gap-4">
          {prevDoc ? (
            <Link
              href={prevPath}
              className="flex flex-col items-start gap-1 p-4 rounded-lg border border-border/60 bg-card/40 hover:bg-muted/30 hover:border-border/80 transition-all group text-left"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground/80 font-semibold">
                <ArrowLeft className="size-3 group-hover:-translate-x-1 transition-transform" />
                PREVIOUS
              </span>
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {prevDoc.title}
              </span>
            </Link>
          ) : (
            <div />
          )}

          {nextDoc ? (
            <Link
              href={nextPath}
              className="flex flex-col items-end gap-1 p-4 rounded-lg border border-border/60 bg-card/40 hover:bg-muted/30 hover:border-border/80 transition-all group text-right"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground/80 font-semibold">
                NEXT
                <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
              </span>
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {nextDoc.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Edit on GitHub link */}
      {!isDirectoryIndex && (
        <div className="flex items-center justify-end text-xs text-muted-foreground/80 mt-6 pt-4 border-t border-border/20">
          <a
            href={`https://github.com/namhoangdev31/RustAlgorithmTrading/blob/main/nextjs/app/%5Blocale%5D/%28marketing%29/docs/content/${slugPath}.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Edit3 className="size-3.5" />
            <span>Edit this page on GitHub</span>
          </a>
        </div>
      )}
    </div>
  );
}

