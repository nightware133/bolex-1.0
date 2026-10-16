import { KnowledgeSource, NLUAnalysisResult } from '../types';
import { DEVELOPER_KNOWLEDGE_BASE, DevDocEntry } from '../data/developerKnowledgeBase';

export interface KBQueryResult {
  sources: KnowledgeSource[];
  synthesizedContext: string;
  sourceType: 'wikipedia' | 'developer_docs' | 'hybrid' | 'none';
  cached: boolean;
  rateLimitStatus: {
    queriesThisMinute: number;
    maxFreeTierRpm: number;
    isApproachingLimit: boolean;
  };
}

// In-memory cache for fast repeat lookups
const inMemoryCache = new Map<string, { sources: KnowledgeSource[]; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const KB_CACHE_STORAGE_KEY = 'bolex_kb_cache_v1';

// Free-tier rate limiting tracking (15 requests per minute)
const MAX_FREE_TIER_RPM = 15;
const requestTimestamps: number[] = [];

/**
 * Record and get the current query frequency within a 60-second rolling window.
 */
export function getRateLimitStatus(): {
  queriesThisMinute: number;
  maxFreeTierRpm: number;
  isApproachingLimit: boolean;
} {
  const now = Date.now();
  // Filter timestamps within last 60 seconds
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 60000) {
    requestTimestamps.shift();
  }
  const count = requestTimestamps.length;
  return {
    queriesThisMinute: count,
    maxFreeTierRpm: MAX_FREE_TIER_RPM,
    isApproachingLimit: count >= MAX_FREE_TIER_RPM - 3,
  };
}

function recordQueryTimestamp() {
  requestTimestamps.push(Date.now());
}

/**
 * Live Wikipedia Search and Summary fetcher via official Wikimedia REST API
 */
export async function queryWikipedia(searchTerm: string): Promise<KnowledgeSource[]> {
  const trimmed = searchTerm.trim();
  if (!trimmed || trimmed.length < 3) return [];

  const results: KnowledgeSource[] = [];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 700);

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      trimmed
    )}&utf8=&format=json&origin=*&srlimit=2`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const searchList = searchData?.query?.search;

    if (!Array.isArray(searchList) || searchList.length === 0) return [];

    const item = searchList[0];
    const cleanedSnippet = (item.snippet || '')
      .replace(/<span class="searchmatch">/g, '')
      .replace(/<\/span>/g, '')
      .replace(/&quot;/g, '"');
    if (cleanedSnippet) {
      results.push({
        id: `wiki-${item.pageid || Date.now()}`,
        type: 'wikipedia',
        title: item.title,
        snippet: cleanedSnippet,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
        category: 'Wikipedia Encyclopedia',
        relevanceScore: 0.9,
      });
    }
  } catch (err) {
    clearTimeout(timeoutId);
    // Silently bypass timeout / network drop for instant response
  }

  return results;
}

/**
 * Semantic keyword scoring across the Developer Documentation knowledge base
 */
export function queryDeveloperDocs(query: string): KnowledgeSource[] {
  const normalizedQuery = query.toLowerCase();
  const queryTokens = normalizedQuery.replace(/[^\w\s-]/g, '').split(/\s+/).filter(t => t.length > 2);

  if (queryTokens.length === 0) return [];

  const scoredEntries: { entry: DevDocEntry; score: number }[] = [];

  for (const entry of DEVELOPER_KNOWLEDGE_BASE) {
    let score = 0;
    const lowerTitle = entry.title.toLowerCase();
    const lowerSummary = entry.summary.toLowerCase();
    const lowerDetails = entry.details.toLowerCase();

    // Exact title phrase match
    if (lowerTitle.includes(normalizedQuery)) score += 10;

    // Check keyword matches
    for (const kw of entry.keywords) {
      if (normalizedQuery.includes(kw.toLowerCase())) {
        score += 6;
      }
    }

    // Token frequency match
    for (const token of queryTokens) {
      if (lowerTitle.includes(token)) score += 3;
      if (lowerSummary.includes(token)) score += 2;
      if (lowerDetails.includes(token)) score += 1;
      for (const kw of entry.keywords) {
        if (kw.toLowerCase().includes(token)) score += 2;
      }
    }

    if (score >= 4) {
      scoredEntries.push({ entry, score });
    }
  }

  // Sort by highest score first
  scoredEntries.sort((a, b) => b.score - a.score);

  return scoredEntries.slice(0, 2).map(({ entry, score }) => ({
    id: `devdoc-${entry.id}`,
    type: 'developer_docs',
    title: entry.title,
    snippet: `${entry.summary}\n\nDetails: ${entry.details}${entry.bestPractices ? `\n\nKey Practices: ${entry.bestPractices.join('; ')}` : ''}`,
    url: entry.url,
    category: entry.category,
    relevanceScore: Math.min(1.0, score / 15),
  }));
}

/**
 * Intelligent Knowledge Base Router:
 * Analyzes intent & entities. Wikipedia is ONLY queried when the user explicitly
 * requests Wikipedia/encyclopedia content. Developer Docs are queried for technical engineering terms.
 * For general and conversational queries, the model relies on its vast frontier intelligence.
 */
export async function queryKnowledgeBase(
  userQuery: string,
  nluAnalysis?: NLUAnalysisResult
): Promise<KBQueryResult> {
  const cacheKey = userQuery.trim().toLowerCase();
  const now = Date.now();

  // 1. Check in-memory cache
  if (inMemoryCache.has(cacheKey)) {
    const cachedItem = inMemoryCache.get(cacheKey)!;
    if (now - cachedItem.timestamp < CACHE_TTL_MS) {
      return {
        sources: cachedItem.sources,
        synthesizedContext: formatKnowledgeContext(cachedItem.sources),
        sourceType: determineSourceType(cachedItem.sources),
        cached: true,
        rateLimitStatus: getRateLimitStatus(),
      };
    }
  }

  // 2. Track query frequency for free tier monitoring
  recordQueryTimestamp();

  const sources: KnowledgeSource[] = [];
  const intent = nluAnalysis?.intent || 'conversational';
  const isExplicitWikiRequest = /\b(wikipedia|wiki\b|encyclopedia|wiki entry|wiki article)\b/i.test(userQuery);

  // 3. Smart selective routing:
  // ONLY query Wikipedia if the user explicitly asked for Wikipedia or an encyclopedic article
  if (isExplicitWikiRequest) {
    const cleanTerm = userQuery.replace(/\b(wikipedia|wiki\b|encyclopedia|look up on|search on|what does|say about)\b/gi, '').trim() || userQuery;
    const wikiResults = await queryWikipedia(cleanTerm);
    sources.push(...wikiResults);
  } else if (intent === 'engineering') {
    // For engineering queries, check curated Developer Docs with strict scoring
    const devDocs = queryDeveloperDocs(userQuery);
    if (devDocs.length > 0 && (devDocs[0].relevanceScore || 0) >= 0.5) {
      sources.push(...devDocs);
    }
  }

  // Limit to top 2 sources to keep tokens lean
  const finalSources = sources.slice(0, 2);

  // Cache result
  inMemoryCache.set(cacheKey, { sources: finalSources, timestamp: now });

  return {
    sources: finalSources,
    synthesizedContext: formatKnowledgeContext(finalSources),
    sourceType: determineSourceType(finalSources),
    cached: false,
    rateLimitStatus: getRateLimitStatus(),
  };
}

function determineSourceType(sources: KnowledgeSource[]): 'wikipedia' | 'developer_docs' | 'hybrid' | 'none' {
  if (sources.length === 0) return 'none';
  const hasWiki = sources.some(s => s.type === 'wikipedia');
  const hasDev = sources.some(s => s.type === 'developer_docs');
  if (hasWiki && hasDev) return 'hybrid';
  if (hasWiki) return 'wikipedia';
  return 'developer_docs';
}

/**
 * Formats retrieved knowledge sources into a clean markdown context
 * suitable for inclusion in the AI model's grounding instructions without limiting intelligence.
 */
export function formatKnowledgeContext(sources: KnowledgeSource[]): string {
  if (!sources || sources.length === 0) return '';

  let context = `\n\n[SUPPLEMENTAL REFERENCE ARCHIVE]:
The following reference notes are provided as optional background context:`;

  for (const source of sources) {
    const typeLabel = source.type === 'wikipedia' ? 'Wikipedia Encyclopedia' : `Developer Docs (${source.category || 'Engineering'})`;
    context += `\n\n### Reference: ${source.title} [${typeLabel}]\n${source.snippet}`;
    if (source.url) {
      context += `\nReference URL: ${source.url}`;
    }
  }

  context += `\n\nINTELLIGENCE DIRECTIVE: Do not restrict your answer to only the snippet above. You are a high-intelligence AI model with comprehensive knowledge and deep reasoning. Provide a rich, articulate, well-structured, and helpful response like ChatGPT.`;

  return context;
}

