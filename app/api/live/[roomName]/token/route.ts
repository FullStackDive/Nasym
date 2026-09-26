import { NextResponse } from "next/server";
import { createJaaSMeetingConfig } from "@/lib/jaas";
import { resolveRoomAccess } from "@/lib/live-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/live/[roomName]/token
// Returns a short-lived per-user JaaS JWT when JaaS credentials are configured.
// Until then, it safely falls back to the existing free meet.jit.si integration.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ roomName: string }> }
) {
  const { roomName } = await params;
  const access = await resolveRoomAccess(roomName);
  if (access instanceof NextResponse) return access;

  try {
    const jaas = await createJaaSMeetingConfig({
      roomName,
      user: access.user,
      isModerator: access.isMod,
    });

    if (jaas) {
      return NextResponse.json(jaas, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }
  } catch (error) {
    console.error("[jaas-token] failed:", error);
    return NextResponse.json(
      { error: "Video classroom authentication could not be created." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      provider: "public-jitsi",
      domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? "meet.jit.si",
      roomName,
      jwt: null,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
