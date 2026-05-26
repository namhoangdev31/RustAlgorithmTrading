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
import { useTranslations } from "next-intl";

const formSchema = z.object({
  firstName: z.string().min(2).max(255),
  lastName: z.string().min(2).max(255),
  email: z.string().email(),
  subject: z.string().min(2).max(255),
  message: z.string(),
});

export const ContactSection = () => {
  const t = useTranslations("Contact");
  const leftColRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      subject: "Mini App Deployment",
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
              {t("section_title")}
            </h2>

            <h2 className="text-3xl md:text-4xl font-bold">{t("main_title")}</h2>
          </div>
          <p className="mb-8 text-muted-foreground lg:w-5/6">
            {t("description")}
          </p>

          <div className="flex flex-col gap-4">
            <div className="info-item">
              <div className="flex gap-2 mb-1">
                <Building2 className="text-primary" />
                <div className="font-bold">{t("find_us")}</div>
              </div>

              <div>742 Evergreen Terrace, Springfield, IL 62704</div>
            </div>

            <div className="info-item">
              <div className="flex gap-2 mb-1">
                <Phone className="text-primary" />
                <div className="font-bold">{t("call_us")}</div>
              </div>

              <div>+1 (619) 123-4567</div>
            </div>

            <div className="info-item">
              <div className="flex gap-2 mb-1">
                <Mail className="text-primary" />
                <div className="font-bold">{t("mail_us")}</div>
              </div>

              <div>leomirandadev@gmail.com</div>
            </div>

            <div className="info-item">
              <div className="flex gap-2">
                <Clock className="text-primary" />
                <div className="font-bold">{t("visit_us")}</div>
              </div>

              <div>
                <div>{t("monday_friday")}</div>
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
                          <FormLabel>{t("first_name")}</FormLabel>
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
                          <FormLabel>{t("last_name")}</FormLabel>
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
                          <FormLabel>{t("email")}</FormLabel>
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
                          <FormLabel>{t("subject")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("subject_placeholder")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mini App Deployment">
                                {t("subject_deployment")}
                              </SelectItem>
                              <SelectItem value="Web Hosting">
                                {t("subject_hosting")}
                              </SelectItem>
                              <SelectItem value="Trading Engine">
                                {t("subject_trading")}
                              </SelectItem>
                              <SelectItem value="Enterprise Plan">
                                {t("subject_enterprise")}
                              </SelectItem>
                              <SelectItem value="Partnership">
                                {t("subject_partnership")}
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
                          <FormLabel>{t("message")}</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={5}
                              placeholder={t("message_placeholder")}
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button className="mt-4">{t("send_button")}</Button>
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