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

  if ((await prisma.poster.count()) === 0) {
    await prisma.poster.createMany({
      data: [
        {
          title: "Welcome to Nasym-ur-Rahmah — Learn Islam with clarity",
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
  }

  if ((await prisma.newsPost.count()) === 0) {
    await prisma.newsPost.createMany({
      data: [
        {
          title: "Enrolment open: Tajweed & Quranic Insights",
          body: "Our ongoing Tajweed & Quranic Insights course is currently open for new students. Submit the admissions form to join the next cohort.",
          pinned: true,
          createdById: admin.id
        },
        {
          title: "Live classrooms are open",
          body: "Join recorded lessons or live sessions with your teachers. Use the courses page to browse all running and past batches.",
          pinned: false,
          createdById: admin.id
        }
      ]
    });
  }

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

  const ENROLMENT_FORM_URL = "https://forms.gle/mhM624tZ9sDqXAPZA";

  // Active course — Tajweed & Quranic Insights (currently running)
  const tajweed = await prisma.course.upsert({
    where: { slug: "tajweed-quranic-insights" },
    update: {
      isPublished: true,
      isOpenForEnrolment: true,
      isArchived: false,
      enrolmentFormUrl: ENROLMENT_FORM_URL,
    },
    create: {
      slug: "tajweed-quranic-insights",
      title: "Tajweed & Quranic Insights",
      description:
        "An ongoing course covering the rules of Tajweed alongside reflections on the meanings of the Qur'an. Suitable for beginners and intermediate students wanting to refine their recitation and understanding.",
      isPublished: true,
      isOpenForEnrolment: true,
      isArchived: false,
      enrolmentFormUrl: ENROLMENT_FORM_URL,
      startsAt: new Date(),
      ownerId: admin.id,
    },
  });

  // Past courses (previous batches)
  const pastBatches: { slug: string; title: string; description: string }[] = [
    {
      slug: "seerah-of-the-prophet-batch-1",
      title: "Sīrah of the Prophet ﷺ — Batch 1",
      description: "A chronological walk through the life of the Prophet Muhammad ﷺ. Completed in a previous cohort.",
    },
    {
      slug: "fiqh-of-worship-batch-1",
      title: "Fiqh of Worship — Batch 1",
      description: "Rules and wisdoms of ṭahārah, ṣalāh, fasting, and zakāh. Completed cohort.",
    },
    {
      slug: "akhlaq-for-youth-batch-1",
      title: "Akhlāq for Youth — Batch 1",
      description: "Character development series for teenagers. Previous batch.",
    },
  ];

  for (const c of pastBatches) {
    await prisma.course.upsert({
      where: { slug: c.slug },
      update: { isPublished: true, isArchived: true, isOpenForEnrolment: false },
      create: {
        ...c,
        isPublished: true,
        isArchived: true,
        isOpenForEnrolment: false,
        endsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
        ownerId: admin.id,
      },
    });
  }

  // Sample lesson + quiz (attached to Tajweed course)
  const existingLesson = await prisma.lesson.findFirst({ where: { title: "How to Pray (Salah) — Step by Step" } });
  const lesson = existingLesson ?? await prisma.lesson.create({
    data: {
      title: "How to Pray (Salah) — Step by Step",
      description: "A beginner-friendly recorded lesson explaining the pillars and steps of Salah.",
      videoUrl: "https://www.youtube.com/embed/4xwI8Y4VfXk",
      tags: "salah,beginners",
      courseId: tajweed.id,
      createdById: admin.id,
    },
  });

  const existingQuiz = await prisma.quiz.findFirst({ where: { lessonId: lesson.id } });
  if (!existingQuiz) {
    await prisma.quiz.create({
      data: {
        title: "Salah Basics Quiz",
        description: "Check your understanding of the basics of Salah.",
        lessonId: lesson.id,
        courseId: tajweed.id,
        createdById: admin.id,
        questions: {
          create: [
            { prompt: "How many obligatory (fard) prayers are there in a day?", options: ["3", "5", "7", "10"], correctIdx: 1 },
            { prompt: "Which direction do Muslims face in Salah?", options: ["East", "West", "Ka'bah (Qiblah)", "North"], correctIdx: 2 },
          ],
        },
      },
    });
  }

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
