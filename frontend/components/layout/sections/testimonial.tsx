"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../card";
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
    name: "Minh Nguyen",
    userName: "CTO @ VietTech",
    comment:
      "RustAT cut our mini app deployment time from hours to minutes. The integrated trading engine is a game-changer for our fintech products.",
    rating: 5.0,
  },
  {
    image: "https://github.com/shadcn.png",
    name: "Sarah Chen",
    userName: "VP Engineering @ ShopFlow",
    comment:
      "We migrated from Vercel and saved 40% on hosting costs. The edge network performance is outstanding.",
    rating: 4.8,
  },
  {
    image: "https://github.com/shadcn.png",
    name: "James Park",
    userName: "Head of Trading @ QuantFi",
    comment:
      "The Rust-based trading engine handles 50,000 orders per second with sub-millisecond latency. Nothing else comes close.",
    rating: 4.9,
  },
  {
    image: "https://github.com/shadcn.png",
    name: "Linh Tran",
    userName: "Product Lead @ MiniApp Studio",
    comment:
      "Deploying custom mini apps used to be painful. RustAT made it as simple as a git push.",
    rating: 5.0,
  },
  {
    image: "https://github.com/shadcn.png",
    name: "David Kim",
    userName: "DevOps Lead @ CloudScale",
    comment:
      "The unified dashboard for hosting, mini apps, and trading is exactly what our team needed. Zero context switching.",
    rating: 5.0,
  },
  {
    image: "https://github.com/shadcn.png",
    name: "Maria Santos",
    userName: "Founder @ TradeBot Labs",
    comment:
      "From prototype to production trading in 2 weeks. The backtesting tools and risk management are enterprise-grade.",
    rating: 4.9,
  },
];

export const TestimonialSection = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    let headerAnim: gsap.core.Tween | null = null;
    let carouselAnim: gsap.core.Tween | null = null;

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

    if (carouselRef.current) {
      carouselAnim = gsap.fromTo(
        carouselRef.current,
        { opacity: 0, y: 40, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: carouselRef.current,
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
      if (carouselAnim) {
        if (carouselAnim.scrollTrigger) carouselAnim.scrollTrigger.kill();
        carouselAnim.kill();
      }
    };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      y: -5,
      borderColor: "rgba(62, 207, 142, 0.3)", // Emerald border highlight
      boxShadow: "0 10px 20px -10px rgba(62, 207, 142, 0.15)",
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      y: 0,
      borderColor: "",
      boxShadow: "",
      duration: 0.4,
      ease: "power2.out",
    });
  };

  return (
    <section id="testimonials" className="container py-24 sm:py-32 overflow-hidden">
      <div ref={headerRef} className="text-center mb-8">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          Testimonials
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
          Trusted by 2,000+ Teams Worldwide
        </h2>
      </div>

      <div ref={carouselRef}>
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
                <Card
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className="bg-muted/50 dark:bg-card border border-secondary/50 dark:border-secondary/20 transition-all duration-300 cursor-pointer h-full"
                >
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
      </div>
    </section>
  );
};