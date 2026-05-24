import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { GithubIcon } from "@/components/ui/icon";

export const HeroSection = () => {
  return (
    <section className="container w-full">
      <div className="grid place-items-center lg:max-w-screen-xl gap-8 mx-auto py-20 md:py-32">
        <div className="text-center flex flex-col gap-8">
          <div className="max-w-screen-md mx-auto text-center text-3xl sm:text-4xl md:text-6xl font-bold">
            <h1 className="leading-tight">
              <span className="block md:inline">RustAlgorithm</span>
              <span className="block md:inline">Trading</span>
              <span className="block md:inline text-transparent md:px-2 bg-gradient-to-r from-[#D247BF] to-primary bg-clip-text">
                made simple
              </span>
            </h1>
          </div>

          <p className="max-w-screen-sm mx-auto text-xl text-muted-foreground">
            A clean Next.js landing template for the hybrid trading stack:
            Python research, Rust runtime, Go observability, and a path from
            paper validation to production readiness.
          </p>

          <div className="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2 mx-auto">
            <Button asChild className="w-full font-bold group/arrow">
              <Link href="#pricing">
                Start in minutes
                <ArrowRight
                  data-icon="inline-end"
                  className="group-hover/arrow:translate-x-1 transition-transform"
                />
              </Link>
            </Button>

            <Button
              asChild
              variant="secondary"
              className="w-full font-bold"
            >
              <Link
                href="https://github.com/SamoraDC/RustAlgorithmTrading"
                target="_blank"
              >
                <GithubIcon className="mr-2 h-4 w-4" data-icon="inline-start" />
                View GitHub
              </Link>
            </Button>
          </div>
        </div>

        <TradingPreview />
      </div>
    </section>
  );
};

const chartBars = [48, 66, 44, 74, 58, 86, 62, 92, 72, 78, 68, 96];

const TradingPreview = () => {
  return (
    <div className="relative mt-14 w-full max-w-6xl">
      <div className="absolute top-2 lg:-top-8 left-1/2 h-24 w-[90%] -translate-x-1/2 rounded-full bg-primary/40 blur-3xl lg:h-80" />
      <div className="relative overflow-hidden rounded-lg border border-t-2 border-secondary border-t-primary/30 bg-card shadow-2xl shadow-primary/10">
        <div className="flex items-center justify-between border-b border-secondary px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-destructive" />
            <div className="size-3 rounded-full bg-primary" />
            <div className="size-3 rounded-full bg-accent" />
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Live trading cockpit
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[240px_1fr]">
          <aside className="hidden border-r border-secondary bg-muted/40 p-5 lg:block">
            <div className="mb-6 text-sm font-semibold text-muted-foreground">
              Runtime
            </div>
            {["Market data", "Signal bridge", "Risk manager", "Execution"].map(
              (item, index) => (
                <div
                  key={item}
                  className="mb-3 flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm"
                >
                  <span>{item}</span>
                  <span
                    className={
                      index === 2
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {index === 2 ? "armed" : "live"}
                  </span>
                </div>
              )
            )}
          </aside>

          <div className="p-4 sm:p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["P99 latency", "18ms", "Go API"],
                ["Risk state", "Clear", "pre-trade"],
                ["Signals", "42", "last hour"],
              ].map(([label, value, meta]) => (
                <div
                  key={label}
                  className="rounded-md border border-secondary bg-background p-4"
                >
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-bold">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="rounded-md border border-secondary bg-background p-4">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">SPY signal stream</p>
                    <p className="text-sm text-muted-foreground">
                      Momentum confirmation with risk gate overlay
                    </p>
                  </div>
                  <Activity className="text-primary" />
                </div>
                <div className="flex h-56 items-end gap-2">
                  {chartBars.map((height, index) => (
                    <div
                      key={`${height}-${index}`}
                      className="flex flex-1 items-end rounded-sm bg-muted"
                      style={{ height: `${height}%` }}
                    >
                      <div
                        className="w-full rounded-sm bg-gradient-to-t from-primary to-cyan-300"
                        style={{ height: `${Math.max(height - 18, 20)}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-secondary bg-background p-4">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-primary" />
                  <p className="font-semibold">Execution checks</p>
                </div>
                {[
                  ["Exposure limit", "pass"],
                  ["Circuit breaker", "idle"],
                  ["Order route", "paper"],
                  ["Correlation id", "attached"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="mb-3 flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-sm"
                  >
                    <span>{label}</span>
                    <span className="font-medium text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-20 w-full bg-gradient-to-b from-background/0 via-background/50 to-background" />
      </div>
    </div>
  );
};
