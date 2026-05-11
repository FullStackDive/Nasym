import QuizTakeClient from "@/components/quiz-take-client";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuizTakeClient id={id} />;
}
