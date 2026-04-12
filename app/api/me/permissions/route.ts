import { NextResponse } from "next/server";
import { getSession } from "@/lib/server-session";
import { getUserPermissions } from "@/lib/permissions";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user.role ?? "STUDENT") as any;
  const permissions = await getUserPermissions(session.user.id, role);

  return NextResponse.json({ role, permissions });
}
