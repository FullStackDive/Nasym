import ClassroomClient from "@/components/classroom-client";

export const metadata = { title: "Classroom · Nasym-ur-Rahmah" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClassroomClient classId={id} />;
}
