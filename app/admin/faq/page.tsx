import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminFaqClient from "@/components/admin-faq-client";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/auth/signin");
  return <AdminFaqClient />;
}
