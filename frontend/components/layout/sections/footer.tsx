import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export const FooterSection = () => {
  return (
    <footer id="footer" className="container py-24 sm:py-32">
      <div className="p-10 bg-card border border-secondary rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
          <div className="col-span-full xl:col-span-2">
            <Link href="#" className="flex font-bold items-center">
              <ShieldCheck className="size-9 mr-2 bg-gradient-to-tr from-primary via-primary/70 to-primary rounded-lg border border-secondary text-primary-foreground" />

              <h3 className="text-2xl">RustAT</h3>
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Project</h3>
            <div>
              <Link href="#benefits" className="opacity-60 hover:opacity-100">
                Benefits
              </Link>
            </div>

            <div>
              <Link href="#features" className="opacity-60 hover:opacity-100">
                Features
              </Link>
            </div>

            <div>
              <Link href="#pricing" className="opacity-60 hover:opacity-100">
                Plans
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Runtime</h3>
            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Python research
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Rust kernel
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Go control plane
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Docs</h3>
            <div>
              <Link href="#contact" className="opacity-60 hover:opacity-100">
                Contact
              </Link>
            </div>

            <div>
              <Link href="#faq" className="opacity-60 hover:opacity-100">
                FAQ
              </Link>
            </div>

            <div>
              <Link href="#" className="opacity-60 hover:opacity-100">
                Playbook
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-lg">Links</h3>
            <div>
              <Link
                href="https://github.com/SamoraDC/RustAlgorithmTrading"
                target="_blank"
                className="opacity-60 hover:opacity-100"
              >
                GitHub
              </Link>
            </div>

            <div>
              <Link href="#contact" className="opacity-60 hover:opacity-100">
                Demo request
              </Link>
            </div>

            <div>
              <Link href="#footer" className="opacity-60 hover:opacity-100">
                Top
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        <section className="">
          <h3 className="">
            &copy; 2026 Built with Next.js, shadcn/ui, TypeScript, and Tailwind.
            <Link
              target="_blank"
              href="https://github.com/nobruf/shadcn-landing-page"
              className="text-primary transition-all border-primary hover:border-b-2 ml-1"
            >
              Template reference
            </Link>
          </h3>
        </section>
      </div>
    </footer>
  );
};
