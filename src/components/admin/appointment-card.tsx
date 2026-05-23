"use client";

import * as React from "react";
import {
  Check,
  X,
  Phone,
  MapPin,
  Clock,
  CalendarDays,
  Home,
  Building2,
  MoreHorizontal,
  CheckCheck,
  UserX,
  Undo2,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { updateAppointmentStatus } from "@/app/actions/admin";
import { cn, waLink } from "@/lib/utils";

export type AppointmentCardData = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  scheduledAt: string;
  durationMin: number;
  priceSar: number;
  location: "CLINIC" | "HOME_VISIT";
  guestName: string | null;
  guestPhone: string | null;
  addressLine: string | null;
  serviceName: string;        // English (shown on card)
  serviceNameAr: string;      // Arabic (used in Arabic WhatsApp message)
  locale: "ar" | "en";        // Locale the customer booked in
};

export function AppointmentCard({ a }: { a: AppointmentCardData }) {
  const [pending, startTransition] = React.useTransition();

  function move(status: AppointmentCardData["status"]) {
    startTransition(async () => {
      await updateAppointmentStatus({ id: a.id, status });
    });
  }

  const next = nextActions(a.status);

  return (
    <article className="group relative rounded-xl border border-border bg-card p-3.5 shadow-soft transition-all hover:shadow-elevated">
      {pending ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">
            {a.guestName ?? "—"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {a.serviceName}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            {next.map((n) => (
              <DropdownMenuItem
                key={n.status}
                onClick={() => move(n.status)}
                className={n.tone}
              >
                {n.icon}
                {n.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href={`tel:${a.guestPhone ?? ""}`}
                className="inline-flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Call customer
              </a>
            </DropdownMenuItem>
            {a.guestPhone ? (
              <DropdownMenuItem asChild>
                <a
                  href={buildWhatsAppConfirmLink(a)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <WAGlyph className="h-4 w-4" />
                  WhatsApp confirm
                </a>
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-1.5 text-xs">
        <Row icon={<CalendarDays className="h-3.5 w-3.5" />}>
          {new Intl.DateTimeFormat("en-SA", {
            weekday: "short",
            month: "short",
            day: "numeric",
            timeZone: "Asia/Riyadh",
          }).format(new Date(a.scheduledAt))}
        </Row>
        <Row icon={<Clock className="h-3.5 w-3.5" />}>
          <span dir="ltr">
            {new Intl.DateTimeFormat("en-SA", {
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
            ? a.addressLine ?? "Home visit"
            : "Clinic"}
        </Row>
        {a.guestPhone ? (
          <Row icon={<Phone className="h-3.5 w-3.5" />}>
            <span dir="ltr">{a.guestPhone}</span>
          </Row>
        ) : null}
      </dl>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <p className="text-xs font-semibold tabular-nums">{a.priceSar} SAR</p>
        <div className="flex items-center gap-1.5">
          {a.guestPhone && (a.status === "PENDING" || a.status === "CONFIRMED") ? (
            <a
              href={buildWhatsAppConfirmLink(a)}
              target="_blank"
              rel="noreferrer"
              title="Send WhatsApp confirmation"
              aria-label="Send WhatsApp confirmation"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white transition-colors hover:bg-[#1da851]"
            >
              <WAGlyph className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {next.length > 0 ? (
            <button
              type="button"
              onClick={() => move(next[0].status)}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {next[0].icon}
              {next[0].label}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** Build a wa.me link with the full confirmation message pre-filled, in the
 *  language the customer booked in. */
function buildWhatsAppConfirmLink(a: AppointmentCardData): string {
  if (!a.guestPhone) return "#";

  const localeTag = a.locale === "ar" ? "ar-SA" : "en-SA";
  const when = new Date(a.scheduledAt);
  const date = new Intl.DateTimeFormat(localeTag, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(when);
  const time = new Intl.DateTimeFormat(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Riyadh",
  }).format(when);
  const ref = a.id.slice(-8).toUpperCase();
  const name = a.guestName ?? "";

  const message =
    a.locale === "ar"
      ? `السلام عليكم ${name}،\n\nنؤكد لكم موعدكم في مركز الشفاء للحجامة:\n\n• الخدمة: ${a.serviceNameAr}\n• الوقت: ${date} – ${time}\n• المكان: ${a.location === "HOME_VISIT" ? "زيارة منزلية" + (a.addressLine ? ` — ${a.addressLine}` : "") : "في العيادة"}\n• المرجع: ${ref}\n\nإذا احتجتم لإعادة الجدولة، فقط ردّوا على هذه الرسالة. نراكم قريبًا إن شاء الله. 🌿`
      : `As-salamu alaykum ${name},\n\nThis confirms your appointment at Al-Shifa Hijama Center:\n\n• Service: ${a.serviceName}\n• When: ${date} at ${time}\n• Where: ${a.location === "HOME_VISIT" ? "Home visit" + (a.addressLine ? ` — ${a.addressLine}` : "") : "At the clinic"}\n• Ref: ${ref}\n\nReply to this message if you need to reschedule. See you then. 🌿`;

  return waLink(a.guestPhone, message);
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-foreground/85">
      <span className="text-muted-foreground">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function nextActions(status: AppointmentCardData["status"]) {
  switch (status) {
    case "PENDING":
      return [
        { status: "CONFIRMED" as const, label: "Confirm", icon: <Check className="h-3 w-3" />, tone: "" },
        { status: "CANCELLED" as const, label: "Cancel", icon: <X className="h-3 w-3" />, tone: "text-destructive" },
      ];
    case "CONFIRMED":
      return [
        { status: "COMPLETED" as const, label: "Complete", icon: <CheckCheck className="h-3 w-3" />, tone: "" },
        { status: "NO_SHOW" as const, label: "No-show", icon: <UserX className="h-3 w-3" />, tone: "" },
        { status: "CANCELLED" as const, label: "Cancel", icon: <X className="h-3 w-3" />, tone: "text-destructive" },
      ];
    case "COMPLETED":
    case "CANCELLED":
    case "NO_SHOW":
      return [
        { status: "PENDING" as const, label: "Reopen", icon: <Undo2 className="h-3 w-3" />, tone: "" },
      ];
    default:
      return [];
  }
}

function WAGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn(className)} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    </svg>
  );
}
