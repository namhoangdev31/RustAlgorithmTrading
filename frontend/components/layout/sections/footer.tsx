import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "../language-switcher";
import { useTranslations } from "next-intl";
import Image from "next/image";
import logoImg from "@/app/logo_nonbg.png";

export const FooterSection = () => {
  const t = useTranslations("Footer");

  return (
    <footer id="footer" className="container py-24 sm:py-32">
      <div className="p-10 bg-card border border-secondary rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
          <div className="col-span-full xl:col-span-2">
            <Link href="#" className="flex font-bold items-center">
              <Image
                src={logoImg}
                alt="Lepos Logo"
                width={36}
                height={36}
                className="mr-2 object-contain"
              />

              <h3 className="text-2xl">Lepos</h3>
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">{t("platform")}</h3>
            <div>
              <Link href="#benefits" className="opacity-60 hover:opacity-100">
                {t("benefits")}
              </Link>
            </div>

            <div>
              <Link href="#features" className="opacity-60 hover:opacity-100">
                {t("features")}
              </Link>
            </div>

            <div>
              <Link href="#pricing" className="opacity-60 hover:opacity-100">
                {t("pricing")}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">{t("products")}</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                {t("mini_apps")}
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                {t("web_hosting")}
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                {t("trading_engine")}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">{t("resources")}</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                {t("documentation")}
              </Link>
            </div>

            <div>
              <Link href="#faq" className="opacity-60 hover:opacity-100">
                {t("faq")}
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                {t("api_reference")}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">{t("links")}</h3>
            <div>
              <Link
                href="https://github.com/SamoraDC/RustAlgorithmTrading"
                target="_blank"
                className="opacity-60 hover:opacity-100"
              >
                {t("github")}
              </Link>
            </div>

            <div>
              <Link href="#contact" className="opacity-60 hover:opacity-100">
                {t("contact_us")}
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                {t("status_page")}
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        <section className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-muted-foreground text-sm">
            &copy; 2026 Lepos. {t("rights")}
          </h3>
          <LanguageSwitcher />
        </section>
      </div>
    </footer>
  );
};
