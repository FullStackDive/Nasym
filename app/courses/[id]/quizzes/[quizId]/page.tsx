import QuizClient from "@/components/quiz-client";

export const metadata = { title: "Quiz · Nasym-ur-Rahmah" };

export default async function Page({ params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { id, quizId } = await params;
  return <QuizClient courseId={id} quizId={quizId} />;
}
