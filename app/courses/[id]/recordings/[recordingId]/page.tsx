import RecordingPlayerClient from "@/components/recording-player-client";

export const metadata = { title: "Recording · Nasym-ur-Rahmah" };

export default async function Page({ params }: { params: Promise<{ id: string; recordingId: string }> }) {
  const { id, recordingId } = await params;
  return <RecordingPlayerClient courseId={id} recordingId={recordingId} />;
}
