import ClassroomClient from "@/components/classroom-client";

export const metadata = { title: "Live Class · Nasym-ur-Rahmah" };

export default async function Page({ params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = await params;
  return <ClassroomClient roomName={roomName} />;
}
