import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { PostCard, type PostCardData } from "@/components/blog/post-card";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const url = `${siteConfig.url}/${locale}/blog`;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: { ar: `${siteConfig.url}/ar/blog`, en: `${siteConfig.url}/en/blog` },
      types: {
        "application/rss+xml": `${siteConfig.url}/${locale}/blog/rss.xml`,
      },
    },
    openGraph: {
      type: "website",
      url,
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);
  const loc = (locale === "en" ? "en" : "ar") as "ar" | "en";
  const t = await getTranslations({ locale, namespace: "Blog" });

  const [posts, categories] = await Promise.all([
    prisma.post.findMany({
      where: {
        locale: loc,
        status: "PUBLISHED",
        ...(category ? { category: { slug: category } } : {}),
      },
      orderBy: [{ publishedAt: "desc" }],
      take: 30,
      include: { category: true },
    }),
    prisma.category.findMany({
      where: { posts: { some: { locale: loc, status: "PUBLISHED" } } },
      orderBy: { nameEn: "asc" },
    }),
  ]);

  const cards: PostCardData[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    publishedAt: p.publishedAt,
    readingMinutes: p.readingMinutes,
    category: p.category
      ? { nameEn: p.category.nameEn, nameAr: p.category.nameAr }
      : null,
  }));

  const [featured, ...rest] = cards;

  return (
    <div className="relative pb-24 pt-12 sm:pt-20">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.10),transparent_60%)]" />

      <div className="container-wide max-w-6xl">
        <header className="max-w-2xl">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="mt-3 text-display-lg balance">{t("title")}</h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {t("subtitle")}
          </p>
        </header>

        {categories.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center gap-1.5">
            <CategoryPill
              href="/blog"
              active={!category}
              label={t("allCategories")}
            />
            {categories.map((c) => (
              <CategoryPill
                key={c.id}
                href={`/blog?category=${c.slug}`}
                active={category === c.slug}
                label={loc === "ar" ? c.nameAr : c.nameEn}
              />
            ))}
          </div>
        ) : null}

        {cards.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <h2 className="text-base font-semibold">{t("emptyTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("emptyBody")}
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured ? (
              <PostCard post={featured} locale={loc} featured />
            ) : null}
            {rest.map((p) => (
              <PostCard key={p.slug} post={p} locale={loc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
