import type { Metadata } from "next";
import "../globals.css";
import "@flaticon/flaticon-uicons/css/all/all.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    openGraph: {
      type: "website",
      url: "https://github.com/SamoraDC/RustAlgorithmTrading",
      title,
      description,
      images: [
        {
          url: "https://res.cloudinary.com/dbzv9xfjp/image/upload/v1723499276/og-images/shadcn-vue.jpg",
          width: 1200,
          height: 630,
          alt: "Lepos platform landing page",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "https://github.com/SamoraDC/RustAlgorithmTrading",
      title,
      description,
      images: [
        "https://res.cloudinary.com/dbzv9xfjp/image/upload/v1723499276/og-images/shadcn-vue.jpg",
      ],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate that the incoming locale is supported
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Provide all messages to the client provider
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
