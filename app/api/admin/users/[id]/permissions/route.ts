import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/server-session";
import { userHasPermission, ALL_PERMISSION_KEYS } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  permissionKeys: z.array(z.enum(ALL_PERMISSION_KEYS)).default([])
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });
  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_users");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const perms = await prisma.userPermission.findMany({
    where: { userId: id },
    include: { permission: true }
  });

  return NextResponse.json({
    user: { id: user.id, role: user.role, email: user.email, name: user.name },
    permissionKeys: perms.map((p) => p.permission.key)
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, blocked } = await requireActiveUser();
  if (!session?.user?.id) return NextResponse.json({ error: blocked ?? "Unauthorized" }, { status: 401 });
  const can = await userHasPermission(session.user.id, (session.user.role as any) ?? "STUDENT", "manage_users");
  if (!can) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ensure Permission rows exist
  const perms = await prisma.permission.findMany({ where: { key: { in: parsed.data.permissionKeys } } });

  await prisma.userPermission.deleteMany({ where: { userId: id } });
  await prisma.userPermission.createMany({
    data: perms.map((p) => ({ userId: id, permissionId: p.id }))
  });

  return NextResponse.json({ ok: true });
}
