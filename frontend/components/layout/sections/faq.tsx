import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  return (
    <section id="faq" className="container md:w-[700px] py-24 sm:py-32">
      <div className="text-center mb-8">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          FAQ
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold">
          Common Questions
        </h2>
      </div>

      <Accordion type="single" collapsible className="AccordionRoot">
        {FAQList.map(({ question, answer, value }) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger className="text-left">
              {question}
            </AccordionTrigger>

            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
