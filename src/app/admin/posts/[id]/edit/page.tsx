import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const [post, categories] = await Promise.all([
    prisma.post.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { nameEn: "asc" } }),
  ]);

  if (!post) notFound();

  return (
    <PostEditor
      categories={categories}
      savedFlag={saved === "1"}
      initial={{
        id: post.id,
        locale: (post.locale === "en" ? "en" : "ar") as "ar" | "en",
        status: post.status,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        body: post.body,
        coverImage: post.coverImage ?? "",
        categoryId: post.categoryId,
        metaTitle: post.metaTitle ?? "",
        metaDescription: post.metaDescription ?? "",
        ogImage: post.ogImage ?? "",
      }}
    />
  );
}
