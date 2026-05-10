const YOUTUBE_HOSTS = new Set([
  'youtu.be',
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
]);

function withProtocol(input: string): string {
  const value = input.trim();
  if (!value) return value;
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(value)) {
    return value;
  }

  if (
    value.startsWith('youtu.be/') ||
    value.startsWith('youtube.com/') ||
    value.startsWith('www.youtube.com/') ||
    value.startsWith('m.youtube.com/') ||
    value.startsWith('music.youtube.com/')
  ) {
    return `https://${value}`;
  }

  return value;
}

export function normalizeYouTubeInputUrl(input: string): string | null {
  try {
    const candidate = withProtocol(input);
    const u = new URL(candidate);
    const host = u.hostname.toLowerCase();

    if (!YOUTUBE_HOSTS.has(host)) {
      return null;
    }

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/watch?v=${id}` : null;
    }

    if (
      host === 'youtube.com' ||
      host === 'www.youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com'
    ) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/watch?v=${v}`;

      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts[0];
      if (idx === 'shorts' || idx === 'embed' || idx === 'live') {
        return parts[1] ? `https://www.youtube.com/watch?v=${parts[1]}` : null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeVideoId(url: string): string | null {
  try {
    const normalized = normalizeYouTubeInputUrl(url);
    if (!normalized) return null;

    const u = new URL(normalized);
    return u.searchParams.get('v');
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
