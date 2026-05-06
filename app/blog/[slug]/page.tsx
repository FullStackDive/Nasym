import BlogPostClient from "@/components/blog-post-client";

export const metadata = { title: "Blog · Nasym-ur-Rahmah" };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
