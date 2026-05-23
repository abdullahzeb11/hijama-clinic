import { prisma } from "@/lib/prisma";
import { PostEditor } from "@/components/admin/post-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New post" };

export default async function NewPostPage() {
  const categories = await prisma.category.findMany({
    orderBy: { nameEn: "asc" },
  });
  return <PostEditor categories={categories} />;
}
