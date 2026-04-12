import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Permissions
  const permissions = [
    { key: "manage_users", description: "Create/update users and assign permissions" },
    { key: "manage_news", description: "Create/update news posts" },
    { key: "manage_posters", description: "Create/update home posters" },
    { key: "manage_classes", description: "Create/update class sessions" },
    { key: "manage_lessons", description: "Create/update recorded lessons" },
    { key: "manage_quizzes", description: "Create/update quizzes and questions" },
    { key: "manage_reports", description: "Review and resolve user reports" }
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { description: p.description },
      create: p
    });
  }

  const adminEmail = "admin@example.com";
  const adminPassword = "Admin123!"; // change after first login
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN
    }
  });

  // Give admin all permissions (explicitly stored; UI also treats ADMIN as all-access)
  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId: admin.id, permissionId: perm.id } },
      update: {},
      create: { userId: admin.id, permissionId: perm.id }
    });
  }

  // Sample posters & news
  await prisma.poster.createMany({
    data: [
      {
        title: "Welcome to Noor — Learn Islam with clarity",
        imageUrl: "https://images.unsplash.com/photo-1602524816367-1d061e1c2cbd?auto=format&fit=crop&w=1600&q=80",
        ctaText: "Explore Classes",
        ctaHref: "/classes",
        createdById: admin.id
      },
      {
        title: "Daily Reminder: Salah is your anchor",
        imageUrl: "https://images.unsplash.com/photo-1564760055777-d63b17a55c44?auto=format&fit=crop&w=1600&q=80",
        ctaText: "Read News",
        ctaHref: "/news",
        createdById: admin.id
      }
    ],
  });

  await prisma.newsPost.createMany({
    data: [
      {
        title: "New: Live classrooms are open!",
        body: "Admins can create a class session and students can join in real-time with video and chat.",
        pinned: true,
        createdById: admin.id
      },
      {
        title: "Tip for students",
        body: "Set a weekly learning schedule and invite a friend. Consistency beats intensity.",
        pinned: false,
        createdById: admin.id
      }
    ]
  });

  const roomName = "noor-classroom-demo";
  await prisma.classSession.upsert({
    where: { roomName },
    update: {},
    create: {
      title: "Intro to Aqeedah (Demo)",
      description: "A short demo session to test the live classroom feature.",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      roomName,
      isLive: false,
      createdById: admin.id
    }
  });

  
// Sample lesson + quiz
const lesson = await prisma.lesson.create({
  data: {
    title: "How to Pray (Salah) — Step by Step",
    description: "A beginner-friendly recorded lesson explaining the pillars and steps of Salah.",
    videoUrl: "https://www.youtube.com/embed/4xwI8Y4VfXk",
    tags: "salah,beginners",
    createdById: admin.id
  }
});

const quiz = await prisma.quiz.create({
  data: {
    title: "Salah Basics Quiz",
    description: "Check your understanding of the basics of Salah.",
    lessonId: lesson.id,
    createdById: admin.id,
    questions: {
      create: [
        {
          prompt: "How many obligatory (fard) prayers are there in a day?",
          options: ["3", "5", "7", "10"],
          correctIdx: 1
        },
        {
          prompt: "Which direction do Muslims face in Salah?",
          options: ["East", "West", "Ka'bah (Qiblah)", "North"],
          correctIdx: 2
        }
      ]
    }
  }
});

console.log("Seed complete.");
  console.log("Admin login:");
  console.log("  email:", adminEmail);
  console.log("  password:", adminPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
