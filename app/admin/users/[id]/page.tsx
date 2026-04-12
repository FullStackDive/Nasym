import AdminUserPermsClient from "@/components/admin-user-perms-client";

export default function Page({ params }: { params: { id: string } }) {
  return <AdminUserPermsClient id={params.id} />;
}
