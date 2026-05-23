import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "gold" | "primary";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 transition-shadow hover:shadow-soft",
        tone === "gold" && "border-gold/40",
        tone === "primary" && "border-primary/40",
        tone === "default" && "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg",
              tone === "gold" && "bg-gold/15 text-gold-foreground dark:text-gold",
              tone === "primary" && "bg-primary/10 text-primary",
              tone === "default" && "bg-muted text-foreground/70",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
        {typeof delta === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              delta >= 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400",
            )}
          >
            {delta >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(delta).toFixed(0)}%
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
