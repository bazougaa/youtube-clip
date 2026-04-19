export function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = u.searchParams.get('v');
      if (v) return v;

      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts[0];
      if (idx === 'shorts' || idx === 'embed') {
        return parts[1] || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnailUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
}

export function getYouTubeClipEmbedUrl(url: string, start: number, end: number): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;

  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    controls: "1",
    autoplay: "1",
    start: String(Math.max(0, Math.floor(start))),
    end: String(Math.max(Math.floor(start) + 1, Math.ceil(end))),
  });

  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}
