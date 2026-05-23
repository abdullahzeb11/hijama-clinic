"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type Step = { key: string; label: string };

export function ProgressRail({
  steps,
  current,
}: {
  steps: Step[];
  current: number;
}) {
  return (
    <ol className="flex w-full items-center gap-2">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-gold bg-gold/15 text-gold-foreground shadow-glow dark:text-gold"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                {active ? (
                  <motion.span
                    layoutId="step-ring"
                    className="absolute inset-0 rounded-full ring-2 ring-gold/40"
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium uppercase tracking-wider sm:inline",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <div
                className={cn(
                  "h-px flex-1 transition-colors",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
