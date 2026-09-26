"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

type Message = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
};

type Hand = {
  id: string;
  raisedAt: string;
  question: string | null;
  user: { id: string; name: string; role: string };
};

const POLL_MS = 3000;

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");
}

type MeetingConfig = {
  provider: "jaas" | "public-jitsi";
  domain: string;
  roomName: string;
  jwt: string | null;
};

type Props = { roomName?: string; classId?: string };

const ClassroomClient = ({ roomName: roomNameProp, classId }: Props) => {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [roomName, setRoomName] = useState<string | null>(roomNameProp ?? null);
  const [classSession, setClassSession] = useState<ClassSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiRef = useRef<any>(null);
  const [jitsiReady, setJitsiReady] = useState(false);
  const [meetingConfig, setMeetingConfig] = useState<MeetingConfig | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [hands, setHands] = useState<Hand[]>([]);
  const [isMod, setIsMod] = useState(false);
  const [myHandUp, setMyHandUp] = useState(false);
  const [questionDraft, setQuestionDraft] = useState("");

  const [tab, setTab] = useState<"chat" | "qa" | "people">("chat");

  // 1) Resolve roomName: from prop, or fetch via classId
  useEffect(() => {
    if (roomNameProp) {
      setRoomName(roomNameProp);
      return;
    }
    if (!classId) {
      setError("Missing classroom identifier");
      setLoading(false);
      return;
    }
    fetch(`/api/classes/${classId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error || !d.class) {
          setError(d.error ?? "Class not found");
          setLoading(false);
          return;
        }
        setRoomName(d.class.roomName);
      })
      .catch(() => {
        setError("Failed to load class");
        setLoading(false);
      });
  }, [roomNameProp, classId]);

  // 2) Resolve classSession via roomName (this enforces access)
  useEffect(() => {
    if (!roomName) return;
    setLoading(true);
    fetch(`/api/live/${roomName}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setError(d.error);
          return;
        }
        setClassSession(d.session);
      })
      .catch(() => setError("Failed to load session"))
      .finally(() => setLoading(false));
  }, [roomName]);

  // 3) Resolve the meeting backend. With JaaS configured this returns a
  // short-lived, user-specific JWT; otherwise it keeps the current free
  // meet.jit.si fallback until credentials are added.
  useEffect(() => {
    if (!roomName || !classSession) return;
    setMeetingConfig(null);
    setJitsiReady(false);

    fetch(`/api/live/${encodeURIComponent(roomName)}/token`, { cache: "no-store" })
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok || d.error) throw new Error(d.error ?? "Failed to authorize video classroom");
        setMeetingConfig(d as MeetingConfig);
      })
      .catch(err => setError(err instanceof Error ? err.message : "Failed to authorize video classroom"));
  }, [roomName, classSession]);

  // 4) Load the correct Jitsi/JaaS iframe script
  useEffect(() => {
    if (!meetingConfig || jitsiReady) return;
    if (typeof window === "undefined") return;
    if (window.JitsiMeetExternalAPI) {
      setJitsiReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://${meetingConfig.domain}/external_api.js`;
    script.async = true;
    script.onload = () => setJitsiReady(true);
    script.onerror = () => setError("Video classroom service could not be loaded.");
    document.head.appendChild(script);

    return () => {
      script.onerror = null;
      script.onload = null;
    };
  }, [meetingConfig, jitsiReady]);

  // 5) Mount the video classroom iframe
  useEffect(() => {
    if (!jitsiReady || !meetingConfig || !classSession || !session || !containerRef.current) return;
    if (apiRef.current) return;

    const role = session.user.role;
    const mod = role === "ADMIN" || role === "TEACHER" || classSession.createdBy.id === session.user.id;
    setIsMod(mod);

    const options: Record<string, unknown> = {
      roomName: meetingConfig.roomName,
      parentNode: containerRef.current,
      width: "100%",
      height: "100%",
      userInfo: {
        displayName: session.user.name ?? "Student",
        email: session.user.email ?? "",
      },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        disableDeepLinking: true,
        prejoinConfig: { enabled: false },
        disableInitialGUM: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_BUTTONS: mod
          ? ["microphone", "camera", "desktop", "chat", "raisehand", "tileview", "participants-pane", "hangup", "settings"]
          : ["microphone", "camera", "chat", "raisehand", "tileview", "hangup", "settings"],
      },
    };

    if (meetingConfig.jwt) options.jwt = meetingConfig.jwt;

    apiRef.current = new window.JitsiMeetExternalAPI(meetingConfig.domain, options);

    // Explicitly grant media permissions to the cross-origin JaaS iframe.
    // Some desktop Chromium builds do not expose camera/microphone inside
    // an embedded 8x8.vc conference unless the iframe has an allow policy.
    let mediaPermissionObserver: MutationObserver | null = null;
    const applyIframePermissions = () => {
      const iframe = containerRef.current?.querySelector("iframe");
      if (!iframe) return false;

      iframe.setAttribute(
        "allow",
        "camera *; microphone *; display-capture *; autoplay *; fullscreen *; picture-in-picture *"
      );
      iframe.setAttribute("allowfullscreen", "true");
      return true;
    };

    if (!applyIframePermissions() && containerRef.current) {
      mediaPermissionObserver = new MutationObserver(() => {
        if (applyIframePermissions()) {
          mediaPermissionObserver?.disconnect();
          mediaPermissionObserver = null;
        }
      });
      mediaPermissionObserver.observe(containerRef.current, { childList: true, subtree: true });
    }

    apiRef.current.addEventListener("readyToClose", () => {
      router.push("/classes");
    });

    return () => {
      mediaPermissionObserver?.disconnect();
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [jitsiReady, meetingConfig, classSession, session, router]);

  // 6) Poll chat
  const fetchMessages = useCallback(async () => {
    if (!roomName) return;
    const lastIso = messages.length ? messages[messages.length - 1].createdAt : null;
    const url = `/api/live/${roomName}/messages${lastIso ? `?since=${encodeURIComponent(lastIso)}` : ""}`;
    const res = await fetch(url).catch(() => null);
    if (!res || !res.ok) return;
    const d = await res.json().catch(() => null);
    if (!d?.messages?.length) return;
    setMessages(prev => {
      const seen = new Set(prev.map(m => m.id));
      const fresh = (d.messages as Message[]).filter(m => !seen.has(m.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, [roomName, messages]);

  useEffect(() => {
    if (!roomName || !classSession) return;
    void fetchMessages();
    const t = setInterval(() => void fetchMessages(), POLL_MS);
    return () => clearInterval(t);
  }, [roomName, classSession, fetchMessages]);

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    if (tab !== "chat") return;
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, tab]);

  // 7) Poll hands
  const fetchHands = useCallback(async () => {
    if (!roomName) return;
    const res = await fetch(`/api/live/${roomName}/hands`).catch(() => null);
    if (!res || !res.ok) return;
    const d = await res.json().catch(() => null);
    if (!d?.hands) return;
    setHands(d.hands as Hand[]);
    if (typeof d.isMod === "boolean") setIsMod(d.isMod);
    if (session?.user?.id) {
      setMyHandUp((d.hands as Hand[]).some(h => h.user.id === session.user.id));
    }
  }, [roomName, session]);

  useEffect(() => {
    if (!roomName || !classSession) return;
    void fetchHands();
    const t = setInterval(() => void fetchHands(), POLL_MS);
    return () => clearInterval(t);
  }, [roomName, classSession, fetchHands]);

  // Actions
  const sendMessage = useCallback(async () => {
    const body = chatInput.trim();
    if (!body || !roomName || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/live/${roomName}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.message) {
          setMessages(prev =>
            prev.some(m => m.id === d.message.id) ? prev : [...prev, d.message]
          );
        }
        setChatInput("");
      }
    } finally {
      setSending(false);
    }
  }, [chatInput, roomName, sending]);

  const raiseHand = useCallback(async () => {
    if (!roomName) return;
    await fetch(`/api/live/${roomName}/hands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: questionDraft.trim() || undefined }),
    });
    setQuestionDraft("");
    void fetchHands();
  }, [roomName, questionDraft, fetchHands]);

  const lowerHand = useCallback(
    async (handId: string) => {
      if (!roomName) return;
      await fetch(`/api/live/${roomName}/hands`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handId, lower: true }),
      });
      void fetchHands();
    },
    [roomName, fetchHands]
  );

  const setLive = useCallback(
    async (live: boolean) => {
      if (!classSession) return;
      const res = await fetch(`/api/live/${classSession.roomName}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: live }),
      });
      if (res.ok) setClassSession(s => (s ? { ...s, isLive: live } : s));
    },
    [classSession]
  );

  const participants = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string }>();
    messages.forEach(m => map.set(m.user.id, m.user));
    hands.forEach(h => map.set(h.user.id, h.user));
    if (classSession) map.set(classSession.createdBy.id, { ...classSession.createdBy, role: "TEACHER" });
    if (session?.user?.id)
      map.set(session.user.id, { id: session.user.id, name: session.user.name ?? "You", role: session.user.role });
    return Array.from(map.values());
  }, [messages, hands, classSession, session]);

  if (authStatus === "loading" || loading) {
    return (
      <div style={containerStyle}>
        <div style={{ color: "rgba(255,255,255,0.7)" }}>Loading classroom…</div>
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Sign in required</div>
          <button onClick={() => router.push("/auth/signin")} style={primaryBtn}>Sign in</button>
        </div>
      </div>
    );
  }

  if (error || !classSession) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{error || "Session not found"}</div>
          <button onClick={() => router.push("/classes")} style={{ ...secondaryBtn, marginTop: 16 }}>
            Back to classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0e1411", color: "white" }}>
      {/* Top bar */}
      <div style={topBar}>
        <button onClick={() => router.push("/classes")} style={iconBtn} aria-label="Back">←</button>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{classSession.title}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            {classSession.createdBy.name} · {new Date(classSession.scheduledAt).toLocaleString()}
          </div>
        </div>
        {classSession.isLive && (
          <span style={liveBadge}>● LIVE</span>
        )}
        <div style={{ flex: 1 }} />
        {isMod && (
          classSession.isLive ? (
            <button onClick={() => setLive(false)} style={secondaryBtn}>End live</button>
          ) : (
            <button onClick={() => setLive(true)} style={{ ...primaryBtn, background: "#e53e3e" }}>● Go live</button>
          )
        )}
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", flex: 1, minHeight: 0 }}>
        {/* Stage: Jitsi */}
        <div ref={containerRef} style={{ position: "relative", background: "#111" }}>
          {(!meetingConfig || !jitsiReady) && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)" }}>
              Connecting to room…
            </div>
          )}
        </div>

        {/* Right rail */}
        <div style={rightRail}>
          <div style={tabsRow}>
            {([
              ["chat", `Chat${messages.length ? ` · ${messages.length}` : ""}`],
              ["qa", `Q&A${hands.length ? ` · ${hands.length}` : ""}`],
              ["people", `People · ${participants.length}`],
            ] as [typeof tab, string][]).map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={tabBtn(tab === k)}>{label}</button>
            ))}
          </div>

          {tab === "chat" && (
            <>
              <div ref={chatScrollRef} style={chatScroll}>
                {messages.length === 0 ? (
                  <div style={{ fontSize: 13, opacity: 0.5, textAlign: "center", marginTop: 24 }}>
                    No messages yet. Say salām!
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                      <div style={avatarStyle}>{initialsOf(m.user.name)}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{m.user.name}</span>
                          {(m.user.role === "TEACHER" || m.user.role === "ADMIN") && (
                            <span style={roleBadge}>{m.user.role === "ADMIN" ? "Admin" : "Teacher"}</span>
                          )}
                          <span style={{ fontSize: 11, opacity: 0.5 }}>{timeOf(m.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2, lineHeight: 1.45, wordBreak: "break-word" }}>
                          {m.body}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  void sendMessage();
                }}
                style={chatInputRow}
              >
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Send a message…"
                  maxLength={2000}
                  style={chatInputStyle}
                />
                <button type="submit" disabled={sending || !chatInput.trim()} style={{ ...primaryBtn, padding: "8px 14px" }}>
                  Send
                </button>
              </form>
            </>
          )}

          {tab === "qa" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ flex: 1, padding: 14, overflowY: "auto" }}>
                {hands.length === 0 ? (
                  <div style={{ fontSize: 13, opacity: 0.5, textAlign: "center", marginTop: 24 }}>
                    No hands raised.
                  </div>
                ) : (
                  hands.map((h, idx) => (
                    <div key={h.id} style={handRow(idx === 0)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={avatarStyle}>{initialsOf(h.user.name)}</div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{h.user.name}</div>
                          <div style={{ fontSize: 10, opacity: 0.55 }}>raised {timeOf(h.raisedAt)}</div>
                        </div>
                        {(isMod || h.user.id === session?.user?.id) && (
                          <button onClick={() => lowerHand(h.id)} style={ghostBtn}>Lower</button>
                        )}
                      </div>
                      {h.question && (
                        <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.45, color: "rgba(255,255,255,0.9)" }}>
                          {h.question}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 8 }}>
                <textarea
                  value={questionDraft}
                  onChange={e => setQuestionDraft(e.target.value)}
                  placeholder="Optional: type your question…"
                  rows={2}
                  maxLength={500}
                  style={{ ...chatInputStyle, resize: "vertical" }}
                />
                <button
                  onClick={() => void raiseHand()}
                  style={{ ...primaryBtn, background: myHandUp ? "#f5b450" : undefined, color: myHandUp ? "#111" : "white" }}
                >
                  ✋ {myHandUp ? "Update raised hand" : "Raise hand"}
                </button>
              </div>
            </div>
          )}

          {tab === "people" && (
            <div style={{ flex: 1, padding: 14, overflowY: "auto" }}>
              {participants.map(p => (
                <div key={p.id} style={peopleRow}>
                  <div style={avatarStyle}>{initialsOf(p.name)}</div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                  {(p.role === "TEACHER" || p.role === "ADMIN") && (
                    <span style={{ ...roleBadge, marginLeft: 4 }}>{p.role === "ADMIN" ? "Admin" : "Teacher"}</span>
                  )}
                  {hands.some(h => h.user.id === p.id) && (
                    <span style={{ marginLeft: "auto", fontSize: 14 }}>✋</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  background: "#0e1411",
};

const topBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 16px",
  background: "rgba(0,0,0,0.7)",
  backdropFilter: "blur(8px)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  flexShrink: 0,
};

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.75)",
  cursor: "pointer",
  fontSize: 20,
  lineHeight: 1,
};

const liveBadge: React.CSSProperties = {
  background: "#e53e3e",
  color: "white",
  fontSize: 11,
  fontWeight: 800,
  padding: "3px 8px",
  borderRadius: 999,
  letterSpacing: "0.06em",
};

const primaryBtn: React.CSSProperties = {
  background: "oklch(0.55 0.13 162)",
  border: "none",
  color: "white",
  padding: "8px 16px",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  padding: "8px 16px",
  borderRadius: 10,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "rgba(255,255,255,0.8)",
  padding: "4px 10px",
  borderRadius: 8,
  fontSize: 11,
  cursor: "pointer",
};

const rightRail: React.CSSProperties = {
  borderLeft: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
};

const tabsRow: React.CSSProperties = {
  display: "flex",
  padding: 6,
  gap: 4,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  flexShrink: 0,
};

const tabBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  background: active ? "rgba(255,255,255,0.10)" : "transparent",
  color: active ? "white" : "rgba(255,255,255,0.6)",
  border: "none",
  borderRadius: 10,
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
});

const chatScroll: React.CSSProperties = {
  flex: 1,
  padding: 14,
  overflowY: "auto",
};

const chatInputRow: React.CSSProperties = {
  padding: 10,
  borderTop: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  gap: 8,
  flexShrink: 0,
};

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  padding: "9px 12px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "white",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none",
};

const avatarStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  flexShrink: 0,
  borderRadius: 999,
  background: "linear-gradient(135deg, oklch(0.55 0.13 162), oklch(0.30 0.08 165))",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 700,
  color: "white",
};

const roleBadge: React.CSSProperties = {
  background: "oklch(0.55 0.13 162)",
  color: "white",
  fontSize: 10,
  fontWeight: 700,
  padding: "1px 6px",
  borderRadius: 6,
};

const handRow = (top: boolean): React.CSSProperties => ({
  padding: 12,
  marginBottom: 10,
  background: top ? "rgba(245,180,80,0.12)" : "rgba(255,255,255,0.05)",
  border: "1px solid " + (top ? "rgba(245,180,80,0.5)" : "rgba(255,255,255,0.08)"),
  borderRadius: 12,
});

const peopleRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  borderRadius: 10,
  background: "rgba(255,255,255,0.04)",
  marginBottom: 6,
};

export default ClassroomClient;
