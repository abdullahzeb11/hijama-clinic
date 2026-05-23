"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import {
  Eye,
  Pencil,
  Save,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPost, updatePost } from "@/app/actions/posts";
import { cn } from "@/lib/utils";

marked.setOptions({ gfm: true, breaks: false });

type Category = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
};

type Initial = {
  id?: string;
  locale: "ar" | "en";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: string;
  categoryId: string | null;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
};

const EMPTY: Initial = {
  locale: "ar",
  status: "DRAFT",
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImage: "",
  categoryId: null,
  metaTitle: "",
  metaDescription: "",
  ogImage: "",
};

const PLACEHOLDER_MD = `## Section heading

Write your article in markdown.

- Bullet points
- **Bold** and *italic*
- [Links](https://example.com)

> Quote a hadith or a patient testimonial.

\`inline code\` and code blocks render too.
`;

const SLUG_TRANSLIT: Record<string, string> = {
  ا: "a", أ: "a", إ: "i", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h",
  خ: "kh", د: "d", ذ: "dh", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d",
  ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m",
  ن: "n", ه: "h", و: "w", ي: "y", ى: "a", ئ: "y", ؤ: "w", ة: "h", ء: "",
};

function makeSlug(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => SLUG_TRANSLIT[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function PostEditor({
  initial,
  categories,
  savedFlag,
}: {
  initial?: Initial;
  categories: Category[];
  savedFlag?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = React.useState<Initial>(initial ?? EMPTY);
  const [tab, setTab] = React.useState<"write" | "preview">("write");
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial?.slug));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(savedFlag ?? false);

  const isNew = !initial?.id;
  const isRTL = state.locale === "ar";
  const previewHtml = React.useMemo(
    () => marked.parse(state.body || "*Nothing to preview yet.*") as string,
    [state.body],
  );

  function patch<K extends keyof Initial>(key: K, value: Initial[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  function onTitleChange(v: string) {
    patch("title", v);
    if (!slugTouched) {
      setState((s) => ({ ...s, slug: makeSlug(v) }));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isNew) {
        await createPost(state);
        // createPost redirects to /admin/posts/[id]/edit?saved=1
      } else {
        await updatePost({ id: initial!.id!, ...state });
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not save the post.";
      // Next.js redirect throws an internal error — treat it as success.
      if (msg.includes("NEXT_REDIRECT")) return;
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {isNew ? "New post" : "Edit post"}
          </p>
          <h1 className="mt-1 line-clamp-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {state.title || (isNew ? "Untitled post" : initial?.title)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && state.status === "PUBLISHED" ? (
            <Link
              href={`/${initial!.locale}/blog/${initial!.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" /> View live
            </Link>
          ) : null}
          <Link
            href="/admin/posts"
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
          <Button type="submit" variant="gold" disabled={busy}>
            <Save className="h-4 w-4" />
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      {saved ? (
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" />
          Saved.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Body */}
        <section className="space-y-4 lg:col-span-2">
          <Field label="Title">
            <input
              value={state.title}
              onChange={(e) => onTitleChange(e.target.value)}
              required
              placeholder={isRTL ? "عنوان المقال" : "Article title"}
              dir={isRTL ? "rtl" : "ltr"}
              className={inputBase}
            />
          </Field>

          <Field label="Slug" hint={`/${state.locale}/blog/${state.slug || "…"}`}>
            <input
              value={state.slug}
              onChange={(e) => {
                setSlugTouched(true);
                patch("slug", e.target.value);
              }}
              required
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              placeholder="lowercase-with-dashes"
              className={inputBase}
            />
          </Field>

          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <div className="flex items-center gap-1">
                <TabButton
                  active={tab === "write"}
                  onClick={() => setTab("write")}
                  icon={<Pencil className="h-3.5 w-3.5" />}
                >
                  Write
                </TabButton>
                <TabButton
                  active={tab === "preview"}
                  onClick={() => setTab("preview")}
                  icon={<Eye className="h-3.5 w-3.5" />}
                >
                  Preview
                </TabButton>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Markdown · GitHub-flavored
              </span>
            </div>

            {tab === "write" ? (
              <textarea
                value={state.body}
                onChange={(e) => patch("body", e.target.value)}
                rows={22}
                required
                minLength={20}
                dir={isRTL ? "rtl" : "ltr"}
                placeholder={PLACEHOLDER_MD}
                className="block w-full resize-y rounded-b-2xl border-0 bg-transparent px-4 py-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-0"
              />
            ) : (
              <div
                dir={isRTL ? "rtl" : "ltr"}
                className="prose-blog max-h-[640px] overflow-auto px-5 py-4"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            )}
          </div>

          <Field
            label="Excerpt"
            hint="Used in listing cards and meta tags. Auto-generated if left blank."
          >
            <textarea
              value={state.excerpt}
              onChange={(e) => patch("excerpt", e.target.value)}
              rows={2}
              dir={isRTL ? "rtl" : "ltr"}
              maxLength={500}
              className={cn(inputBase, "resize-y")}
            />
          </Field>
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Field label="Locale">
            <select
              value={state.locale}
              onChange={(e) => patch("locale", e.target.value as "ar" | "en")}
              className={inputBase}
            >
              <option value="ar">Arabic (العربية)</option>
              <option value="en">English</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              value={state.status}
              onChange={(e) =>
                patch("status", e.target.value as Initial["status"])
              }
              className={inputBase}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </Field>

          <Field label="Category">
            <select
              value={state.categoryId ?? ""}
              onChange={(e) => patch("categoryId", e.target.value || null)}
              className={inputBase}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn} · {c.nameAr}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Cover image URL" hint="Used as the hero image.">
            <input
              type="url"
              value={state.coverImage}
              onChange={(e) => patch("coverImage", e.target.value)}
              placeholder="https://…"
              className={inputBase}
            />
          </Field>
          {state.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.coverImage}
              alt=""
              className="aspect-[16/10] w-full rounded-xl border border-border object-cover"
            />
          ) : null}

          <details className="rounded-xl border border-border bg-card p-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              SEO
            </summary>
            <div className="mt-3 space-y-3">
              <Field label="Meta title" hint="Defaults to post title">
                <input
                  value={state.metaTitle}
                  onChange={(e) => patch("metaTitle", e.target.value)}
                  maxLength={70}
                  dir={isRTL ? "rtl" : "ltr"}
                  className={inputBase}
                />
              </Field>
              <Field
                label="Meta description"
                hint="Defaults to excerpt — keep under 160 chars"
              >
                <textarea
                  value={state.metaDescription}
                  onChange={(e) =>
                    patch("metaDescription", e.target.value)
                  }
                  rows={2}
                  maxLength={200}
                  dir={isRTL ? "rtl" : "ltr"}
                  className={cn(inputBase, "resize-y")}
                />
              </Field>
              <Field label="OG image URL" hint="Defaults to cover image">
                <input
                  type="url"
                  value={state.ogImage}
                  onChange={(e) => patch("ogImage", e.target.value)}
                  placeholder="https://…"
                  className={inputBase}
                />
              </Field>
            </div>
          </details>
        </aside>
      </div>
    </form>
  );
}

const inputBase =
  "block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        {hint ? (
          <span className="truncate text-[11px] text-muted-foreground/70">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
