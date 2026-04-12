import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export const ALL_PERMISSION_KEYS = [
  "manage_users",
  "manage_news",
  "manage_posters",
  "manage_classes",
  "manage_lessons",
  "manage_quizzes",
  "manage_reports"
] as const;

export type PermissionKey = typeof ALL_PERMISSION_KEYS[number];

export async function userHasPermission(userId: string, role: Role, key: PermissionKey) {
  if (role === "ADMIN") return true;
  const perm = await prisma.permission.findUnique({ where: { key } });
  if (!perm) return false;

  const hit = await prisma.userPermission.findUnique({
    where: { userId_permissionId: { userId, permissionId: perm.id } }
  });
  return !!hit;
}

export async function getUserPermissions(userId: string, role: Role): Promise<PermissionKey[]> {
  if (role === "ADMIN") return [...ALL_PERMISSION_KEYS];
  const perms = await prisma.userPermission.findMany({
    where: { userId },
    include: { permission: true }
  });
  return perms.map((p) => p.permission.key as PermissionKey).filter((k) => ALL_PERMISSION_KEYS.includes(k));
}
