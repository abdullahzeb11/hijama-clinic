"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ShieldCheck, Sparkles, CalendarCheck, Star, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";
import { waLink } from "@/lib/utils";

export function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative overflow-hidden pt-10 sm:pt-16 lg:pt-20">
      {/* Decorative arabesque + glow */}
      <div className="absolute inset-0 -z-10 arabesque opacity-50" />
      <div className="absolute inset-x-0 -top-32 -z-10 h-[520px] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.18),transparent_60%)]" />
      <div className="absolute end-[-15%] top-[-10%] -z-10 h-[480px] w-[480px] rounded-full bg-gold/10 blur-3xl" />

      <div className="container-wide grid items-center gap-10 pb-12 sm:gap-12 sm:pb-16 lg:grid-cols-12 lg:gap-8 lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-medium text-gold-foreground dark:text-gold">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            {t("eyebrow")}
          </div>

          <h1 className="mt-5 text-display-xl balance sm:mt-6 sm:text-display-2xl">
            {t("title")}{" "}
            <span className="text-gold-leaf">{t("titleAccent")}</span>
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            {t("subtitle")}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
            <Button asChild variant="gold" size="lg">
              <Link href="/book">
                {t("ctaBook")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a
                href={waLink(
                  siteConfig.contact.whatsappNumber,
                  "As-salamu alaykum, I'd like to book a hijama appointment.",
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("ctaWhatsapp")}
              </a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <TrustChip icon={<ShieldCheck className="h-4 w-4" />} label={t("trust1")} />
            <TrustChip icon={<Sparkles className="h-4 w-4" />} label={t("trust2")} />
            <TrustChip icon={<CalendarCheck className="h-4 w-4" />} label={t("trust3")} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative lg:col-span-5"
        >
          <HeroCard />
        </motion.div>
      </div>

      <div className="hairline" />
      <StatsStrip />
    </section>
  );
}

function TrustChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 backdrop-blur">
      <span className="text-primary">{icon}</span>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  );
}

function HeroCard() {
  const t = useTranslations("Hero");
  return (
    <div className="relative mx-auto mb-8 aspect-[4/5] max-w-[320px] sm:mb-0 sm:max-w-md">
      {/* Outer glass card with arabesque pattern */}
      <div className="absolute inset-0 glass rounded-[2rem] p-2">
        <div className="relative h-full w-full overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-primary-deep via-primary to-primary-deep">
          {/* Arabesque + grain */}
          <div className="absolute inset-0 arabesque opacity-30 [mask-image:radial-gradient(circle_at_30%_20%,black,transparent_70%)]" />

          {/* Calligraphic accent — large star mark watermark */}
          <svg
            className="absolute -end-12 -top-12 h-72 w-72 text-gold/20"
            viewBox="0 0 48 48"
            fill="currentColor"
          >
            <g transform="translate(24 24)">
              <rect x="-16" y="-16" width="32" height="32" rx="3" />
              <rect x="-16" y="-16" width="32" height="32" rx="3" transform="rotate(45)" opacity="0.6" />
            </g>
          </svg>

          {/* Floating stat tiles */}
          <FloatingTile
            position="top-6 start-6"
            value={t("stat2Value")}
            label={t("stat2Label")}
            delay={0.4}
          />
          <FloatingTile
            position="bottom-6 end-6"
            value={t("stat1Value")}
            label={t("stat1Label")}
            delay={0.6}
            highlight
          />
          <FloatingTile
            position="top-1/2 -translate-y-1/2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2"
            value={t("stat3Value")}
            label={t("stat3Label")}
            delay={0.5}
            rating
          />
        </div>
      </div>

      {/* Rating chip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute -bottom-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-background px-4 py-2 text-xs font-medium shadow-elevated"
      >
        <span className="inline-flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
          {t("ratingLabel", { rating: "4.9", count: "7,200" })}
        </span>
      </motion.div>
    </div>
  );
}

function FloatingTile({
  position,
  value,
  label,
  delay,
  highlight = false,
  rating = false,
}: {
  position: string;
  value: string;
  label: string;
  delay: number;
  highlight?: boolean;
  rating?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute ${position} animate-float`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className={`min-w-[100px] rounded-xl border border-white/15 px-3 py-2.5 backdrop-blur-xl sm:min-w-[120px] sm:rounded-2xl sm:px-4 sm:py-3 ${
          highlight
            ? "bg-gold/95 text-gold-foreground"
            : "bg-white/10 text-white"
        }`}
      >
        <div className="flex items-center gap-1.5">
          {rating ? <Star className="h-3.5 w-3.5 fill-gold text-gold" /> : null}
          <p className="text-base font-semibold leading-none sm:text-lg">{value}</p>
        </div>
        <p className="mt-1 text-[10px] uppercase tracking-wider opacity-80 sm:text-[11px]">
          {label}
        </p>
      </div>
    </motion.div>
  );
}

function StatsStrip() {
  const t = useTranslations("Hero");
  const stats = [
    { v: t("stat1Value"), l: t("stat1Label") },
    { v: t("stat2Value"), l: t("stat2Label") },
    { v: t("stat3Value"), l: t("stat3Label") },
  ];
  return (
    <div className="container-wide py-8 sm:py-10">
      <dl className="grid grid-cols-3 gap-3 sm:gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="text-center sm:text-start"
          >
            <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
              {s.l}
            </dt>
            <dd className="mt-1.5 text-xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-3xl lg:text-4xl">
              {s.v}
            </dd>
          </motion.div>
        ))}
      </dl>
    </div>
  );
}
