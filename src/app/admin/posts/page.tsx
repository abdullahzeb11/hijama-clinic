import Link from "next/link";
import { Plus, FileText, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PostRowActions } from "@/components/admin/post-row-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Posts" };

const STATUS_BADGE: Record<"DRAFT" | "PUBLISHED" | "ARCHIVED", string> = {
  DRAFT:
    "bg-muted text-muted-foreground border border-border",
  PUBLISHED:
    "bg-primary/12 text-primary border border-primary/20",
  ARCHIVED:
    "bg-destructive/10 text-destructive border border-destructive/20",
};

const LOCALE_LABEL: Record<string, string> = { ar: "AR", en: "EN" };

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; status?: string }>;
}) {
  const { locale, status } = await searchParams;

  const posts = await prisma.post.findMany({
    where: {
      ...(locale === "ar" || locale === "en" ? { locale } : {}),
      ...(status === "DRAFT" || status === "PUBLISHED" || status === "ARCHIVED"
        ? { status }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    include: { category: true, author: { select: { name: true } } },
  });

  const counts = await prisma.post.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const total = posts.length;
  const totalAll = counts.reduce((acc, c) => acc + c._count._all, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Content
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Journal posts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalAll} total · drafts and published, in Arabic and English.
          </p>
        </div>
        <Button asChild variant="gold">
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4" />
            New post
          </Link>
        </Button>
      </header>

      <Filters locale={locale} status={status} />

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 text-sm font-semibold">No posts yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Write your first journal entry — patient stories, sunnah notes, or
            pain-management guides.
          </p>
          <Button asChild className="mt-5" variant="gold">
            <Link href="/admin/posts/new">
              <Plus className="h-4 w-4" /> Create the first post
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start font-medium">Title</th>
                <th className="px-4 py-3 text-start font-medium">Locale</th>
                <th className="px-4 py-3 text-start font-medium">Category</th>
                <th className="px-4 py-3 text-start font-medium">Status</th>
                <th className="px-4 py-3 text-start font-medium">Updated</th>
                <th className="px-4 py-3 text-end font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/70 last:border-0 hover:bg-secondary/30"
                >
                  <td className="max-w-[360px] px-4 py-3">
                    <Link
                      href={`/admin/posts/${p.id}/edit`}
                      className="block font-medium leading-tight hover:text-primary"
                    >
                      <span className="line-clamp-1">{p.title}</span>
                    </Link>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      /{p.locale}/blog/{p.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium">
                      {LOCALE_LABEL[p.locale] ?? p.locale.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.category
                      ? p.locale === "ar"
                        ? p.category.nameAr
                        : p.category.nameEn
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[p.status]}`}
                    >
                      {p.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(p.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === "PUBLISHED" ? (
                        <Link
                          href={`/${p.locale}/blog/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          aria-label="View live"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      ) : null}
                      <PostRowActions
                        id={p.id}
                        status={p.status}
                        title={p.title}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{total} shown</p>
    </div>
  );
}

function Filters({
  locale,
  status,
}: {
  locale?: string;
  status?: string;
}) {
  const pills: Array<{ label: string; href: string; active: boolean }> = [
    {
      label: "All",
      href: "/admin/posts",
      active: !locale && !status,
    },
    {
      label: "Drafts",
      href: "/admin/posts?status=DRAFT",
      active: status === "DRAFT",
    },
    {
      label: "Published",
      href: "/admin/posts?status=PUBLISHED",
      active: status === "PUBLISHED",
    },
    {
      label: "Arabic",
      href: "/admin/posts?locale=ar",
      active: locale === "ar",
    },
    {
      label: "English",
      href: "/admin/posts?locale=en",
      active: locale === "en",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pills.map((p) => (
        <Link
          key={p.label}
          href={p.href}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            p.active
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
