"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: "What types of apps can I deploy?",
    answer:
      "You can deploy custom mini apps, micro-frontends, Next.js and Vite websites, and static sites. Our platform handles builds, CDN distribution, and SSL automatically.",
    value: "item-1",
  },
  {
    question: "How does the trading engine integrate with my apps?",
    answer:
      "The trading engine runs as a separate Rust-powered service accessible via REST and WebSocket APIs. You can embed trading widgets in your mini apps or use it standalone from the dashboard.",
    value: "item-2",
  },
  {
    question: "Is there a free tier?",
    answer:
      "Yes! Our Starter plan includes 3 mini apps and 5 websites at no cost. Upgrade to Pro or Enterprise for unlimited deployments and live trading access.",
    value: "item-3",
  },
  {
    question: "How fast are deployments?",
    answer:
      "Most deployments complete in under 30 seconds. Our Edge CDN ensures your apps load in sub-50ms from 200+ global locations.",
    value: "item-4",
  },
  {
    question: "Is the trading engine safe for production?",
    answer:
      "Absolutely. The engine includes built-in risk management, circuit breakers, exposure limits, and paper trading mode for strategy validation before going live.",
    value: "item-5",
  },
];

export const FAQSection = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const accordionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    let headerAnim: gsap.core.Tween | null = null;
    let accordionAnim: gsap.core.Tween | null = null;

    if (headerRef.current) {
      headerAnim = gsap.fromTo(
        headerRef.current.children,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    if (accordionRef.current) {
      const items = accordionRef.current.querySelectorAll(".faq-item");
      accordionAnim = gsap.fromTo(
        items,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: accordionRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    return () => {
      if (headerAnim) {
        if (headerAnim.scrollTrigger) headerAnim.scrollTrigger.kill();
        headerAnim.kill();
      }
      if (accordionAnim) {
        if (accordionAnim.scrollTrigger) accordionAnim.scrollTrigger.kill();
        accordionAnim.kill();
      }
    };
  }, []);

  return (
    <section id="faq" className="container md:w-[700px] py-24 sm:py-32 overflow-hidden">
      <div ref={headerRef} className="text-center mb-8">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          FAQ
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold">
          Common Questions
        </h2>
      </div>

      <div ref={accordionRef}>
        <Accordion type="single" collapsible className="AccordionRoot">
          {FAQList.map(({ question, answer, value }) => (
            <AccordionItem key={value} value={value} className="faq-item">
              <AccordionTrigger className="text-left hover:text-primary transition-colors">
                {question}
              </AccordionTrigger>

              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
