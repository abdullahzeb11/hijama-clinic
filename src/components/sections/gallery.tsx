"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { SectionHeader } from "./section";
import { cn } from "@/lib/utils";

/**
 * Real before/after slider — both sides show actual photos.
 * Each card pairs a "before" (plain back/skin) with an "after" (cupping
 * marks). Drag the handle to compare. Hue fallback gradients render only
 * if a photo URL fails to load (graceful degradation).
 */
const PAIRS = [
  {
    id: 1,
    beforeUrl:
      "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=900&auto=format&fit=crop&q=60",
    afterUrl:
      "https://plus.unsplash.com/premium_photo-1712588406397-89e673061467?w=900&auto=format&fit=crop&q=60",
    hueA: "168 30% 18%",
    hueB: "168 65% 38%",
  },
  {
    id: 2,
    beforeUrl:
      "https://plus.unsplash.com/premium_photo-1681873742740-9a0e9eaa4584?w=900&auto=format&fit=crop&q=60",
    afterUrl:
      "https://plus.unsplash.com/premium_photo-1712588405834-4762fb74cea9?w=900&auto=format&fit=crop&q=60",
    hueA: "165 45% 22%",
    hueB: "41 60% 55%",
  },
  {
    id: 3,
    beforeUrl:
      "https://images.unsplash.com/photo-1657800187914-682b18440d50?w=900&auto=format&fit=crop&q=60",
    afterUrl:
      "https://plus.unsplash.com/premium_photo-1712592055520-852d0ef3e40f?w=900&auto=format&fit=crop&q=60",
    hueA: "168 28% 16%",
    hueB: "168 55% 32%",
  },
  {
    id: 4,
    beforeUrl:
      "https://plus.unsplash.com/premium_photo-1711610268817-2d6a57c2bcb7?w=900&auto=format&fit=crop&q=60",
    afterUrl:
      "https://plus.unsplash.com/premium_photo-1712592055468-f55ec9406afd?w=900&auto=format&fit=crop&q=60",
    hueA: "165 35% 20%",
    hueB: "41 50% 60%",
  },
] as const;

export function Gallery() {
  const t = useTranslations("Gallery");

  return (
    <section id="gallery" className="relative py-16 sm:py-24 lg:py-28">
      <div className="container-wide">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {PAIRS.map((p, i) => (
            <BeforeAfterCard
              key={p.id}
              beforeUrl={p.beforeUrl}
              afterUrl={p.afterUrl}
              hueA={p.hueA}
              hueB={p.hueB}
              index={i}
              beforeLabel={t("before")}
              afterLabel={t("after")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function BeforeAfterCard({
  beforeUrl,
  afterUrl,
  hueA,
  hueB,
  index,
  beforeLabel,
  afterLabel,
}: {
  beforeUrl: string;
  afterUrl: string;
  hueA: string;
  hueB: string;
  index: number;
  beforeLabel: string;
  afterLabel: string;
}) {
  const [pos, setPos] = React.useState(50);
  const [beforeOk, setBeforeOk] = React.useState(Boolean(beforeUrl));
  const [afterOk, setAfterOk] = React.useState(Boolean(afterUrl));
  const ref = React.useRef<HTMLDivElement>(null);

  const onMove = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.06 }}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
    >
      <div
        ref={ref}
        className="relative h-full w-full cursor-ew-resize select-none touch-none"
        onMouseMove={(e) => onMove(e.clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
      >
        {/* AFTER base layer — the real cupping photo (with gradient fallback) */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, hsl(${hueB}) 0%, hsl(${hueA}) 100%)`,
          }}
        >
          <CardFiligree variant="after" />
          {afterOk && afterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={afterUrl}
              alt=""
              loading="lazy"
              onError={() => setAfterOk(false)}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          ) : null}
        </div>

        {/* BEFORE overlay — real photo (with gradient fallback), clipped by slider */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, hsl(${hueA}) 0%, hsl(${hueA}) 100%)`,
            clipPath: `polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)`,
          }}
        >
          {beforeOk && beforeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={beforeUrl}
              alt=""
              loading="lazy"
              onError={() => setBeforeOk(false)}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <CardFiligree variant="before" />
          )}
        </div>

        {/* Slider handle */}
        <div
          className="absolute inset-y-0 z-10 flex w-px items-center justify-center bg-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
          style={{ insetInlineStart: `${pos}%` }}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary-deep shadow-elevated transition-transform group-hover:scale-110",
            )}
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
              <path
                d="M5 4L2 8l3 4M11 4l3 4-3 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <span className="absolute start-3 top-3 z-20 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
          {beforeLabel}
        </span>
        <span className="absolute end-3 top-3 z-20 rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-foreground">
          {afterLabel}
        </span>
      </div>
    </motion.div>
  );
}

function CardFiligree({ variant }: { variant: "before" | "after" }) {
  return (
    <svg
      className={cn(
        "absolute inset-0 h-full w-full",
        variant === "before" ? "text-white/8" : "text-white/15",
      )}
      viewBox="0 0 200 280"
      fill="none"
      aria-hidden
    >
      <g stroke="currentColor" strokeWidth="0.5" opacity="0.8">
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={i} cx="100" cy="140" r={20 + i * 16} />
        ))}
      </g>
      <g transform="translate(100 140)" fill="currentColor" opacity="0.25">
        <rect x="-26" y="-26" width="52" height="52" />
        <rect x="-26" y="-26" width="52" height="52" transform="rotate(45)" />
      </g>
    </svg>
  );
}
