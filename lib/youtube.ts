export function getYouTubeVideoId(rawUrl: string): string | null {
  const value = rawUrl.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (
      host === "youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const watchId = url.searchParams.get("v");
      if (watchId) return watchId;

      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0] ?? "")) {
        return parts[1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function toYouTubeEmbedUrl(rawUrl: string): string | null {
  const id = getYouTubeVideoId(rawUrl);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}
