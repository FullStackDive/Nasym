"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JitsiMeetExternalAPI: new (domain: string, options: Record<string, unknown>) => any;
  }
}

type ClassSession = {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  roomName: string;
  isLive: boolean;
  courseId: string | null;
  createdBy: { id: string; name: string };
};

const LiveRoomClient = ({ roomName }: { roomName: string }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = useRef<any>(null);
  const [classSession, setClassSession] = useState<ClassSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jitsiReady, setJitsiReady] = useState(false);

  const jitsiDomain = process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? "meet.jit.si";

  // Load session info from DB
  useEffect(() => {
    fetch(`/api/live/${roomName}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setClassSession(data.session);
      })
      .catch(() => setError("Failed to load session"))
      .finally(() => setLoading(false));
  }, [roomName]);

  // Load Jitsi script
  useEffect(() => {
    if (jitsiReady) return;
    const script = document.createElement("script");
    script.src = `https://${jitsiDomain}/external_api.js`;
    script.async = true;
    script.onload = () => setJitsiReady(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [jitsiDomain, jitsiReady]);

  // Init Jitsi once session + script both ready
  useEffect(() => {
    if (!jitsiReady || !classSession || !session || !containerRef.current) return;
    if (apiRef.current) return; // already mounted

    const role = session.user.role;
    const isMod = role === "ADMIN" || role === "TEACHER";

    apiRef.current = new window.JitsiMeetExternalAPI(jitsiDomain, {
      roomName: classSession.roomName,
      parentNode: containerRef.current,
      width: "100%",
      height: "100%",
      userInfo: {
        displayName: session.user.name ?? "Student",
        email: session.user.email ?? "",
      },
      configOverwrite: {
        startWithAudioMuted: !isMod,
        startWithVideoMuted: !isMod,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_BUTTONS: isMod
          ? ["microphone", "camera", "desktop", "chat", "raisehand", "tileview", "participants-pane", "hangup", "recording"]
          : ["microphone", "camera", "chat", "raisehand", "tileview", "hangup"],
      },
    });

    apiRef.current.addEventListener("readyToClose", () => {
      router.back();
    });

    return () => {
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }
    };
  }, [jitsiReady, classSession, session, jitsiDomain, router]);

  // Teacher: toggle isLive
  const setLive = async (live: boolean) => {
    if (!classSession) return;
    const res = await fetch(`/api/courses/${classSession.courseId}/sessions/${classSession.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLive: live }),
    });
    if (res.ok) setClassSession(s => s ? { ...s, isLive: live } : s);
  };

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"var(--bg)" }}>
        <div style={{ color:"var(--ink-3)" }}>Loading room…</div>
      </div>
    );
  }

  if (error || !classSession) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"var(--bg)" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
          <div style={{ fontWeight:600, fontSize:18 }}>{error || "Session not found"}</div>
          <button className="btn btn-secondary" style={{ marginTop:16 }} onClick={() => router.back()}>Go back</button>
        </div>
      </div>
    );
  }

  const role = session?.user?.role;
  const isMod = role === "ADMIN" || role === "TEACHER";

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#111" }}>
      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 20px", background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", zIndex:10, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => router.back()} style={{ background:"transparent", border:"none", color:"rgba(255,255,255,0.7)", cursor:"pointer", fontSize:20, lineHeight:1 }}>←</button>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:"white" }}>{classSession.title}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)" }}>{classSession.createdBy.name}</div>
          </div>
          {classSession.isLive && (
            <span style={{ background:"#e53e3e", color:"white", fontSize:11, fontWeight:800, padding:"3px 8px", borderRadius:999, letterSpacing:"0.06em" }}>● LIVE</span>
          )}
        </div>
        {isMod && (
          <div style={{ display:"flex", gap:8 }}>
            {!classSession.isLive ? (
              <button className="btn btn-primary" style={{ background:"#e53e3e", border:"none" }} onClick={() => setLive(true)}>
                ● Go Live
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => setLive(false)}>
                End Live
              </button>
            )}
          </div>
        )}
      </div>

      {/* Jitsi container */}
      <div ref={containerRef} style={{ flex:1, position:"relative" }}>
        {!jitsiReady && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)" }}>
            Connecting to room…
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveRoomClient;
