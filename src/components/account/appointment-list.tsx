"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Home,
  Building2,
  XCircle,
  RotateCcw,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { StepDateTime } from "@/components/booking/step-datetime";
import {
  cancelMyAppointment,
  rescheduleMyAppointment,
} from "@/app/actions/customer";
import { cn, formatSAR } from "@/lib/utils";

export type CustomerAppointment = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  scheduledAt: string;
  durationMin: number;
  priceSar: number;
  location: "CLINIC" | "HOME_VISIT";
  addressLine: string | null;
  serviceNameEn: string;
  serviceNameAr: string;
};

export function AppointmentList({
  appointments,
  emptyLabel,
}: {
  appointments: CustomerAppointment[];
  emptyLabel: string;
}) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
        <Calendar className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      {appointments.map((a) => (
        <AppointmentCard key={a.id} a={a} />
      ))}
    </div>
  );
}

function AppointmentCard({ a }: { a: CustomerAppointment }) {
  const t = useTranslations("Account.dashboard");
  const locale = useLocale() as "ar" | "en";
  const [pending, startTransition] = React.useTransition();
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isActive = a.status === "PENDING" || a.status === "CONFIRMED";
  const isFuture = new Date(a.scheduledAt) > new Date();

  function onCancel() {
    setError(null);
    startTransition(async () => {
      const res = await cancelMyAppointment(a.id);
      if (!res.ok) setError(res.error ?? t("cancelError"));
      setConfirmCancel(false);
    });
  }

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-5 transition-all",
        isActive ? "border-border" : "border-border/60 opacity-80",
      )}
    >
      {pending ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">
              {locale === "ar" ? a.serviceNameAr : a.serviceNameEn}
            </h3>
            <StatusPill status={a.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("reference")} ·{" "}
            <span dir="ltr" className="font-mono">
              {a.id.slice(-8).toUpperCase()}
            </span>
          </p>
        </div>
        <p className="text-lg font-semibold tabular-nums">
          {formatSAR(a.priceSar, locale)}
        </p>
      </div>

      <dl className="mt-4 grid gap-2 sm:grid-cols-3">
        <Row icon={<Calendar className="h-3.5 w-3.5" />}>
          {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "Asia/Riyadh",
          }).format(new Date(a.scheduledAt))}
        </Row>
        <Row icon={<Clock className="h-3.5 w-3.5" />}>
          <span dir="ltr">
            {new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Riyadh",
            }).format(new Date(a.scheduledAt))}
          </span>
          <span className="ms-1 text-muted-foreground">· {a.durationMin}m</span>
        </Row>
        <Row
          icon={
            a.location === "HOME_VISIT" ? (
              <Home className="h-3.5 w-3.5" />
            ) : (
              <Building2 className="h-3.5 w-3.5" />
            )
          }
        >
          {a.location === "HOME_VISIT"
            ? a.addressLine ?? t("home")
            : t("clinic")}
        </Row>
      </dl>

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {isActive && isFuture ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Dialog.Root open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
            <Dialog.Trigger asChild>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-3.5 w-3.5" />
                {t("reschedule")}
              </Button>
            </Dialog.Trigger>
            <RescheduleModal
              appointmentId={a.id}
              currentIso={a.scheduledAt}
              onClose={() => setRescheduleOpen(false)}
              onError={setError}
            />
          </Dialog.Root>

          {!confirmCancel ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmCancel(true)}
              className="text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-3.5 w-3.5" />
              {t("cancel")}
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-1">
              <span className="text-xs text-destructive">{t("cancelConfirm")}</span>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md bg-destructive px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-destructive-foreground hover:bg-destructive/90"
              >
                {t("cancelYes")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent"
              >
                {t("cancelNo")}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs text-foreground/85">
      <span className="text-muted-foreground">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function StatusPill({ status }: { status: CustomerAppointment["status"] }) {
  const t = useTranslations("Account.dashboard.status");
  const tone =
    {
      PENDING: "bg-gold/15 text-gold-foreground dark:text-gold",
      CONFIRMED: "bg-primary/10 text-primary",
      COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400",
      NO_SHOW: "bg-muted text-muted-foreground",
    }[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        tone,
      )}
    >
      {t(status)}
    </span>
  );
}

function RescheduleModal({
  appointmentId,
  currentIso,
  onClose,
  onError,
}: {
  appointmentId: string;
  currentIso: string;
  onClose: () => void;
  onError: (msg: string) => void;
}) {
  const t = useTranslations("Account.dashboard");
  const [selected, setSelected] = React.useState<string | null>(currentIso);
  const [pending, startTransition] = React.useTransition();

  function onConfirm() {
    if (!selected || selected === currentIso) {
      onClose();
      return;
    }
    startTransition(async () => {
      const res = await rescheduleMyAppointment({ id: appointmentId, scheduledAt: selected });
      if (!res.ok) {
        onError(res.error ?? t("rescheduleError"));
      }
      onClose();
    });
  }

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden rounded-2xl border border-border bg-background shadow-elevated data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
        <header className="border-b border-border px-6 py-5">
          <Dialog.Title className="text-lg font-semibold">
            {t("rescheduleTitle")}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-xs text-muted-foreground">
            {t("rescheduleSubtitle")}
          </Dialog.Description>
        </header>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          <StepDateTime selectedIso={selected} onSelect={setSelected} />
        </div>
        <footer className="flex items-center justify-end gap-2 border-t border-border bg-secondary/40 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            {t("rescheduleCancel")}
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={onConfirm}
            disabled={pending || !selected || selected === currentIso}
          >
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("rescheduling")}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("rescheduleConfirm")}
              </>
            )}
          </Button>
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
