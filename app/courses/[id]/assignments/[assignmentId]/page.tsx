import AssignmentDetailClient from "@/components/assignment-detail-client";

export const metadata = { title: "Assignment · Nasym-ur-Rahmah" };

export default async function Page({ params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { id, assignmentId } = await params;
  return <AssignmentDetailClient courseId={id} assignmentId={assignmentId} />;
}
