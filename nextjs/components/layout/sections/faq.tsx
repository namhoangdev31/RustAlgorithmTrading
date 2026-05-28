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
import { useTranslations } from "next-intl";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

export const FAQSection = () => {
  const t = useTranslations("FAQ");
  const headerRef = useRef<HTMLDivElement>(null);
  const accordionRef = useRef<HTMLDivElement>(null);

  const FAQList: FAQProps[] = [
    {
      question: t("q1"),
      answer: t("a1"),
      value: "item-1",
    },
    {
      question: t("q2"),
      answer: t("a2"),
      value: "item-2",
    },
    {
      question: t("q3"),
      answer: t("a3"),
      value: "item-3",
    },
    {
      question: t("q4"),
      answer: t("a4"),
      value: "item-4",
    },
    {
      question: t("q5"),
      answer: t("a5"),
      value: "item-5",
    },
  ];

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
          {t("section_title")}
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold">
          {t("main_title")}
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
