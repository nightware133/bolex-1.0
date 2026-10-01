import { ContextualAnchor } from '../types';

export const ANCHORS_STORAGE_KEY = 'bolex_contextual_anchors_v1';

export const DEFAULT_ANCHORS: ContextualAnchor[] = [
  {
    id: 'anchor-bolex-vip',
    title: 'Bolex VIP Identity & Cognitive Partnership',
    category: 'system_rule',
    keywords: ['bolex', 'vip', 'quantum', 'reasoning', 'identity', 'cognitive', 'founder'],
    content: `Bolex is architected as an ultra-depth cognitive partner and founder-tier intelligence system. 
- Prioritize maximum structural density, precise architectural rigor, and direct actionable insights.
- Provide step-by-step reasoning transparency, addressing trade-offs and edge-case mitigations.
- Maintain an authoritative, articulate, and highly capable persona dedicated to high-velocity shipping.`,
    isEnabled: true,
    isPinned: true,
    createdAt: Date.now() - 400000,
    updatedAt: Date.now() - 400000,
  },
  {
    id: 'anchor-fullstack-architecture',
    title: 'Full-Stack TypeScript & Architecture Standards',
    category: 'architecture',
    keywords: ['backend', 'frontend', 'architecture', 'api', 'server', 'database', 'typescript', 'react', 'express'],
    content: `Production Architecture Guidelines:
1. Strict TypeScript typing across all boundaries. No loose 'any' types in domain logic.
2. Server-Sent Events (SSE) streaming with robust fallbacks, model failover chains, and connection heartbeat.
3. Modular React components with custom hooks, memoization where expensive, and clean separation of concerns.
4. Error handling with friendly parsed descriptions and auto-retry capabilities.`,
    isEnabled: true,
    isPinned: false,
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 300000,
  },
  {
    id: 'anchor-ui-design-constitution',
    title: 'Obsidian Dark UI Design Constitution',
    category: 'styleguide',
    keywords: ['design', 'ui', 'dark mode', 'styling', 'theme', 'tailwind', 'colors', 'css', 'layout'],
    content: `Visual & Experience Standards:
- Dark Mode is the canonical, recommended standard: Deep obsidian palettes (bg-neutral-950, surface neutral-900, subtle borders neutral-800/80).
- Amber & Purple luxury accents (amber-400, purple-400) for VIP indicators, icons, and active focus rings.
- Light Mode should carry an explicit 'Not Recommended / High Glare' warning with 1-click revert to Dark Mode.
- Responsive, fluid layout without layout thrashing during high-speed token streaming.`,
    isEnabled: true,
    isPinned: false,
    createdAt: Date.now() - 200000,
    updatedAt: Date.now() - 200000,
  },
  {
    id: 'anchor-api-data-contracts',
    title: 'API Schemas & Event Streaming Contracts',
    category: 'technical_doc',
    keywords: ['schema', 'contract', 'rest', 'json', 'endpoint', 'payload', 'sse', 'event'],
    content: `Event Stream & Payload Format:
- SSE events: 'chunk' (JSON: { text: string }), 'done' (JSON: { grounding?: object, usage?: object }), 'error' (JSON: { error: string }).
- Chat payload requires messages array [{ role: 'user' | 'model', content: string, image?: object }].
- System instruction encapsulates persona roles, VIP perks, user profile, and active Contextual Anchors.`,
    isEnabled: true,
    isPinned: false,
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
  },
];

export function getStoredAnchors(): ContextualAnchor[] {
  try {
    const raw = localStorage.getItem(ANCHORS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_ANCHORS;
}

export function saveStoredAnchors(anchors: ContextualAnchor[]) {
  try {
    localStorage.setItem(ANCHORS_STORAGE_KEY, JSON.stringify(anchors));
  } catch (err) {
    console.error('Failed to save anchors to localStorage', err);
  }
}

/**
 * Finds all active anchors that match any word in user query or are marked as pinned.
 */
export function findMatchingAnchors(
  anchors: ContextualAnchor[],
  query: string,
  includePinned = true
): { anchor: ContextualAnchor; matchedKeywords: string[] }[] {
  const normalizedQuery = query.toLowerCase();
  const tokens = normalizedQuery
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const results: { anchor: ContextualAnchor; matchedKeywords: string[] }[] = [];

  for (const anchor of anchors) {
    if (!anchor.isEnabled) continue;

    const matched: string[] = [];
    for (const kw of anchor.keywords) {
      const cleanKw = kw.trim().toLowerCase();
      if (!cleanKw) continue;

      // Check if full keyword phrase appears in query or single token matches
      if (normalizedQuery.includes(cleanKw) || tokens.includes(cleanKw)) {
        matched.push(cleanKw);
      }
    }

    if (matched.length > 0) {
      results.push({ anchor, matchedKeywords: matched });
    } else if (includePinned && anchor.isPinned) {
      results.push({ anchor, matchedKeywords: ['pinned'] });
    }
  }

  return results;
}

/**
 * Compiles matched anchors into high-priority prompt injection block
 */
export function compileAnchorContext(
  matched: { anchor: ContextualAnchor; matchedKeywords: string[] }[]
): string {
  if (matched.length === 0) return '';

  const blocks = matched.map(({ anchor, matchedKeywords }) => {
    return `---
[ANCHOR: "${anchor.title}" | Category: ${anchor.category} | Matched Triggers: ${matchedKeywords.join(', ')}]
${anchor.content.trim()}
---`;
  });

  return `\n\n[CONTEXTUAL ANCHORS & VAULT MEMORY INJECTED]:
The user's project memory vault has activated the following high-priority contextual anchors for this query:
${blocks.join('\n')}\nTreat these anchors as high-priority, authoritative context for your reasoning and output.`;
}
