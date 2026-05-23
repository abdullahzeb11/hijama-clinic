import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 600;

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET(
  _req: Request,
  context: { params: Promise<{ locale: string }> },
) {
  const { locale } = await context.params;
  const loc = locale === "en" ? "en" : "ar";

  const posts = await prisma.post.findMany({
    where: { locale: loc, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });

  const channelTitle =
    loc === "ar"
      ? `${siteConfig.brand.nameAr} — المجلة`
      : `${siteConfig.brand.nameEn} — Journal`;
  const channelDescription =
    loc === "ar"
      ? "مقالات عن الحجامة، الطب النبوي، إدارة الألم، وصحة الجسد."
      : "Articles on hijama, prophetic medicine, pain management, and wellness.";

  const items = posts
    .map((p) => {
      const url = `${siteConfig.url}/${loc}/blog/${p.slug}`;
      return `    <item>
      <title>${escape(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${p.publishedAt ? `<pubDate>${p.publishedAt.toUTCString()}</pubDate>` : ""}
      ${p.excerpt ? `<description>${escape(p.excerpt)}</description>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(channelTitle)}</title>
    <link>${siteConfig.url}/${loc}/blog</link>
    <description>${escape(channelDescription)}</description>
    <language>${loc}</language>
    <atom:link href="${siteConfig.url}/${loc}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
