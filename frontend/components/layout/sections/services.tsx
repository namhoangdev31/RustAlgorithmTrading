import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

enum ProService {
  YES = 1,
  NO = 0,
}
interface ServiceProps {
  title: string;
  pro: ProService;
  description: string;
}
const serviceList: ServiceProps[] = [
  {
    title: "Hero and product preview",
    description:
      "A sharp first screen with local dashboard imagery and two focused calls to action.",
    pro: 0,
  },
  {
    title: "Feature and benefit blocks",
    description:
      "Short copy modules for runtime ownership, risk, observability, and research workflows.",
    pro: 0,
  },
  {
    title: "Lead capture form",
    description: "A working client-side form that opens an email draft for demo follow-up.",
    pro: 0,
  },
  {
    title: "Themeable shadcn system",
    description: "Semantic tokens, dark mode, and source-owned components are ready to customize.",
    pro: 1,
  },
];

export const ServicesSection = () => {
  return (
    <section id="services" className="container py-24 sm:py-32">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        Template
      </h2>

      <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
        Sections you can keep or remove
      </h2>
      <h3 className="md:w-1/2 mx-auto text-xl text-center text-muted-foreground mb-8">
        The page stays intentionally simple: every block has a clear job and a
        small file surface.
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4 w-full lg:w-[60%] mx-auto">
        {serviceList.map(({ title, description, pro }) => (
          <Card
            key={title}
            className="bg-muted/60 dark:bg-card h-full relative"
          >
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <Badge
              data-pro={ProService.YES === pro}
              variant="secondary"
              className="absolute -top-2 -right-3 data-[pro=false]:hidden"
            >
              READY
            </Badge>
          </Card>
        ))}
      </div>
    </section>
  );
};
