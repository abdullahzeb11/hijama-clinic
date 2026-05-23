import {
  CalendarClock,
  Clock,
  Wallet,
  Star,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview" };

const SAR = new Intl.NumberFormat("en-SA", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 0,
});

export default async function AdminOverview() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const last30Start = new Date(startOfToday);
  last30Start.setDate(last30Start.getDate() - 29);

  const [
    todayCount,
    pendingCount,
    monthRevenue,
    prevMonthRevenue,
    avgRatingAgg,
    last30,
    recent,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        scheduledAt: { gte: startOfToday, lt: endOfToday },
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
    }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.aggregate({
      _sum: { priceSar: true },
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        scheduledAt: { gte: startOfMonth },
      },
    }),
    prisma.appointment.aggregate({
      _sum: { priceSar: true },
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        scheduledAt: { gte: startOfPrevMonth, lt: startOfMonth },
      },
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: true,
      where: { approved: true },
    }),
    prisma.appointment.findMany({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        scheduledAt: { gte: last30Start },
      },
      select: { scheduledAt: true, priceSar: true },
    }),
    prisma.appointment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { service: true },
    }),
  ]);

  const monthRev = monthRevenue._sum.priceSar ?? 0;
  const prevRev = prevMonthRevenue._sum.priceSar ?? 0;
  const revDelta = prevRev > 0 ? ((monthRev - prevRev) / prevRev) * 100 : 0;

  // Bucket last-30 into daily totals
  const buckets = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(last30Start);
    d.setDate(last30Start.getDate() + i);
    buckets.set(dayKey(d), 0);
  }
  for (const a of last30) {
    const k = dayKey(a.scheduledAt);
    buckets.set(k, (buckets.get(k) ?? 0) + a.priceSar);
  }
  const chartPoints = Array.from(buckets.entries()).map(([k, v]) => ({
    label: k.slice(5), // MM-DD
    value: v,
  }));

  const avgRating = avgRatingAgg._avg.rating ?? 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Overview
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Good {greeting(now)}.
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/appointments"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium transition-colors hover:bg-accent"
          >
            View appointments
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={CalendarClock}
          label="Today's bookings"
          value={String(todayCount)}
          hint="Scheduled for today"
          tone="primary"
        />
        <KpiCard
          icon={Clock}
          label="Pending approval"
          value={String(pendingCount)}
          hint={pendingCount > 0 ? "Action needed" : "All clear"}
          tone="gold"
        />
        <KpiCard
          icon={Wallet}
          label="Revenue · this month"
          value={SAR.format(monthRev)}
          delta={revDelta}
          hint={`vs ${SAR.format(prevRev)} last month`}
        />
        <KpiCard
          icon={Star}
          label="Average rating"
          value={avgRating ? avgRating.toFixed(2) : "—"}
          hint={`${avgRatingAgg._count} approved reviews`}
        />
      </div>

      {/* Chart */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Revenue · last 30 days</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Confirmed and completed appointments
            </p>
          </div>
          <p className="text-2xl font-semibold tabular-nums">
            {SAR.format(chartPoints.reduce((sum, p) => sum + p.value, 0))}
          </p>
        </div>
        <div className="mt-4">
          <RevenueChart points={chartPoints} unit="SAR" />
        </div>
      </section>

      {/* Recent activity */}
      <section className="rounded-2xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Recent bookings</h2>
          <Link
            href="/admin/appointments"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </header>
        <ul className="divide-y divide-border">
          {recent.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-muted-foreground">
              No bookings yet.
            </li>
          ) : (
            recent.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-6 py-3.5 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-gradient text-xs font-semibold text-primary-foreground">
                    {(a.guestName ?? "?").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {a.guestName ?? "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.service.nameEn} ·{" "}
                      <span dir="ltr">{a.guestPhone}</span>
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-xs font-medium">
                    {fmtDateShort(a.scheduledAt)}
                  </p>
                  <StatusPill status={a.status} />
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDateShort(d: Date) {
  return new Intl.DateTimeFormat("en-SA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Riyadh",
  }).format(d);
}

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

function StatusPill({ status }: { status: string }) {
  const tone = {
    PENDING: "bg-gold/15 text-gold-foreground dark:text-gold",
    CONFIRMED: "bg-primary/10 text-primary",
    COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    CANCELLED: "bg-red-500/10 text-red-700 dark:text-red-400",
    NO_SHOW: "bg-muted text-muted-foreground",
  }[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        tone,
      )}
    >
      {status.toLowerCase().replace("_", " ")}
    </span>
  );
}
