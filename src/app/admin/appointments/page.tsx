import { Inbox } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AppointmentCard,
  type AppointmentCardData,
} from "@/components/admin/appointment-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Appointments" };

type Filter = "active" | "all" | "completed" | "cancelled";

const COLUMNS: Array<{
  title: string;
  status: AppointmentCardData["status"];
  accent: string;
}> = [
  { title: "Pending", status: "PENDING", accent: "bg-gold" },
  { title: "Confirmed", status: "CONFIRMED", accent: "bg-primary" },
  { title: "Completed", status: "COMPLETED", accent: "bg-emerald-500" },
];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await searchParams;
  const filter = (sp.filter ?? "active") as Filter;

  const where: Prisma.AppointmentWhereInput = (() => {
    switch (filter) {
      case "completed":
        return { status: { in: ["COMPLETED"] } };
      case "cancelled":
        return { status: { in: ["CANCELLED", "NO_SHOW"] } };
      case "all":
        return {};
      default:
        return { status: { in: ["PENDING", "CONFIRMED"] } };
    }
  })();

  const rows = await prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: { service: true },
    take: 200,
  });

  const cards: AppointmentCardData[] = rows.map((a) => ({
    id: a.id,
    status: a.status,
    scheduledAt: a.scheduledAt.toISOString(),
    durationMin: a.durationMin,
    priceSar: a.priceSar,
    location: a.location,
    guestName: a.guestName,
    guestPhone: a.guestPhone,
    addressLine: a.addressLine,
    serviceName: a.service.nameEn,
    serviceNameAr: a.service.nameAr,
    locale: (a.locale === "en" ? "en" : "ar") as "ar" | "en",
  }));

  // Bucket by status when in kanban mode (filter=active is the kanban view).
  const buckets: Record<AppointmentCardData["status"], AppointmentCardData[]> = {
    PENDING: [],
    CONFIRMED: [],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
  };
  for (const c of cards) buckets[c.status].push(c);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Operations
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Appointments
          </h1>
        </div>

        <nav className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
          <FilterTab href="?filter=active" label="Active" current={filter === "active"} />
          <FilterTab href="?filter=completed" label="Completed" current={filter === "completed"} />
          <FilterTab href="?filter=cancelled" label="Cancelled" current={filter === "cancelled"} />
          <FilterTab href="?filter=all" label="All" current={filter === "all"} />
        </nav>
      </header>

      {filter === "active" ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <section key={col.status} className="flex flex-col">
              <header className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full", col.accent)} />
                  <h2 className="text-sm font-semibold">{col.title}</h2>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {buckets[col.status].length}
                  </span>
                </div>
              </header>
              <div className="space-y-2.5">
                {buckets[col.status].length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                    <Inbox className="mx-auto h-5 w-5 text-muted-foreground" />
                    <p className="mt-2 text-xs text-muted-foreground">Nothing here</p>
                  </div>
                ) : (
                  buckets[col.status].map((c) => <AppointmentCard key={c.id} a={c} />)
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <Inbox className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No appointments match this filter.</p>
            </div>
          ) : (
            cards.map((c) => <AppointmentCard key={c.id} a={c} />)
          )}
        </div>
      )}
    </div>
  );
}

function FilterTab({
  href,
  label,
  current,
}: {
  href: string;
  label: string;
  current: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
        current
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
