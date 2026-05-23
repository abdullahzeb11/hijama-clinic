import { Link } from "@/i18n/routing";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type PostCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  readingMinutes: number;
  category: { nameEn: string; nameAr: string } | null;
};

export function PostCard({
  post,
  locale,
  featured = false,
}: {
  post: PostCardData;
  locale: "ar" | "en";
  featured?: boolean;
}) {
  const categoryName = post.category
    ? locale === "ar"
      ? post.category.nameAr
      : post.category.nameEn
    : null;
  const dateFmt =
    locale === "ar"
      ? new Intl.DateTimeFormat("ar-SA", { dateStyle: "long" })
      : new Intl.DateTimeFormat("en-GB", { dateStyle: "long" });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        featured && "lg:col-span-2 lg:flex-row",
      )}
    >
      {post.coverImage ? (
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-secondary",
            featured ? "aspect-[16/10] lg:aspect-auto lg:w-1/2" : "aspect-[16/10]",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className={cn(
            "relative shrink-0 bg-arabesque bg-[length:14px_14px] bg-primary/5",
            featured ? "aspect-[16/10] lg:aspect-auto lg:w-1/2" : "aspect-[16/10]",
          )}
        />
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {categoryName ? (
          <span className="self-start rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            {categoryName}
          </span>
        ) : null}
        <h3
          className={cn(
            "mt-3 font-display font-semibold tracking-tight balance text-foreground transition-colors group-hover:text-primary",
            featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl",
          )}
        >
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        ) : null}
        <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted-foreground">
          {post.publishedAt ? (
            <time dateTime={post.publishedAt.toISOString()}>
              {dateFmt.format(post.publishedAt)}
            </time>
          ) : null}
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {locale === "ar"
              ? `${post.readingMinutes} د قراءة`
              : `${post.readingMinutes} min read`}
          </span>
        </div>
      </div>
    </Link>
  );
}
