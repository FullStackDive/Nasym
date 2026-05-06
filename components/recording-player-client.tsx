"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon, AppBar } from "./ui";

type Recording = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  durationSec: number | null;
  createdAt: string;
  uploadedBy: { id: string; name: string };
};

const isYouTube = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");
const isVimeo = (url: string) => url.includes("vimeo.com");

function toEmbedUrl(url: string): string {
  if (isYouTube(url)) {
    const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?rel=0` : url;
  }
  if (isVimeo(url)) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : url;
  }
  return url;
}

const RecordingPlayerClient = ({ courseId, recordingId }: { courseId: string; recordingId: string }) => {
  const router = useRouter();
  const [navTab, setNavTab] = useState("lessons");
  const [recording, setRecording] = useState<Recording | null>(null);
  const [related, setRelated] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, allRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/recordings`),
        fetch(`/api/courses/${courseId}/recordings`),
      ]);
      if (!recRes.ok) { setError("Recording not found"); return; }
      const { recordings } = await recRes.json();
      const current = recordings.find((r: Recording) => r.id === recordingId);
      if (!current) { setError("Recording not found"); return; }
      setRecording(current);
      setRelated(recordings.filter((r: Recording) => r.id !== recordingId).slice(0, 6));
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, [courseId, recordingId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="app">
        <AppBar active={navTab} onNav={setNavTab} />
        <div className="app-scroll" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
          <div style={{ color:"var(--ink-3)" }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="app">
        <AppBar active={navTab} onNav={setNavTab} />
        <div className="app-scroll" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <div style={{ fontWeight:600 }}>{error || "Not found"}</div>
          </div>
        </div>
      </div>
    );
  }

  const isPrivate = recording.videoUrl.startsWith("private:");
  const streamUrl = isPrivate ? `/api/recordings/${recording.id}/stream` : null;
  const externalUrl = !isPrivate ? recording.videoUrl : null;
  const useEmbed = externalUrl && (isYouTube(externalUrl) || isVimeo(externalUrl));
  const embedUrl = externalUrl ? toEmbedUrl(externalUrl) : null;

  const duration = recording.durationSec
    ? `${Math.floor(recording.durationSec / 60)}:${String(recording.durationSec % 60).padStart(2, "0")}`
    : null;

  return (
    <div className="app">
      <AppBar active={navTab} onNav={setNavTab} />
      <div className="app-scroll">
        <div style={{ maxWidth: 1100, margin:"0 auto", padding:"28px 32px 64px" }}>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom:18 }} onClick={() => router.push(`/courses/${courseId}?tab=recordings`)}>
            ← Back to recordings
          </button>

          <div style={{ display:"grid", gridTemplateColumns:"1.6fr .7fr", gap:28 }}>
            {/* Player */}
            <div>
              <div style={{ position:"relative", width:"100%", aspectRatio:"16/9", background:"#000", borderRadius:16, overflow:"hidden", marginBottom:18 }}>
                {streamUrl && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    controls
                    style={{ width:"100%", height:"100%", display:"block" }}
                    preload="metadata"
                  >
                    <source src={streamUrl} />
                    Your browser does not support the video tag.
                  </video>
                )}
                {useEmbed && embedUrl && (
                  <iframe
                    src={embedUrl}
                    style={{ width:"100%", height:"100%", border:"none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={recording.title}
                  />
                )}
                {externalUrl && !useEmbed && (
                  // Direct video URL (mp4, webm, etc. hosted externally)
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    controls
                    style={{ width:"100%", height:"100%", display:"block" }}
                    preload="metadata"
                  >
                    <source src={externalUrl} />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>

              {/* Metadata */}
              <h1 style={{ fontSize:22, fontWeight:800, margin:"0 0 8px" }}>{recording.title}</h1>
              <div style={{ display:"flex", gap:16, fontSize:13, color:"var(--ink-3)", marginBottom:14 }}>
                <span><Icon name="user" size={13}/> {recording.uploadedBy.name}</span>
                {duration && <span><Icon name="clock" size={13}/> {duration}</span>}
                <span><Icon name="calendar" size={13}/> {new Date(recording.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</span>
                {isPrivate && <span style={{ color:"var(--brand-700)", fontWeight:600 }}><Icon name="lock" size={12}/> Enrolled-only</span>}
              </div>
              {recording.description && (
                <div className="surface" style={{ padding:18 }}>
                  <p style={{ margin:0, lineHeight:1.75, color:"var(--ink-2)", whiteSpace:"pre-wrap" }}>{recording.description}</p>
                </div>
              )}
            </div>

            {/* Sidebar: related recordings */}
            <div>
              <div style={{ fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-3)", marginBottom:12 }}>More recordings</div>
              {related.length === 0 ? (
                <div style={{ fontSize:13, color:"var(--ink-3)" }}>No other recordings.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {related.map(r => (
                    <button
                      key={r.id}
                      onClick={() => router.push(`/courses/${courseId}/recordings/${r.id}`)}
                      style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--hairline)", borderRadius:12, cursor:"pointer", textAlign:"left", fontFamily:"inherit", color:"inherit", width:"100%" }}
                    >
                      <div style={{ width:60, aspectRatio:"16/9", background:"linear-gradient(135deg, var(--brand-700), var(--brand-900))", borderRadius:6, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Icon name="play" size={14} />
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, lineHeight:1.3, marginBottom:2 }}>{r.title}</div>
                        <div style={{ fontSize:11, color:"var(--ink-3)" }}>{r.uploadedBy.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingPlayerClient;
