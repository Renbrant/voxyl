import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function getTagValue(xml, tag) {
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'),
  ];
  for (const re of patterns) {
    const m = xml.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

function parseItems(xml) {
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  const items = [];
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const title = getTagValue(item, 'title') || '';
    const pubDate = getTagValue(item, 'pubDate') || '';
    const duration = getTagValue(item, 'itunes:duration') || getTagValue(item, 'duration') || null;

    const enclosureMatch = item.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i);
    const audioUrl = enclosureMatch ? enclosureMatch[1] : null;

    if (!audioUrl) continue;

    const itunesImgMatch = item.match(/<itunes:image[^>]*href=["']([^"']+)["'][^>]*>/i);
    const mediaThumbnailMatch = item.match(/<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*>/i);
    const image = itunesImgMatch?.[1] || mediaThumbnailMatch?.[1] || null;

    const descRaw = getTagValue(item, 'description') || getTagValue(item, 'itunes:summary') || '';
    const description = descRaw.replace(/<[^>]*>/g, '').slice(0, 200).trim();

    items.push({ title, audioUrl, pubDate, duration, image, description });
  }
  return items;
}

function parseFeedMeta(xml) {
  const channelMatch = xml.match(/<channel[\s>]([\s\S]*?)<\/channel>/i);
  if (!channelMatch) return { title: '', image: '', author: '', description: '' };
  const channel = channelMatch[1];
  const title = getTagValue(channel, 'title') || '';
  const itunesImgMatch = channel.match(/<itunes:image[^>]*href=["']([^"']+)["'][^>]*>/i);
  const imgTagMatch = channel.match(/<image[\s>][\s\S]*?<url>([\s\S]*?)<\/url>/i);
  const image = itunesImgMatch?.[1] || imgTagMatch?.[1]?.trim() || '';
  const author = getTagValue(channel, 'itunes:author') || getTagValue(channel, 'managingEditor') || '';
  const descRaw = getTagValue(channel, 'description') || getTagValue(channel, 'itunes:summary') || '';
  const description = descRaw.replace(/<[^>]*>/g, '').slice(0, 300).trim();
  return { title, image, author, description };
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  // Parse body first so we have `url` available in the catch block
  let url, count;
  try {
    const body = await req.json();
    url = body.url;
    count = body.count || 30;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

  // Load any existing cache entry (used both for fresh-enough serving and stale fallback)
  let cachedEntry = null;
  try {
    const cached = await base44.asServiceRole.entities.RSSCache.filter({ feed_url: url });
    if (cached.length > 0) cachedEntry = cached[0];
  } catch {}

  // Serve from cache if fresh enough
  if (cachedEntry) {
    const age = Date.now() - new Date(cachedEntry.cached_at).getTime();
    if (age < CACHE_TTL_MS) {
      const data = JSON.parse(cachedEntry.data);
      return Response.json({ ...data, items: data.items.slice(0, count) });
    }
  }

  // Fetch fresh with 15s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let res;
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': 'Voxyl/1.0 RSS Reader' },
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) throw new Error(`HTTP ${res.status} fetching feed`);

    const xml = await res.text();
    const meta = parseFeedMeta(xml);
    const allItems = parseItems(xml);

    const items = allItems.slice(0, 100).map(item => ({
      ...item,
      image: item.image || meta.image,
      feedTitle: meta.title,
      feedUrl: url,
    }));

    const payload = { title: meta.title, image: meta.image, author: meta.author, description: meta.description, items };

    // Save/update cache (fire and forget)
    const now = new Date().toISOString();
    if (cachedEntry) {
      base44.asServiceRole.entities.RSSCache.update(cachedEntry.id, { data: JSON.stringify(payload), cached_at: now }).catch(() => {});
    } else {
      base44.asServiceRole.entities.RSSCache.create({ feed_url: url, data: JSON.stringify(payload), cached_at: now }).catch(() => {});
    }

    return Response.json({ ...payload, items: items.slice(0, count) });

  } catch (error) {
    // Fetch failed — return stale cache rather than an error so the app never shows empty
    if (cachedEntry) {
      const data = JSON.parse(cachedEntry.data);
      return Response.json({ ...data, items: data.items.slice(0, count), stale: true });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});