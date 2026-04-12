import ClassroomClient from "@/components/classroom-client";

export default function Page({ params }: { params: { id: string } }) {
  return <ClassroomClient id={params.id} />;
}
