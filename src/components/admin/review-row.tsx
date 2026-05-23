"use client";

import * as React from "react";
import { Star, Check, X, Pin, Loader2, Trash2 } from "lucide-react";
import { updateReview, deleteReview } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  approved: boolean;
  featured: boolean;
  createdAt: string;
};

export function ReviewRow(initial: Props) {
  const [approved, setApproved] = React.useState(initial.approved);
  const [featured, setFeatured] = React.useState(initial.featured);
  const [pending, startTransition] = React.useTransition();

  function toggle(next: { approved?: boolean; featured?: boolean }) {
    startTransition(async () => {
      const merged = { approved, featured, ...next };
      await updateReview({ id: initial.id, ...next });
      setApproved(merged.approved);
      setFeatured(merged.featured);
    });
  }

  function remove() {
    if (!confirm("Delete this review permanently?")) return;
    startTransition(async () => {
      await deleteReview(initial.id);
    });
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{initial.authorName}</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                approved
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-gold/15 text-gold-foreground dark:text-gold",
              )}
            >
              {approved ? "Approved" : "Pending"}
            </span>
            {featured ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Featured
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < initial.rating ? "fill-gold text-gold" : "text-muted-foreground/40",
                )}
              />
            ))}
            <span className="ms-2 text-[11px] text-muted-foreground">
              {new Date(initial.createdAt).toLocaleDateString("en-SA", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
          <button
            type="button"
            onClick={() => toggle({ approved: !approved })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
              approved
                ? "border border-border bg-card hover:bg-accent"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {approved ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
            {approved ? "Unapprove" : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => toggle({ featured: !featured })}
            disabled={!approved}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              featured
                ? "border-gold bg-gold/10 text-gold-foreground dark:text-gold"
                : "border-border hover:bg-accent",
              !approved && "cursor-not-allowed opacity-40",
            )}
          >
            <Pin className="h-3.5 w-3.5" />
            {featured ? "Unfeature" : "Feature"}
          </button>
          <button
            type="button"
            onClick={remove}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete review"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <p className="mt-4 text-sm leading-relaxed text-foreground/85">{initial.body}</p>
    </article>
  );
}
