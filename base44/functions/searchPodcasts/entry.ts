import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const API_KEY = Deno.env.get('PODCAST_INDEX_API_KEY');
const API_SECRET = Deno.env.get('PODCAST_INDEX_API_SECRET');

async function getPodcastIndexHeaders() {
  const apiHeaderTime = Math.floor(Date.now() / 1000);
  const hashInput = API_KEY + API_SECRET + apiHeaderTime;
  const msgBuffer = new TextEncoder().encode(hashInput);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return {
    'X-Auth-Date': String(apiHeaderTime),
    'X-Auth-Key': API_KEY,
    'Authorization': hash,
    'User-Agent': 'Voxyl/1.0',
  };
}

async function fetchRecentEpisodeDurations(feedUrl) {
  try {
    const headers = await getPodcastIndexHeaders();
    const url = `https://api.podcastindex.org/api/1.0/episodes/byfeedurl?url=${encodeURIComponent(feedUrl)}&max=5`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    const items = data.items || [];
    return items.map(ep => ep.duration || 0).filter(d => d > 0);
  } catch {
    return [];
  }
}

// Language code normalization: some feeds return "pt-BR", "pt-br", "Portuguese", etc.
function normalizeLanguage(lang) {
  if (!lang) return '';
  return lang.toLowerCase().replace(/_/g, '-').split('-')[0].trim();
}

const LANGUAGE_CODES = {
  'pt': ['pt', 'portuguese', 'portugues', 'português'],
  'en': ['en', 'english'],
  'es': ['es', 'spanish', 'espanol', 'español'],
  'fr': ['fr', 'french', 'français', 'francais'],
  'de': ['de', 'german', 'deutsch'],
  'it': ['it', 'italian', 'italiano'],
  'ja': ['ja', 'japanese', '日本語'],
};

function matchesLanguage(feedLang, filterLang) {
  if (!filterLang) return true;
  if (!feedLang) return false;
  const normalized = normalizeLanguage(feedLang);
  const aliases = LANGUAGE_CODES[filterLang] || [filterLang];
  return aliases.some(alias => normalized === alias || feedLang.toLowerCase().startsWith(alias));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query: rawQuery, maxDuration = 0, language = '', sortBy = 'relevance', category = '' } = await req.json();

    // Build effective query: combine user query + category if set
    const effectiveQuery = category && !rawQuery?.trim()
      ? category
      : category && rawQuery?.trim()
        ? `${rawQuery.trim()} ${category}`
        : rawQuery?.trim() || '';

    if (!effectiveQuery) return Response.json({ results: [] });

    const headers = await getPodcastIndexHeaders();

    // Fetch more results so filtering doesn't leave too few
    let searchUrl = `https://api.podcastindex.org/api/1.0/search/byterm?q=${encodeURIComponent(effectiveQuery)}&max=40&fulltext`;

    if (sortBy === 'newest') {
      searchUrl += '&sort=newestepisode';
    } else if (sortBy === 'popularity') {
      searchUrl += '&sort=score';
    }

    const searchRes = await fetch(searchUrl, { headers });
    const searchData = await searchRes.json();
    let feeds = searchData.feeds || [];

    // Filter by language client-side (the API lang param is unreliable)
    if (language) {
      feeds = feeds.filter(f => matchesLanguage(f.language, language));
    }

    // Filter by maxDuration if active
    if (maxDuration > 0) {
      const maxSeconds = maxDuration * 60;
      const filtered = await Promise.all(
        feeds.map(async (feed) => {
          const durations = await fetchRecentEpisodeDurations(feed.url);
          if (durations.length === 0) return feed;
          const hasMatch = durations.some(d => d <= maxSeconds);
          return hasMatch ? feed : null;
        })
      );
      feeds = filtered.filter(Boolean);
    }

    return Response.json({
      results: feeds.slice(0, 20).map(f => ({
        id: f.id,
        title: f.title,
        author: f.author,
        description: f.description,
        image: f.image || f.artwork,
        feedUrl: f.url,
        episodeCount: f.episodeCount,
        language: f.language,
        categories: f.categories,
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});