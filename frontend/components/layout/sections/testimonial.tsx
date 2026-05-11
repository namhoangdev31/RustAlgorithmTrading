"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";

interface ReviewProps {
  image: string;
  name: string;
  userName: string;
  comment: string;
  rating: number;
}

const reviewList: ReviewProps[] = [
  {
    image: "https://github.com/shadcn.png",
    name: "Operations lead",
    userName: "Paper trading rollout",
    comment:
      "The first screen finally explains the runtime split without sending every stakeholder into the docs.",
    rating: 5.0,
  },
  {
    image: "https://github.com/shadcn.png",
    name: "Quant researcher",
    userName: "Strategy validation",
    comment:
      "It keeps the research workflow visible while making it clear that production execution is owned elsewhere.",
    rating: 4.8,
  },

  {
    image: "https://github.com/shadcn.png",
    name: "Platform engineer",
    userName: "Rust runtime",
    comment:
      "The section structure is easy to adapt, and the shadcn source files make the UI behavior straightforward.",
    rating: 4.9,
  },
  {
    image: "https://github.com/shadcn.png",
    name: "SRE reviewer",
    userName: "Observability handoff",
    comment:
      "Health, metrics, rollback, and ownership are presented in a way non-specialists can scan.",
    rating: 5.0,
  },
  {
    image: "https://github.com/shadcn.png",
    name: "Product partner",
    userName: "Stakeholder demo",
    comment:
      "It feels like a real landing page, but still leaves the implementation simple enough for engineers to maintain.",
    rating: 5.0,
  },
  {
    image: "https://github.com/shadcn.png",
    name: "Release manager",
    userName: "LTS messaging",
    comment:
      "The production-ready story now matches the canonical docs instead of old gate artifacts.",
    rating: 4.9,
  },
];

export const TestimonialSection = () => {
  return (
    <section id="testimonials" className="container py-24 sm:py-32">
      <div className="text-center mb-8">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          Proof
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
          Built for technical stakeholders
        </h2>
      </div>

      <Carousel
        opts={{
          align: "start",
        }}
        className="relative w-[80%] sm:w-[90%] lg:max-w-screen-xl mx-auto"
      >
        <CarouselContent>
          {reviewList.map((review) => (
            <CarouselItem
              key={review.name}
              className="md:basis-1/2 lg:basis-1/3"
            >
              <Card className="bg-muted/50 dark:bg-card">
                <CardContent className="pt-6 pb-0">
                  <div className="flex gap-1 pb-6">
                    <Star className="size-4 fill-primary text-primary" />
                    <Star className="size-4 fill-primary text-primary" />
                    <Star className="size-4 fill-primary text-primary" />
                    <Star className="size-4 fill-primary text-primary" />
                    <Star className="size-4 fill-primary text-primary" />
                  </div>
                  {`"${review.comment}"`}
                </CardContent>

                <CardHeader>
                  <div className="flex flex-row items-center gap-4">
                    <Avatar>
                      <AvatarImage
                        src="https://avatars.githubusercontent.com/u/75042455?v=4"
                        alt="radix"
                      />
                      <AvatarFallback>SV</AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col">
                      <CardTitle className="text-lg">{review.name}</CardTitle>
                      <CardDescription>{review.userName}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </section>
  );
};
