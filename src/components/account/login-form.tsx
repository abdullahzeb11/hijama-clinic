"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestOtp, seedNameIfMissing } from "@/app/actions/customer";

type Step = "email" | "otp" | "name";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("Account.login");
  const router = useRouter();
  const locale = useLocale() as "ar" | "en";

  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function onRequestOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setPending(true);
    const res = await requestOtp({ email });
    setPending(false);
    if (!res.ok) {
      setError(t("invalidEmail"));
      return;
    }
    setStep("otp");
    setCooldown(30);
    if ("devCode" in res && res.devCode) setDevCode(res.devCode);
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("email-otp", {
      email,
      code,
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError(t("invalidCode"));
      return;
    }
    // Check whether this is a new user without a name yet.
    try {
      const sess = await fetch("/api/auth/session", { cache: "no-store" })
        .then((r) => r.json());
      if (sess?.user && (!sess.user.name || sess.user.name === sess.user.email)) {
        setStep("name");
        return;
      }
    } catch {
      // If the session fetch fails for any reason, fall through to dashboard.
    }
    router.push(next || `/${locale}/account`);
    router.refresh();
  }

  async function onSubmitName(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await seedNameIfMissing({ name });
    setPending(false);
    if (!res.ok) {
      setError(t("invalidName"));
      return;
    }
    router.push(next || `/${locale}/account`);
    router.refresh();
  }

  if (step === "email") {
    return (
      <form onSubmit={onRequestOtp} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("email")}
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            dir="ltr"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("sending")}
            </>
          ) : (
            <>
              {t("sendCode")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </>
          )}
        </Button>
      </form>
    );
  }

  if (step === "name") {
    return (
      <form onSubmit={onSubmitName} className="mt-8 space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("welcome")}
        </p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("yourName")}
          </span>
          <input
            type="text"
            required
            minLength={2}
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending || name.trim().length < 2}>
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              {t("finish")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onVerifyOtp} className="mt-8 space-y-4">
      <button
        type="button"
        onClick={() => {
          setStep("email");
          setCode("");
          setError(null);
          setDevCode(null);
        }}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        {t("changeEmail")}
      </button>

      <p className="text-sm text-muted-foreground">
        {t("sentTo", { email })}
      </p>

      {devCode ? (
        <div className="flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/5 px-3 py-2 text-xs text-foreground/80">
          <CheckCircle2 className="h-3.5 w-3.5 text-gold-foreground" />
          <span className="font-medium">Dev: </span>
          <code dir="ltr" className="font-mono tabular-nums">{devCode}</code>
        </div>
      ) : null}

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("code")}
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          pattern="[0-9]{6}"
          maxLength={6}
          dir="ltr"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl font-semibold tracking-[0.6em] tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={pending || code.length < 6}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("verifying")}
          </>
        ) : (
          <>
            {t("verify")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </>
        )}
      </Button>

      <button
        type="button"
        onClick={() => onRequestOtp()}
        disabled={cooldown > 0 || pending}
        className="inline-flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <RefreshCw className="h-3 w-3" />
        {cooldown > 0
          ? t("resendIn", { seconds: cooldown })
          : t("resend")}
      </button>
    </form>
  );
}

