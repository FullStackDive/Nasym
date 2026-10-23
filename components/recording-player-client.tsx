"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon, AppBar } from "./ui";
import { getYouTubeVideoId, toYouTubeEmbedUrl } from "@/lib/youtube";
import { recordingProvider, drivePreviewUrl, isDirectVideoUrl, vimeoEmbedUrl } from "@/lib/recording-links";

type Recording = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  durationSec: number | null;
  createdAt: string;
  uploadedBy: { id: string; name: string };
  classSession: { id: string; title: string; scheduledAt: string } | null;
};


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
      const recRes = await fetch(`/api/courses/${courseId}/recordings`);
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
  const provider = externalUrl ? recordingProvider(externalUrl) : null;
  const youtubeId = externalUrl && provider === "youtube" ? getYouTubeVideoId(externalUrl) : null;
  const youtubeEmbed = youtubeId && /^[a-zA-Z0-9_-]{6,64}$/.test(youtubeId)
    ? toYouTubeEmbedUrl(externalUrl!) : null;
  const vimeoEmbed = externalUrl ? vimeoEmbedUrl(externalUrl) : null;
  const driveEmbed = provider === "google-drive" && externalUrl ? drivePreviewUrl(externalUrl) : null;
  const directVideo = externalUrl ? isDirectVideoUrl(externalUrl) : false;
  const embedUrl = youtubeEmbed || vimeoEmbed;
  const showExternalLink = Boolean(externalUrl && !embedUrl && !driveEmbed && !directVideo);

  const duration = recording.durationSec
    ? `${Math.floor(recording.durationSec / 60)}:${String(recording.durationSec % 60).padStart(2, "0")}`
    : null;

  return (
    <div className="app">
      <AppBar active={navTab} onNav={setNavTab} />
      <div className="app-scroll">
        <div style={{ maxWidth: 1100, margin:"0 auto", padding:"clamp(16px, 4vw, 32px) clamp(14px, 4vw, 32px) 64px" }}>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom:18 }} onClick={() => router.push(`/courses/${courseId}?tab=recordings`)}>
            ← Back to recordings
          </button>

          <div className="recording-detail-grid" style={{ display:"grid", gridTemplateColumns:"minmax(0,1.6fr) minmax(0,.7fr)", gap:28 }}>
            {/* Player */}
            <div>
              <div style={{ position:"relative", width:"100%", aspectRatio:"16/9", background:"#102d35", borderRadius:16, overflow:"hidden", marginBottom:18 }}>
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
                {embedUrl && (
                  <iframe
                    src={embedUrl}
                    style={{ width:"100%", height:"100%", border:"none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={recording.title}
                  />
                )}
                {driveEmbed && (
                  <iframe src={driveEmbed} title={recording.title} style={{ width:"100%", height:"100%", border:0 }} allowFullScreen />
                )}
                {showExternalLink && externalUrl && (
                  <div style={{ height:"100%", padding:16, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, textAlign:"center", color:"white", fontSize:13 }}>
                    <Icon name="play" size={24} />
                    <span>This recording is hosted on an external website.</span>
                    <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      Open recording ↗
                    </a>
                  </div>
                )}
                {directVideo && externalUrl && (
                  // Media file hosted externally, rather than an arbitrary web page.
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

              {externalUrl && (
                <p style={{ margin:"0 0 18px", fontSize:13, color:"var(--ink-3)", lineHeight:1.7 }}>
                  <a href={externalUrl} target="_blank" rel="noopener noreferrer" style={{ color:"var(--brand-700)", fontWeight:700 }}>Open the original recording link ↗</a>
                  {" · "}Access and playback depend on the external website and its sharing settings.
                </p>
              )}
              {/* Metadata */}
              <h1 style={{ fontSize:22, fontWeight:800, margin:"0 0 8px" }}>{recording.title}</h1>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", fontSize:13, color:"var(--ink-3)", marginBottom:14 }}>
                <span><Icon name="user" size={13}/> {recording.uploadedBy.name}</span>
                {duration && <span><Icon name="clock" size={13}/> {duration}</span>}
                {recording.classSession && (
                  <span><Icon name="calendar" size={13}/> {recording.classSession.title} · {new Date(recording.classSession.scheduledAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</span>
                )}
                <span><Icon name="calendar" size={13}/> Added {new Date(recording.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}</span>
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
