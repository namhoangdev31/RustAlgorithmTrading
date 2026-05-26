"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../card";
import { Building2, Clock, Mail, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  firstName: z.string().min(2).max(255),
  lastName: z.string().min(2).max(255),
  email: z.string().email(),
  subject: z.string().min(2).max(255),
  message: z.string(),
});

export const ContactSection = () => {
  const leftColRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      subject: "Web Development",
      message: "",
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    let leftAnim: gsap.core.Tween | null = null;
    let cardAnim: gsap.core.Tween | null = null;

    if (leftColRef.current) {
      leftAnim = gsap.fromTo(
        leftColRef.current.children,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: leftColRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    if (cardRef.current) {
      cardAnim = gsap.fromTo(
        cardRef.current,
        { opacity: 0, x: 30, scale: 0.98 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }

    return () => {
      if (leftAnim) {
        if (leftAnim.scrollTrigger) leftAnim.scrollTrigger.kill();
        leftAnim.kill();
      }
      if (cardAnim) {
        if (cardAnim.scrollTrigger) cardAnim.scrollTrigger.kill();
        cardAnim.kill();
      }
    };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      y: -4,
      borderColor: "rgba(62, 207, 142, 0.3)", // Emerald green border
      boxShadow: "0 15px 30px -15px rgba(62, 207, 142, 0.15)",
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { firstName, lastName, email, subject, message } = values;
    console.log(values);

    const mailToLink = `mailto:leomirandadev@gmail.com?subject=${subject}&body=Hello I am ${firstName} ${lastName}, my Email is ${email}. %0D%0A${message}`;

    window.location.href = mailToLink;
  }

  return (
    <section id="contact" className="container py-24 sm:py-32 overflow-hidden">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div ref={leftColRef}>
          <div className="mb-4">
            <h2 className="text-lg text-primary mb-2 tracking-wider">
              Contact
            </h2>

            <h2 className="text-3xl md:text-4xl font-bold">Connect With Us</h2>
          </div>
          <p className="mb-8 text-muted-foreground lg:w-5/6">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatum
            ipsam sint enim exercitationem ex autem corrupti quas tenetur
          </p>

          <div className="flex flex-col gap-4">
            <div className="info-item">
              <div className="flex gap-2 mb-1">
                <Building2 className="text-primary" />
                <div className="font-bold">Find us</div>
              </div>

              <div>742 Evergreen Terrace, Springfield, IL 62704</div>
            </div>

            <div className="info-item">
              <div className="flex gap-2 mb-1">
                <Phone className="text-primary" />
                <div className="font-bold">Call us</div>
              </div>

              <div>+1 (619) 123-4567</div>
            </div>

            <div className="info-item">
              <div className="flex gap-2 mb-1">
                <Mail className="text-primary" />
                <div className="font-bold">Mail US</div>
              </div>

              <div>leomirandadev@gmail.com</div>
            </div>

            <div className="info-item">
              <div className="flex gap-2">
                <Clock className="text-primary" />
                <div className="font-bold">Visit us</div>
              </div>

              <div>
                <div>Monday - Friday</div>
                <div>8AM - 4PM</div>
              </div>
            </div>
          </div>
        </div>

        <div ref={cardRef}>
          <Card
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="bg-muted/60 dark:bg-card border border-secondary/50 dark:border-secondary/20 transition-all duration-300"
          >
            <CardHeader className="text-primary text-2xl"> </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid w-full gap-4"
                >
                  <div className="flex flex-col md:!flex-row gap-8">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Leopoldo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Miranda" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="leomirandadev@gmail.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Web Development">
                                Web Development
                              </SelectItem>
                              <SelectItem value="Mobile Development">
                                Mobile Development
                              </SelectItem>
                              <SelectItem value="Figma Design">
                                Figma Design
                              </SelectItem>
                              <SelectItem value="REST API">REST API</SelectItem>
                              <SelectItem value="FullStack Project">
                                FullStack Project
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={5}
                              placeholder="Your message..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button className="mt-4">Send message</Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter></CardFooter>
          </Card>
        </div>
      </section>
    </section>
  );
};