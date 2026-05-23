"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, UserRound } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { LogoWordmark } from "@/components/brand/logo";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function Navbar({ isSignedIn = false }: { isSignedIn?: boolean }) {
  const t = useTranslations("Nav");
  const locale = useLocale() as "ar" | "en";
  const [scrolled, setScrolled] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="container-wide flex h-[72px] items-center justify-between gap-4">
        <Link href="/" aria-label={siteConfig.brand.shortEn}>
          <LogoWordmark locale={locale} />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {siteConfig.nav.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {t(item.key)}
              </Link>
            ) : (
              <a
                key={item.key}
                href={item.href}
                className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {t(item.key)}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          {isSignedIn ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex rounded-full"
              aria-label={t("account")}
            >
              <Link href="/account">
                <UserRound className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
            >
              <Link href="/account/login">{t("signIn")}</Link>
            </Button>
          )}
          <Button
            asChild
            variant="gold"
            size="sm"
            className="hidden md:inline-flex"
          >
            <Link href="/book">{t("book")}</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={t("openMenu")}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={locale === "ar" ? "left" : "right"} className="w-[88%] max-w-sm">
              <SheetHeader>
                <SheetTitle>
                  <LogoWordmark locale={locale} />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-1">
                {siteConfig.nav.map((item) => (
                  <SheetClose asChild key={item.key}>
                    {item.href.startsWith("/") ? (
                      <Link
                        href={item.href}
                        className="rounded-xl px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        {t(item.key)}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="rounded-xl px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        {t(item.key)}
                      </a>
                    )}
                  </SheetClose>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <SheetClose asChild>
                  <Button asChild variant="gold" size="lg">
                    <Link href="/book">{t("book")}</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild variant="outline" size="lg">
                    <Link href={isSignedIn ? "/account" : "/account/login"}>
                      <UserRound className="h-4 w-4" />
                      {isSignedIn ? t("account") : t("signIn")}
                    </Link>
                  </Button>
                </SheetClose>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-2">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
