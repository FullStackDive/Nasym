import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: tsx prisma/promote-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: Role.ADMIN, status: "ACTIVE" },
  });

  const perms = await prisma.permission.findMany();
  for (const p of perms) {
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId: user.id, permissionId: p.id } },
      update: {},
      create: { userId: user.id, permissionId: p.id },
    });
  }

  console.log(`Promoted ${email} to ADMIN with ${perms.length} permissions.`);
}

main().finally(() => prisma.$disconnect());
