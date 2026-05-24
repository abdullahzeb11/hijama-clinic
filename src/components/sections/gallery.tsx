"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { SectionHeader } from "./section";
import { cn } from "@/lib/utils";

type Variant = "sunnah" | "sterile" | "privacy" | "home";

const CARDS: Array<{ id: string; variant: Variant }> = [
  { id: "1", variant: "sunnah" },
  { id: "2", variant: "sterile" },
  { id: "3", variant: "privacy" },
  { id: "4", variant: "home" },
];

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
          {CARDS.map((c, i) => (
            <Card
              key={c.id}
              variant={c.variant}
              title={t(`captions.${c.id}.title`)}
              detail={t(`captions.${c.id}.detail`)}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Card({
  variant,
  title,
  detail,
  index,
}: {
  variant: Variant;
  title: string;
  detail: string;
  index: number;
}) {
  const isInverted = variant === "sterile";
  return (
    <motion.figure
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative aspect-[3/4] overflow-hidden rounded-2xl border shadow-soft transition-shadow hover:shadow-elevated",
        isInverted
          ? "border-gold/40 bg-gradient-to-br from-gold-soft via-gold to-gold-soft"
          : "border-primary/30 bg-gradient-to-br from-primary-deep via-primary to-primary-deep",
      )}
    >
      <PatternFor variant={variant} />

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-1/2",
          isInverted
            ? "bg-gradient-to-t from-[hsl(168,80%,8%)]/65 via-[hsl(168,80%,8%)]/15 to-transparent"
            : "bg-gradient-to-t from-black/55 via-black/15 to-transparent",
        )}
      />

      <figcaption
        className={cn(
          "absolute inset-x-0 bottom-0 p-5 sm:p-6",
          isInverted ? "text-[hsl(168,80%,8%)]" : "text-white",
        )}
      >
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.18em]",
            isInverted ? "text-[hsl(168,80%,12%)]/80" : "text-gold",
          )}
        >
          {detail}
        </p>
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-tight balance sm:text-xl">
          {title}
        </h3>
        <div
          className={cn(
            "mt-3 h-px w-8 transition-all duration-500 group-hover:w-14",
            isInverted ? "bg-[hsl(168,80%,8%)]/60" : "bg-gold/70 group-hover:bg-gold",
          )}
        />
      </figcaption>
    </motion.figure>
  );
}

function PatternFor({ variant }: { variant: Variant }) {
  switch (variant) {
    case "sunnah":
      return <SunnahPattern />;
    case "sterile":
      return <SterilePattern />;
    case "privacy":
      return <PrivacyPattern />;
    case "home":
      return <HomePattern />;
  }
}

function SunnahPattern() {
  return (
    <svg viewBox="0 0 200 280" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="g-sunnah" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="280" fill="url(#g-sunnah)" />
      <g transform="translate(100 110)" stroke="hsl(var(--gold))" strokeOpacity="0.25" fill="none">
        {[28, 44, 62, 82].map((r, i) => (
          <circle key={r} r={r} strokeDasharray={i % 2 ? "2 4" : "1 5"} />
        ))}
      </g>
      <g transform="translate(100 110)" stroke="hsl(var(--gold))" strokeWidth="1.2" strokeOpacity="0.95" fill="hsl(var(--gold) / 0.10)">
        <rect x="-32" y="-32" width="64" height="64" />
        <rect x="-32" y="-32" width="64" height="64" transform="rotate(45)" fillOpacity="0.18" />
      </g>
      <g transform="translate(100 200)" fill="hsl(var(--gold) / 0.45)">
        <path d="M -14 0 A 14 14 0 1 0 14 0 A 11 11 0 1 1 -14 0 Z" />
      </g>
    </svg>
  );
}

function SterilePattern() {
  const rows = 7;
  const cols = 5;
  const w = 200;
  const h = 280;
  const hexR = 22;
  const dx = hexR * Math.sqrt(3);
  const dy = hexR * 1.5;
  const hexPath = `M 0 -${hexR} L ${dx / 2} -${hexR / 2} L ${dx / 2} ${hexR / 2} L 0 ${hexR} L -${dx / 2} ${hexR / 2} L -${dx / 2} -${hexR / 2} Z`;
  const cells: Array<{ x: number; y: number; key: string }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * dx + (r % 2 ? dx / 2 : 0) + 10;
      const y = r * dy + 20;
      if (x < w + dx && y < h + dy) cells.push({ x, y, key: `${r}-${c}` });
    }
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" aria-hidden>
      <g stroke="hsl(168 80% 8%)" strokeOpacity="0.45" strokeWidth="0.8" fill="hsl(168 80% 8% / 0.06)">
        {cells.map((c) => (
          <path key={c.key} d={hexPath} transform={`translate(${c.x} ${c.y})`} />
        ))}
      </g>
      <g transform="translate(100 110)">
        <circle r="32" fill="hsl(168 80% 8% / 0.85)" />
        <circle r="26" fill="none" stroke="hsl(var(--gold))" strokeWidth="0.8" strokeOpacity="0.6" />
        <path d="M -10 0 L -4 6 L 12 -8" stroke="hsl(var(--gold))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

function PrivacyPattern() {
  return (
    <svg viewBox="0 0 200 280" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="g-arch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0.18" />
          <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0" />
        </linearGradient>
        <pattern id="p-arch-stars" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r="0.8" fill="hsl(var(--gold) / 0.4)" />
        </pattern>
      </defs>
      <path d="M 50 240 L 50 110 Q 50 50 100 50 Q 150 50 150 110 L 150 240 Z" fill="url(#g-arch)" stroke="hsl(var(--gold))" strokeWidth="1.2" strokeOpacity="0.7" />
      <path d="M 50 240 L 50 110 Q 50 50 100 50 Q 150 50 150 110 L 150 240" fill="url(#p-arch-stars)" opacity="0.6" />
      <path d="M 32 250 L 32 100 Q 32 32 100 32 Q 168 32 168 100 L 168 250" fill="none" stroke="hsl(var(--gold))" strokeWidth="0.6" strokeOpacity="0.4" strokeDasharray="3 3" />
      <g transform="translate(100 88)" stroke="hsl(var(--gold))" strokeWidth="1" strokeOpacity="0.9" fill="hsl(var(--gold) / 0.12)">
        <rect x="-9" y="-9" width="18" height="18" />
        <rect x="-9" y="-9" width="18" height="18" transform="rotate(45)" />
      </g>
      <line x1="20" y1="250" x2="180" y2="250" stroke="hsl(var(--gold))" strokeOpacity="0.5" strokeWidth="1" />
    </svg>
  );
}

function HomePattern() {
  return (
    <svg viewBox="0 0 200 280" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="g-home" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="280" fill="url(#g-home)" />
      <g transform="translate(100 130)" stroke="hsl(var(--gold))" strokeOpacity="0.35" fill="none">
        {Array.from({ length: 14 }).map((_, i) => (
          <circle key={i} r={18 + i * 6} strokeDasharray={i % 2 === 0 ? "1 4" : "2 4"} />
        ))}
      </g>
      <g transform="translate(100 130)" stroke="hsl(var(--gold))" strokeWidth="1" strokeOpacity="0.75" fill="hsl(var(--gold) / 0.08)">
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse key={i} cx="0" cy="-44" rx="6" ry="22" transform={`rotate(${i * 30})`} />
        ))}
        <circle r="10" fill="hsl(var(--gold) / 0.35)" stroke="none" />
      </g>
    </svg>
  );
}
