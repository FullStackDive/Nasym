import AdminUserPermsClient from "@/components/admin-user-perms-client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminUserPermsClient id={id} />;
}
