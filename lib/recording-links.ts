import { getYouTubeVideoId } from "@/lib/youtube";

export type RecordingProvider = "youtube" | "google-drive" | "jumpshare" | null;

/** A recording link may come from any provider, but never run non-web URL schemes. */
export function isValidRecordingUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 4096) return false;
  try {
    const url = new URL(trimmed);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

/** Identify known providers for optional previews, not to limit saved links. */
export function recordingProvider(value: string): RecordingProvider {
  if (!isValidRecordingUrl(value)) return null;
  const url = new URL(value.trim());
  if (url.protocol !== "https:") return null;

  if (getYouTubeVideoId(url.toString())) return "youtube";
  const host = url.hostname.toLowerCase();
  if (host === "drive.google.com") {
    if (/^\/file\/d\/[a-zA-Z0-9_-]+(?:\/|$)/.test(url.pathname)) return "google-drive";
    if (url.pathname === "/open" && /^[a-zA-Z0-9_-]+$/.test(url.searchParams.get("id") ?? "")) return "google-drive";
  }
  if ((host === "jmp.sh" || host === "www.jmp.sh") && /^\/+[a-zA-Z0-9_-]+[+-]?\/?$/.test(url.pathname)) return "jumpshare";
  if ((host === "jumpshare.com" || host === "www.jumpshare.com") && /^\/(v|s|share)\/[a-zA-Z0-9_-]+(?:\/|$)/.test(url.pathname)) return "jumpshare";
  return null;
}

/** Only known direct media files belong in a native video element. */
export function isDirectVideoUrl(value: string): boolean {
  if (!isValidRecordingUrl(value)) return false;
  try {
    const url = new URL(value.trim());
    return /\.(?:mp4|webm|ogg|ogv|mov|m4v)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

/** Only construct trusted Vimeo embed addresses; arbitrary URLs must never be iframed. */
export function vimeoEmbedUrl(value: string): string | null {
  if (!isValidRecordingUrl(value)) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    if (!["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(url.hostname.toLowerCase())) return null;
    const id = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/)?$/)?.[1];
    if (!id) return null;
    const token = url.searchParams.get("h");
    return `https://player.vimeo.com/video/${id}${token && /^[a-zA-Z0-9]+$/.test(token) ? "?h=" + encodeURIComponent(token) : ""}`;
  } catch {
    return null;
  }
}

export function drivePreviewUrl(value: string): string | null {
  if (recordingProvider(value) !== "google-drive") return null;
  const url = new URL(value.trim());
  const id = url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? url.searchParams.get("id");
  return id && /^[a-zA-Z0-9_-]+$/.test(id) ? `https://drive.google.com/file/d/${id}/preview` : null;
}
