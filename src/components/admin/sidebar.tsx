"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Briefcase,
  Star,
  FileText,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { signOutAdmin } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/services", label: "Services", icon: Briefcase },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
];

export function AdminSidebar({
  user,
  pendingCount,
}: {
  user: { name?: string | null; email?: string | null };
  pendingCount: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-border bg-card lg:flex">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-5">
        <LogoMark className="h-8 w-8" />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Al-Shifa</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              {item.label === "Appointments" && pendingCount > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-gold/20 text-gold-foreground",
                  )}
                >
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View public site
        </a>
        <div className="mt-2 rounded-lg border border-border p-3">
          <p className="truncate text-xs font-semibold">
            {user.name ?? "Admin"}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {user.email}
          </p>
          <form action={signOutAdmin} className="mt-3">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
