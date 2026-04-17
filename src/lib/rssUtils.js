export async function fetchRSSFeed(url) {
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&api_key=&count=30`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error('Failed to fetch RSS feed');
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message || 'RSS error');
  return {
    title: data.feed.title,
    description: data.feed.description,
    image: data.feed.image,
    items: data.items.map(item => ({
      title: item.title,
      description: item.description?.replace(/<[^>]*>/g, '').slice(0, 200),
      audioUrl: item.enclosure?.link || item.link,
      pubDate: item.pubDate,
      duration: item.itunes_duration || null,
      image: item.thumbnail || data.feed.image,
      feedTitle: data.feed.title,
    })).filter(item => item.audioUrl)
  };
}

export function parseDurationToSeconds(duration) {
  if (!duration) return null;
  if (typeof duration === 'number') return duration;
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseInt(duration) || null;
}

export function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function generateShareToken() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}