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

// Map our category labels to Podcast Index category IDs
const CATEGORY_MAP = {
  'tecnologia': 102,
  'negócios': 9,
  'educação': 11,
  'entretenimento': 12,
  'esportes': 77,
  'saúde': 14,
  'notícias': 55,
  'ciência': 67,
  'história': null,
  'true crime': 103,
  'comédia': 10,
  'política': 59,
};

// Generate query variations to get more diverse results
function buildQueries(query, category) {
  const q = query?.trim() || '';
  const cat = category?.toLowerCase().trim() || '';
  const queries = new Set();

  if (q) queries.add(q);

  // Add category-enriched queries only if category is meaningful (not generic)
  if (q && cat && CATEGORY_MAP[cat] === null) {
    // Unmapped category — add as a keyword combo
    queries.add(`${q} ${cat}`);
  }

  // Add common variations for learning-related queries
  const learningKeywords = ['aprender', 'learn', 'curso', 'aula', 'ensinar', 'study'];
  if (q && learningKeywords.some(kw => q.toLowerCase().includes(kw))) {
    queries.add(q);
  }

  return [...queries].slice(0, 3); // max 3 parallel queries
}

async function searchByTerm(query, sortBy, headers) {
  let url = `https://api.podcastindex.org/api/1.0/search/byterm?q=${encodeURIComponent(query)}&max=1000&fulltext&similar`;
  if (sortBy === 'newest') url += '&sort=newestepisode';
  else if (sortBy === 'popularity') url += '&sort=score';
  const res = await fetch(url, { headers });
  const data = await res.json();
  return data.feeds || [];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { query: rawQuery, maxDuration = 0, language = '', sortBy = 'relevance', category = '' } = await req.json();

    const query = rawQuery?.trim() || '';
    if (!query && !category) return Response.json({ results: [] });

    const headers = await getPodcastIndexHeaders();
    const categoryId = category ? CATEGORY_MAP[category.toLowerCase()] : null;

    let feeds = [];

    if (query) {
      // Run multiple queries in parallel for richer results
      const queries = buildQueries(query, category);
      const results = await Promise.all(queries.map(q => searchByTerm(q, sortBy, headers)));

      // Merge and deduplicate by feed ID
      const seen = new Set();
      for (const batch of results) {
        for (const feed of batch) {
          if (!seen.has(feed.id)) {
            seen.add(feed.id);
            feeds.push(feed);
          }
        }
      }

      // Filter by category ID if available (only keep feeds that match)
      if (categoryId) {
        const catFiltered = feeds.filter(f => {
          const cats = f.categories || {};
          return Object.keys(cats).includes(String(categoryId));
        });
        // Soft filter: use category match as a boost (put matches first), but don't discard the rest
        const nonCat = feeds.filter(f => !catFiltered.includes(f));
        feeds = [...catFiltered, ...nonCat];
      }
    } else if (categoryId) {
      // Browse by category only (no query)
      let catUrl = `https://api.podcastindex.org/api/1.0/podcasts/bycategory?id=${categoryId}&max=1000`;
      if (sortBy === 'newest') catUrl += '&sort=newestepisode';
      else if (sortBy === 'popularity') catUrl += '&sort=score';
      const catRes = await fetch(catUrl, { headers });
      const catData = await catRes.json();
      feeds = catData.feeds || [];
    } else if (category) {
      // Unmapped category with no query — search by category name as text
      feeds = await searchByTerm(category, sortBy, headers);
    }

    // Filter by language
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
      results: feeds.slice(0, 50).map(f => ({
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