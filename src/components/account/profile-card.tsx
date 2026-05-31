"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Save, Loader2, Check } from "lucide-react";
import { updateProfile } from "@/app/actions/customer";
import { cn } from "@/lib/utils";

export function ProfileCard({
  initial,
}: {
  initial: { name: string; email: string; phone: string; city: string };
}) {
  const t = useTranslations("Account.profile");
  const [name, setName] = React.useState(initial.name);
  const [phone, setPhone] = React.useState(initial.phone);
  const [city, setCity] = React.useState(initial.city);
  const [pending, startTransition] = React.useTransition();
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  const dirty =
    name !== initial.name ||
    phone !== initial.phone ||
    city !== initial.city;

  function save() {
    startTransition(async () => {
      await updateProfile({ name, phone, city });
      setSavedAt(Date.now());
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{t("title")}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || pending}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
            dirty
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : savedAt && !dirty ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {pending ? t("saving") : savedAt && !dirty ? t("saved") : t("save")}
        </button>
      </header>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label={t("name")}
          value={name}
          onChange={setName}
          autoComplete="name"
        />
        <Field
          label={t("email")}
          value={initial.email}
          onChange={() => {}}
          readOnly
          dir="ltr"
          type="email"
          hint={t("emailLocked")}
        />
        <Field
          label={t("phone")}
          value={phone}
          onChange={setPhone}
          type="tel"
          dir="ltr"
          autoComplete="tel"
        />
        <Field
          label={t("city")}
          value={city}
          onChange={setCity}
          autoComplete="address-level2"
        />
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  dir,
  readOnly,
  hint,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  dir?: "ltr" | "rtl";
  readOnly?: boolean;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        dir={dir}
        readOnly={readOnly}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={cn(
          "block w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          readOnly && "bg-muted/40 text-muted-foreground",
        )}
      />
      {hint ? (
        <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
