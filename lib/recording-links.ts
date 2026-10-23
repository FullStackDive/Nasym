import { getYouTubeVideoId } from "@/lib/youtube";

export type RecordingProvider = "youtube" | "google-drive" | "jumpshare" | null;

// Allow only well-known recording hosts; prevent unsafe schemes, lookalike
// domains and arbitrary external links being presented as trusted recordings.
export function recordingProvider(value: string): RecordingProvider {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    if (getYouTubeVideoId(url.toString())) return "youtube";
    const host = url.hostname.toLowerCase();
    if (host === "drive.google.com") {
      if (/^\/file\/d\/[a-zA-Z0-9_-]+(?:\/|$)/.test(url.pathname)) return "google-drive";
      if (url.pathname === "/open" && /^[a-zA-Z0-9_-]+$/.test(url.searchParams.get("id") ?? "")) return "google-drive";
    }
    if ((host === "jumpshare.com" || host === "www.jumpshare.com") && /^\/(v|s)\/[a-zA-Z0-9_-]+(?:\/|$)/.test(url.pathname)) return "jumpshare";
    return null;
  } catch { return null; }
}

export function drivePreviewUrl(value: string): string | null {
  if (recordingProvider(value) !== "google-drive") return null;
  const url = new URL(value);
  const id = url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? url.searchParams.get("id");
  return id && /^[a-zA-Z0-9_-]+$/.test(id) ? `https://drive.google.com/file/d/${id}/preview` : null;
}
