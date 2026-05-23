import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, Clock, CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { renderMarkdown } from "@/lib/markdown";
import { PostCard, type PostCardData } from "@/components/blog/post-card";
import { PostShare } from "@/components/blog/post-share";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await prisma.post.findFirst({
    where: { slug, locale, status: "PUBLISHED" },
    select: {
      title: true,
      excerpt: true,
      metaTitle: true,
      metaDescription: true,
      ogImage: true,
      coverImage: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
  if (!post) return { title: "Not found", robots: { index: false } };

  const url = `${siteConfig.url}/${locale}/blog/${slug}`;
  const image = post.ogImage || post.coverImage || undefined;
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = (locale === "en" ? "en" : "ar") as "ar" | "en";
  const t = await getTranslations({ locale, namespace: "Blog" });

  const post = await prisma.post.findFirst({
    where: { slug, locale: loc, status: "PUBLISHED" },
    include: {
      category: true,
      author: { select: { name: true } },
    },
  });
  if (!post) notFound();

  const [bodyHtml, related] = await Promise.all([
    renderMarkdown(post.body),
    post.categoryId
      ? prisma.post.findMany({
          where: {
            locale: loc,
            status: "PUBLISHED",
            categoryId: post.categoryId,
            NOT: { id: post.id },
          },
          orderBy: { publishedAt: "desc" },
          take: 3,
          include: { category: true },
        })
      : Promise.resolve([]),
  ]);

  const url = `${siteConfig.url}/${locale}/blog/${slug}`;
  const dateFmt =
    loc === "ar"
      ? new Intl.DateTimeFormat("ar-SA", { dateStyle: "long" })
      : new Intl.DateTimeFormat("en-GB", { dateStyle: "long" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: loc,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: {
      "@type": "Person",
      name: post.author?.name ?? siteConfig.brand.shortEn,
    },
    publisher: {
      "@type": "Organization",
      name: loc === "ar" ? siteConfig.brand.nameAr : siteConfig.brand.nameEn,
      url: siteConfig.url,
    },
  };

  const categoryName = post.category
    ? loc === "ar"
      ? post.category.nameAr
      : post.category.nameEn
    : null;

  return (
    <article className="relative pb-24 pt-10 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.10),transparent_60%)]" />

      <div className="container-wide max-w-3xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className={loc === "ar" ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
          {t("backToBlog")}
        </Link>

        <header className="mt-6">
          {categoryName ? (
            <Link
              href={`/blog?category=${post.category!.slug}`}
              className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary/20"
            >
              {categoryName}
            </Link>
          ) : null}
          <h1 className="mt-4 text-display-lg balance">{post.title}</h1>
          {post.excerpt ? (
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {post.publishedAt ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <time dateTime={post.publishedAt.toISOString()}>
                  {dateFmt.format(post.publishedAt)}
                </time>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {loc === "ar"
                ? `${post.readingMinutes} د قراءة`
                : `${post.readingMinutes} min read`}
            </span>
            {post.author?.name ? (
              <span className="inline-flex items-center gap-1.5">
                {t("by")} <span className="text-foreground">{post.author.name}</span>
              </span>
            ) : null}
          </div>
        </header>

        {post.coverImage ? (
          <figure className="mt-10 overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt=""
              className="aspect-[16/9] w-full object-cover"
            />
          </figure>
        ) : null}

        <div
          dir={loc === "ar" ? "rtl" : "ltr"}
          className="prose-blog mt-10"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />

        <hr className="my-12 border-border" />

        <PostShare
          url={url}
          title={post.title}
          label={t("share")}
          copyLabel={t("copyLink")}
          copiedLabel={t("copied")}
        />
      </div>

      {related.length > 0 ? (
        <section className="mt-20">
          <div className="container-wide max-w-6xl">
            <h2 className="text-xl font-semibold sm:text-2xl">{t("related")}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => {
                const data: PostCardData = {
                  slug: r.slug,
                  title: r.title,
                  excerpt: r.excerpt,
                  coverImage: r.coverImage,
                  publishedAt: r.publishedAt,
                  readingMinutes: r.readingMinutes,
                  category: r.category
                    ? { nameEn: r.category.nameEn, nameAr: r.category.nameAr }
                    : null,
                };
                return <PostCard key={r.id} post={data} locale={loc} />;
              })}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
