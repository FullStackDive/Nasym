import BlogPostClient from "@/components/blog-post-client";

export const metadata = { title: "Blog · Nasym-Ur-Rahmah Institute" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
