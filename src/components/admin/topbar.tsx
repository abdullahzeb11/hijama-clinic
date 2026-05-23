"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { signOutAdmin } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/appointments", label: "Appointments" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/reviews", label: "Reviews" },
];

/** Mobile-only condensed nav. Desktop uses AdminSidebar. */
export function AdminTopbar({ title }: { title: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <LogoMark className="h-7 w-7" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle nav"
          className="rounded-lg p-2 hover:bg-accent"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      <div
        className={cn(
          "overflow-hidden border-t border-border transition-[max-height] duration-300",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <nav className="space-y-0.5 p-3">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent"
            >
              {n.label}
            </Link>
          ))}
          <form action={signOutAdmin}>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm hover:bg-destructive hover:text-destructive-foreground"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
