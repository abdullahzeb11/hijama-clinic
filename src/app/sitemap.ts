import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { routing } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = ["", "/blog", "/privacy", "/terms"];

  const staticEntries: MetadataRoute.Sitemap = pages.flatMap((page) =>
    routing.locales.map((locale) => ({
      url: `${siteConfig.url}/${locale}${page}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: page === "" ? 1 : 0.6,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${siteConfig.url}/${l}${page}`]),
        ),
      },
    })),
  );

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, locale: true, updatedAt: true, publishedAt: true },
  });

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteConfig.url}/${p.locale}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...postEntries];
}
