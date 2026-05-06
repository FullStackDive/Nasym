import AcceptInviteClient from "@/components/accept-invite-client";

export const metadata = { title: "Accept Invitation · Nasym-ur-Rahmah" };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <AcceptInviteClient token={token} />;
}
