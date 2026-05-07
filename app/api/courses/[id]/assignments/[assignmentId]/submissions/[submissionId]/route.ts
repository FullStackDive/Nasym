import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isCourseTeacher } from "@/lib/access";
import { notify } from "@/lib/notify";

const gradeSchema = z.object({
  score: z.number().int().min(0),
  feedback: z.string().max(5000).optional(),
  status: z.enum(["GRADED", "RETURNED"]).default("GRADED"),
});

type Params = { id: string; assignmentId: string; submissionId: string };

// PATCH /api/courses/[id]/assignments/[assignmentId]/submissions/[submissionId]
// Teachers/admins grade a submission
export async function PATCH(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId, assignmentId, submissionId } = await params;
  const { role, id: userId } = session.user;

  if (role !== "ADMIN" && !(await isCourseTeacher(userId, courseId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const submission = await prisma.assignmentSubmission.findFirst({
    where: { id: submissionId, assignmentId },
  });
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  const assignment = await prisma.assignment.findFirst({ where: { id: assignmentId, courseId } });
  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = gradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.score > assignment.maxPoints) {
    return NextResponse.json(
      { error: `Score cannot exceed maxPoints (${assignment.maxPoints})` },
      { status: 400 }
    );
  }

  const updated = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      score: parsed.data.score,
      feedback: parsed.data.feedback ?? null,
      status: parsed.data.status,
      gradedById: userId,
      gradedAt: new Date(),
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      gradedBy: { select: { id: true, name: true } },
    },
  });

  await notify({
    userId: updated.student.id,
    type: "ASSIGNMENT_GRADED",
    title: `Assignment graded: ${assignment.title}`,
    body: `You scored ${updated.score}/${assignment.maxPoints}.${parsed.data.feedback ? " Feedback provided." : ""}`,
    href: `/courses/${courseId}/assignments/${assignmentId}`,
    email: {
      to: updated.student.email,
      subject: `[Nasym] Assignment graded: ${assignment.title}`,
      text: `Hello ${updated.student.name},\n\nYour assignment "${assignment.title}" has been graded. You scored ${updated.score}/${assignment.maxPoints}.\n\n${parsed.data.feedback ?? ""}`,
    },
  });

  return NextResponse.json({ submission: updated });
}
