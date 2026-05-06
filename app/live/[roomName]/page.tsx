import LiveRoomClient from "@/components/live-room-client";

export const metadata = { title: "Live Class · Nasym-ur-Rahmah" };

export default async function Page({ params }: { params: Promise<{ roomName: string }> }) {
  const { roomName } = await params;
  return <LiveRoomClient roomName={roomName} />;
}
