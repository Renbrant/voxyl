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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query, maxDuration = 0, language = '', sortBy = 'relevance' } = await req.json();
    if (!query?.trim()) return Response.json({ results: [] });

    const headers = await getPodcastIndexHeaders();
    let searchUrl = `https://api.podcastindex.org/api/1.0/search/byterm?q=${encodeURIComponent(query)}&max=20&fulltext`;
    
    // Add language filter if specified
    if (language) {
      searchUrl += `&lang=${encodeURIComponent(language)}`;
    }
    
    // Add sort parameter
    if (sortBy === 'newest') {
      searchUrl += '&sort=newestepisode';
    } else if (sortBy === 'popularity') {
      searchUrl += '&sort=score';
    }

    const searchRes = await fetch(searchUrl, { headers });
    const searchData = await searchRes.json();
    const feeds = searchData.feeds || [];

    // If maxDuration filter active, check recent episode durations
    let results = feeds;
    if (maxDuration > 0) {
      const maxSeconds = maxDuration * 60;
      const filtered = await Promise.all(
        feeds.map(async (feed) => {
          const durations = await fetchRecentEpisodeDurations(feed.url);
          if (durations.length === 0) return feed; // can't filter, include
          const hasMatch = durations.some(d => d <= maxSeconds);
          return hasMatch ? feed : null;
        })
      );
      results = filtered.filter(Boolean);
    }

    return Response.json({
      results: results.map(f => ({
        id: f.id,
        title: f.title,
        author: f.author,
        description: f.description,
        image: f.image || f.artwork,
        feedUrl: f.url,
        episodeCount: f.episodeCount,
        language: f.language,
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});