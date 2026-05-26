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
    question: "Is this a separate app from the trading runtime?",
    answer:
      "Yes. It lives in frontend/ as a Next.js app, so it can evolve independently from Python, Rust, and Go services.",
    value: "item-1",
  },
  {
    question: "Can I remove sections I do not need?",
    answer:
      "Yes. The page composes small section components from app/page.tsx, so you can delete or reorder sections without changing shared UI primitives.",
    value: "item-2",
  },
  {
    question: "Does it use shadcn source components?",
    answer:
      "Yes. Components are checked into frontend/components/ui and styled through Tailwind CSS variables.",
    value: "item-3",
  },
  {
    question: "Does it support dark mode?",
    answer:
      "Yes. The template includes next-themes and a theme toggle in the navigation.",
    value: "item-4",
  },
  {
    question: "Where should production claims come from?",
    answer:
      "Keep claims aligned with docs/DOCS_CANONICAL_MAP.md and PLAYBOOK.md so the landing page does not drift from runtime reality.",
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
