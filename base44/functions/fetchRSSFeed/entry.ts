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

function getAttrValue(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : null;
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

    // Audio URL from enclosure
    const enclosureMatch = item.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i);
    const audioUrl = enclosureMatch ? enclosureMatch[1] : null;

    if (!audioUrl) continue;

    // Image: try itunes:image href, then media:thumbnail, then item image
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url, count = 30 } = await req.json();
    if (!url) return Response.json({ error: 'Missing url' }, { status: 400 });

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Voxyl/1.0 RSS Reader' },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching feed`);

    const xml = await res.text();
    const meta = parseFeedMeta(xml);
    const allItems = parseItems(xml);

    const items = allItems.slice(0, count).map(item => ({
      ...item,
      image: item.image || meta.image,
      feedTitle: meta.title,
    }));

    return Response.json({ title: meta.title, image: meta.image, author: meta.author, description: meta.description, items });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});