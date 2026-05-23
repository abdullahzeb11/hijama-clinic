"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { computeReadingMinutes, deriveExcerpt } from "@/lib/markdown";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

const slugRule = z
  .string()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, digits and single dashes only");

const baseFields = {
  locale: z.enum(["ar", "en"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  title: z.string().min(3).max(200),
  slug: slugRule,
  excerpt: z.string().max(500).optional().or(z.literal("")),
  body: z.string().min(20),
  coverImage: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().nullable().optional(),
  metaTitle: z.string().max(70).optional().or(z.literal("")),
  metaDescription: z.string().max(200).optional().or(z.literal("")),
  ogImage: z.string().url().optional().or(z.literal("")),
} as const;

const createSchema = z.object(baseFields);
const updateSchema = z.object({ id: z.string().min(1), ...baseFields });

function normalize(input: z.infer<typeof createSchema>) {
  return {
    locale: input.locale,
    status: input.status,
    title: input.title.trim(),
    slug: input.slug.trim(),
    excerpt: input.excerpt?.trim() || deriveExcerpt(input.body),
    body: input.body,
    coverImage: input.coverImage?.trim() || null,
    categoryId: input.categoryId || null,
    metaTitle: input.metaTitle?.trim() || null,
    metaDescription: input.metaDescription?.trim() || null,
    ogImage: input.ogImage?.trim() || null,
    readingMinutes: computeReadingMinutes(input.body),
  };
}

function invalidateBlogCaches(locale: string, slug?: string) {
  revalidatePath("/admin/posts");
  revalidatePath(`/${locale}/blog`);
  if (slug) revalidatePath(`/${locale}/blog/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function createPost(input: z.infer<typeof createSchema>) {
  const user = await requireAdmin();
  const parsed = createSchema.parse(input);
  const data = normalize(parsed);

  const exists = await prisma.post.findUnique({ where: { slug: data.slug } });
  if (exists) throw new Error(`A post with slug "${data.slug}" already exists.`);

  const post = await prisma.post.create({
    data: {
      ...data,
      authorId: user.id ?? null,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
    select: { id: true, slug: true, locale: true },
  });

  invalidateBlogCaches(post.locale, post.slug);
  redirect(`/admin/posts/${post.id}/edit?saved=1`);
}

export async function updatePost(input: z.infer<typeof updateSchema>) {
  await requireAdmin();
  const parsed = updateSchema.parse(input);
  const { id } = parsed;
  const data = normalize(parsed);

  const current = await prisma.post.findUnique({
    where: { id },
    select: { slug: true, status: true, publishedAt: true, locale: true },
  });
  if (!current) throw new Error("Post not found");

  if (data.slug !== current.slug) {
    const clash = await prisma.post.findUnique({ where: { slug: data.slug } });
    if (clash) throw new Error(`A post with slug "${data.slug}" already exists.`);
  }

  const wasPublished = current.status === "PUBLISHED";
  const willPublish = data.status === "PUBLISHED";
  const publishedAt =
    willPublish && !wasPublished
      ? current.publishedAt ?? new Date()
      : current.publishedAt;

  await prisma.post.update({ where: { id }, data: { ...data, publishedAt } });

  invalidateBlogCaches(current.locale, current.slug);
  if (data.locale !== current.locale || data.slug !== current.slug) {
    invalidateBlogCaches(data.locale, data.slug);
  }
  return { ok: true as const };
}

export async function deletePost(id: string) {
  await requireAdmin();
  const post = await prisma.post.findUnique({
    where: { id },
    select: { locale: true, slug: true },
  });
  await prisma.post.delete({ where: { id } });
  if (post) invalidateBlogCaches(post.locale, post.slug);
  redirect("/admin/posts");
}

export async function togglePostStatus(input: { id: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  await requireAdmin();
  const current = await prisma.post.findUnique({
    where: { id: input.id },
    select: { status: true, publishedAt: true, locale: true, slug: true },
  });
  if (!current) throw new Error("Post not found");

  const willPublish = input.status === "PUBLISHED";
  const wasPublished = current.status === "PUBLISHED";

  await prisma.post.update({
    where: { id: input.id },
    data: {
      status: input.status,
      publishedAt:
        willPublish && !wasPublished
          ? current.publishedAt ?? new Date()
          : current.publishedAt,
    },
  });

  invalidateBlogCaches(current.locale, current.slug);
  return { ok: true as const };
}

/* ─── Categories ──────────────────────────────────────────────────────── */

const categorySchema = z.object({
  slug: slugRule,
  nameEn: z.string().min(2).max(80),
  nameAr: z.string().min(2).max(80),
});

export async function createCategory(input: z.infer<typeof categorySchema>) {
  await requireAdmin();
  const parsed = categorySchema.parse(input);
  const exists = await prisma.category.findUnique({ where: { slug: parsed.slug } });
  if (exists) throw new Error("Category slug already exists");
  const created = await prisma.category.create({ data: parsed });
  revalidatePath("/admin/posts");
  return { ok: true as const, id: created.id };
}
