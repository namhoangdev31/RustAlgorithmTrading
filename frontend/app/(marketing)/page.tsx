import { BenefitsSection } from "@/components/layout/sections/benefits";
import { ContactSection } from "@/components/layout/sections/contact";
import { FAQSection } from "@/components/layout/sections/faq";
import { FeaturesSection } from "@/components/layout/sections/features";
import { FooterSection } from "@/components/layout/sections/footer";
import { HeroSection } from "@/components/layout/sections/hero";
import { PricingSection } from "@/components/layout/sections/pricing";
import { ServicesSection } from "@/components/layout/sections/services";
import { SponsorsSection } from "@/components/layout/sections/sponsors";
import { TestimonialSection } from "@/components/layout/sections/testimonial";

export const metadata = {
  title: "RustAlgorithmTrading - Landing template",
  description: "A Shadcn landing page for a hybrid trading platform.",
  openGraph: {
    type: "website",
    url: "https://github.com/SamoraDC/RustAlgorithmTrading",
    title: "RustAlgorithmTrading - Landing template",
    description: "A Shadcn landing page for a hybrid trading platform.",
    images: [
      {
        url: "https://res.cloudinary.com/dbzv9xfjp/image/upload/v1723499276/og-images/shadcn-vue.jpg",
        width: 1200,
        height: 630,
        alt: "RustAlgorithmTrading landing page",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "https://github.com/SamoraDC/RustAlgorithmTrading",
    title: "RustAlgorithmTrading - Landing template",
    description: "A Shadcn landing page for a hybrid trading platform.",
    images: [
      "https://res.cloudinary.com/dbzv9xfjp/image/upload/v1723499276/og-images/shadcn-vue.jpg",
    ],
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <SponsorsSection />
      <BenefitsSection />
      <FeaturesSection />
      <ServicesSection />
      <TestimonialSection />
      <PricingSection />
      <ContactSection />
      <FAQSection />
      <FooterSection />
    </>
  );
}
