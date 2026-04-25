"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Badge, Button, Card } from "@/components/ui";
import Link from "next/link";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

type ClassSession = { id: string; title: string; description: string; scheduledAt: string; isLive: boolean; roomName: string };

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ClassroomClient({ id }: { id: string }) {
  const { data: session, status } = useSession();
  const [cls, setCls] = useState<ClassSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);

  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = `/auth/signin`;
    }
  }, [status]);

  useEffect(() => {
    fetch(`/api/classes/${id}`)
      .then((r) => r.json())
      .then((d) => setCls(d.class))
      .catch(() => setError("Could not load class."));
  }, [id]);

  // Load Jitsi IFrame API script once
  useEffect(() => {
    const existing = document.getElementById("jitsi-script");
    if (existing) return;

    const script = document.createElement("script");
    script.id = "jitsi-script";
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    document.body.appendChild(script);
  }, [domain]);

  useEffect(() => {
    if (!cls || !containerRef.current) return;
    if (!window.JitsiMeetExternalAPI) return; // script still loading

    // Clean up if re-render
    if (apiRef.current) {
      try { apiRef.current.dispose(); } catch {}
      apiRef.current = null;
      containerRef.current.innerHTML = "";
    }

    const displayName = session?.user?.name ?? "Student";
    const roomName = cls.roomName;

    apiRef.current = new window.JitsiMeetExternalAPI(domain, {
      roomName,
      parentNode: containerRef.current,
      userInfo: { displayName },
      configOverwrite: {
        prejoinPageEnabled: true
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: "#ffffff"
      }
    });
  }, [cls, domain, session?.user?.name]);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card className="p-6">{error}</Card>
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card className="p-6">Loading classroom…</Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{cls.title}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{cls.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {cls.isLive ? (
              <Badge className="bg-red-100 text-red-800 ring-red-200 dark:bg-red-900/40 dark:text-red-100 dark:ring-red-700/40">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Live
              </Badge>
            ) : (
              <Badge variant="muted">Scheduled</Badge>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(cls.scheduledAt)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/classes"><Button variant="secondary">← Back</Button></Link>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-3 overflow-hidden ring-1 ring-brand-100/60 dark:ring-brand-900/40">
          <div className="min-h-[60vh] bg-slate-950" ref={containerRef} />
        </Card>

        <Card className="p-6">
          <h3 className="font-extrabold tracking-tight">Classroom etiquette</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" /> Be respectful and kind.</li>
            <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" /> Keep your mic muted unless speaking.</li>
            <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" /> Ask questions in chat and wait your turn.</li>
            <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" /> Do not share private info.</li>
          </ul>
          <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
            This live classroom uses Jitsi Meet (WebRTC) embedded via the IFrame API.
          </p>
        </Card>
      </div>
    </div>
  );
}
