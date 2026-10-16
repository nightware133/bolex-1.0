import { NLUAnalysisResult } from '../types';

export interface IdiomEntry {
  phrase: string;
  pattern: RegExp;
  meaning: string;
  category: 'technical' | 'conversational';
  exampleUsage: string;
  normalizedAlternative: string;
}

export const KNOWN_IDIOMS: IdiomEntry[] = [
  // --- Technical & Developer Idioms ---
  {
    phrase: 'yak shaving',
    pattern: /\byak\s+shav(?:ing|ed?)\b/i,
    meaning: 'Doing a sequence of seemingly useless or tedious tasks before the main goal can be started',
    category: 'technical',
    exampleUsage: 'I spent all morning yak shaving Docker configs instead of building the feature.',
    normalizedAlternative: 'engaging in prerequisite dependency rabbit-holes'
  },
  {
    phrase: 'bikeshedding',
    pattern: /\bbike[\s-]?shed(?:ding|ded?)?\b/i,
    meaning: 'Giving disproportionate weight to trivial details (e.g. argument names, button colors) while ignoring complex architecture',
    category: 'technical',
    exampleUsage: 'Let us not bikeshed on the modal padding and focus on the database schema.',
    normalizedAlternative: 'debating minor trivialities instead of core technical architecture'
  },
  {
    phrase: 'heisenbug',
    pattern: /\bheisen[\s-]?bugs?\b/i,
    meaning: 'A software bug that seems to disappear or alter its behavior when one attempts to inspect or debug it',
    category: 'technical',
    exampleUsage: 'We are chasing a heisenbug that only manifests in production under high concurrency.',
    normalizedAlternative: 'an elusive transient bug caused by race conditions or memory timing'
  },
  {
    phrase: 'dogfooding',
    pattern: /\b(?:eating\s+our\s+own\s+)?dog[\s-]?food(?:ing|ed?)?\b/i,
    meaning: 'Using one\'s own product or software internally to test and validate real-world usability',
    category: 'technical',
    exampleUsage: 'The team has been dogfooding the new chat assistant for the past month.',
    normalizedAlternative: 'internally testing our own software in real-world workflows'
  },
  {
    phrase: 'spaghetti code',
    pattern: /\bspaghetti\s+code\b/i,
    meaning: 'Unstructured, tangled, and difficult-to-maintain source code with convoluted control flow',
    category: 'technical',
    exampleUsage: 'Refactor this spaghetti code into clean, modular TypeScript functions.',
    normalizedAlternative: 'tangled, tightly-coupled, and unmaintainable legacy code'
  },
  {
    phrase: 'code smell',
    pattern: /\bcode\s+smells?\b/i,
    meaning: 'A surface indication in code that usually corresponds to a deeper architectural design problem',
    category: 'technical',
    exampleUsage: 'Passing 12 props to a single component is a clear code smell.',
    normalizedAlternative: 'symptomatic design flaws or architectural antipatterns'
  },
  {
    phrase: 'rubber ducking',
    pattern: /\brubber\s+duck(?:ing|ed?)?\b/i,
    meaning: 'Debugging code by explaining it line-by-line out loud to an inanimate object or listener',
    category: 'technical',
    exampleUsage: 'Can you act as my rubber duck while I explain this authentication state machine?',
    normalizedAlternative: 'debugging through vocal step-by-step reasoning'
  },
  {
    phrase: 'silver bullet',
    pattern: /\bsilver\s+bullets?\b/i,
    meaning: 'A simple, miraculous solution to a notoriously difficult problem (often nonexistent in software)',
    category: 'technical',
    exampleUsage: 'Microservices are not a silver bullet for bad monolithic architecture.',
    normalizedAlternative: 'a single panacea or effortless complete solution'
  },
  {
    phrase: 'technical debt',
    pattern: /\btech(?:nical)?\s+debt\b/i,
    meaning: 'The implied future cost of additional rework caused by choosing an easy limited solution now over a better approach',
    category: 'technical',
    exampleUsage: 'We need a sprint dedicated to paying down our technical debt in the caching layer.',
    normalizedAlternative: 'accumulated architectural compromises requiring future refactoring'
  },
  {
    phrase: 'dry run',
    pattern: /\bdry\s+runs?\b/i,
    meaning: 'A rehearsal or simulated execution of a process without applying real mutations or production changes',
    category: 'technical',
    exampleUsage: 'Run a dry run of the database migration before executing it on production.',
    normalizedAlternative: 'a simulated trial run without persistent side-effects'
  },
  {
    phrase: 'cold start',
    pattern: /\bcold\s+starts?\b/i,
    meaning: 'The latency delay when a serverless function or container must spin up from an idle zero-instance state',
    category: 'technical',
    exampleUsage: 'How can we minimize cold start latency on Cloud Run or AWS Lambda?',
    normalizedAlternative: 'initialization latency when provisioning an idle compute container'
  },
  {
    phrase: 'bus factor',
    pattern: /\bbus\s+factors?\b/i,
    meaning: 'The minimum number of team members that have to be unavailable before a project stalls due to lack of knowledge',
    category: 'technical',
    exampleUsage: 'Improve codebase documentation to raise our bus factor.',
    normalizedAlternative: 'knowledge concentration risk among team members'
  },

  // --- General Conversational Idioms & Colloquialisms ---
  {
    phrase: 'hit the ground running',
    pattern: /\bhit(?:ting)?\s+the\s+ground\s+running\b/i,
    meaning: 'Starting an activity immediately with high energy and full readiness',
    category: 'conversational',
    exampleUsage: 'Help me hit the ground running with this new Vite project.',
    normalizedAlternative: 'get started immediately and productively'
  },
  {
    phrase: 'cut corners',
    pattern: /\bcut(?:ting)?\s+corners?\b/i,
    meaning: 'Doing something perfunctorily or cheaply in order to save time or money, compromising quality',
    category: 'conversational',
    exampleUsage: 'Do not cut corners on cryptographic key generation.',
    normalizedAlternative: 'take improper shortcuts that degrade quality or security'
  },
  {
    phrase: 'bite the bullet',
    pattern: /\bbite\s+the\s+bullet\b/i,
    meaning: 'Facing an inevitable grim situation with courage and decisiveness',
    category: 'conversational',
    exampleUsage: 'We had to bite the bullet and rewrite the legacy ORM from scratch.',
    normalizedAlternative: 'make the tough but necessary decision'
  },
  {
    phrase: 'spill the beans',
    pattern: /\bspill(?:ing)?\s+the\s+beans\b/i,
    meaning: 'Revealing secret or unannounced information prematurely',
    category: 'conversational',
    exampleUsage: 'Can you spill the beans on the upcoming features in React 19?',
    normalizedAlternative: 'reveal the details or insider facts'
  },
  {
    phrase: 'elephant in the room',
    pattern: /\belephant\s+in\s+the\s+room\b/i,
    meaning: 'An obvious major problem or controversial issue that everyone knows about but avoids discussing',
    category: 'conversational',
    exampleUsage: 'Let us address the elephant in the room: our server response latency.',
    normalizedAlternative: 'the prominent unaddressed issue'
  },
  {
    phrase: 'cut to the chase',
    pattern: /\bcut\s+to\s+the\s+chase\b/i,
    meaning: 'Come directly to the most important point without wasting time on preamble',
    category: 'conversational',
    exampleUsage: 'Cut to the chase: what is the Big-O time complexity of this algorithm?',
    normalizedAlternative: 'get straight to the essential point'
  },
  {
    phrase: 'back to square one',
    pattern: /\bback\s+to\s+square\s+one\b/i,
    meaning: 'Returning to the initial stage or origin after a failed attempt',
    category: 'conversational',
    exampleUsage: 'The migration failed so we are back to square one.',
    normalizedAlternative: 'starting over from the very beginning'
  },
  {
    phrase: 'take with a grain of salt',
    pattern: /\btake\s+(?:it\s+)?with\s+a\s+grain\s+of\s+salt\b/i,
    meaning: 'Viewing information with skepticism or reservation rather than accepting it blindly as factual',
    category: 'conversational',
    exampleUsage: 'Take the synthetic benchmark results with a grain of salt.',
    normalizedAlternative: 'interpret with healthy skepticism and empirical caution'
  },
  {
    phrase: 'see eye to eye',
    pattern: /\bsee(?:ing)?\s+eye\s+to\s+eye\b/i,
    meaning: 'Agreeing completely with someone on a topic or strategy',
    category: 'conversational',
    exampleUsage: 'The architects did not see eye to eye on graph databases versus relational tables.',
    normalizedAlternative: 'share mutual agreement'
  },
  {
    phrase: 'at the eleventh hour',
    pattern: /\bat\s+the\s+eleventh\s+hour\b/i,
    meaning: 'At the very last possible moment before a deadline',
    category: 'conversational',
    exampleUsage: 'They shipped the security patch at the eleventh hour.',
    normalizedAlternative: 'at the last moment right before the deadline'
  },
  {
    phrase: 'play devils advocate',
    pattern: /\bplay(?:ing)?\s+devil'?s\s+advocate\b/i,
    meaning: 'Arguing against a proposition for the sake of exploring all counterarguments and edge cases',
    category: 'conversational',
    exampleUsage: 'Play devil\'s advocate against migrating our database to DynamoDB.',
    normalizedAlternative: 'explore rigorous counterarguments and trade-offs'
  },
  {
    phrase: 'under the weather',
    pattern: /\bunder\s+the\s+weather\b/i,
    meaning: 'Feeling slightly unwell, sick, or fatigued',
    category: 'conversational',
    exampleUsage: 'I am feeling under the weather today.',
    normalizedAlternative: 'feeling unwell or fatigued'
  },
  {
    phrase: 'burn the midnight oil',
    pattern: /\bburn(?:ing)?\s+the\s+midnight\s+oil\b/i,
    meaning: 'Working late into the night with high diligence',
    category: 'conversational',
    exampleUsage: 'I had to burn the midnight oil to finish the release.',
    normalizedAlternative: 'work late into the night'
  }
];

/**
 * Common technical and natural language synonyms
 */
export const SYNONYM_MAP: Record<string, string[]> = {
  'build': ['construct', 'implement', 'scaffold', 'engineer', 'craft', 'create'],
  'bug': ['defect', 'glitch', 'error', 'fault', 'anomaly', 'issue'],
  'fast': ['high-performance', 'performant', 'rapid', 'speedy', 'low-latency'],
  'explain': ['clarify', 'demystify', 'break down', 'elucidate', 'unpack'],
  'refactor': ['clean up', 'restructure', 'modernize', 'modularize', 'optimize'],
  'secure': ['hardened', 'bulletproof', 'tamper-resistant', 'safe', 'authenticated'],
  'big': ['large-scale', 'high-throughput', 'enterprise-grade', 'massive']
};

/**
 * Analyzes natural language input for idioms, syntactic complexity, entities, and intent.
 */
export function analyzeNaturalLanguage(query: string): NLUAnalysisResult {
  const trimmed = query.trim();
  const detectedIdioms: { phrase: string; meaning: string; category: string }[] = [];

  let normalized = trimmed;

  // 1. Detect and resolve known idioms
  for (const entry of KNOWN_IDIOMS) {
    if (entry.pattern.test(trimmed)) {
      detectedIdioms.push({
        phrase: entry.phrase,
        meaning: entry.meaning,
        category: entry.category
      });
      // Annotated normalized representation
      normalized = normalized.replace(entry.pattern, `[${entry.phrase}: ${entry.normalizedAlternative}]`);
    }
  }

  // 2. Classify Syntactic Complexity based on clauses and subordinating conjunctions
  const complexConjunctions = /\b(notwithstanding|provided that|in the event that|insofar as|whereas|given that|assuming that|unless|although|even though|on the condition that)\b/i;
  const compoundConjunctions = /\b(and|but|yet|so|however|nevertheless|furthermore)\b/i;

  let syntacticComplexity: 'simple' | 'compound' | 'complex' = 'simple';
  if (complexConjunctions.test(trimmed) || (trimmed.match(/,/g) || []).length >= 3) {
    syntacticComplexity = 'complex';
  } else if (compoundConjunctions.test(trimmed) || (trimmed.match(/,/g) || []).length >= 1) {
    syntacticComplexity = 'compound';
  }

  // 3. Classify Domain Intent
  const engineeringKeywords = /\b(code|react|typescript|javascript|python|sql|database|api|architecture|function|component|server|css|html|bug|debug|refactor|performance|latency|docker|aws|git|rest|graphql|sse|websocket)\b/i;
  const factualKeywords = /\b(what is|who was|history of|when did|explain|theory|science|planet|country|capital of|biography|definition|fermi paradox|quantum|relativity)\b/i;

  const isEng = engineeringKeywords.test(trimmed);
  const isFact = factualKeywords.test(trimmed);

  let intent: 'engineering' | 'factual' | 'conversational' | 'hybrid' = 'conversational';
  if (isEng && isFact) {
    intent = 'hybrid';
  } else if (isEng) {
    intent = 'engineering';
  } else if (isFact) {
    intent = 'factual';
  }

  // 4. Extract Key Entities (alphanumeric phrases, capital words, technical terms)
  const words = trimmed.replace(/[^\w\s-]/g, '').split(/\s+/);
  const keyEntities: string[] = [];
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'or', 'with', 'by', 'from', 'what', 'how', 'why', 'can', 'you', 'please', 'help', 'me']);

  for (const w of words) {
    const lower = w.toLowerCase();
    if (w.length > 2 && !stopWords.has(lower) && !keyEntities.includes(w)) {
      if (w[0] === w[0].toUpperCase() || w.includes('-') || lower.length > 5) {
        keyEntities.push(w);
      }
    }
  }

  return {
    detectedIdioms,
    normalizedQuery: normalized,
    intent,
    syntacticComplexity,
    keyEntities: keyEntities.slice(0, 6)
  };
}

/**
 * Few-shot linguistic training exemplars injected into Gemini context
 * to enhance model NLU comprehension of idioms, metaphors, and complex syntax.
 */
export function getNLUTrainingSystemPrompt(analysis?: NLUAnalysisResult): string {
  let prompt = `[ADVANCED NATURAL LANGUAGE UNDERSTANDING (NLU) SYSTEM]:
You are trained on diverse natural language expressions across technical and conversational English.
You excel at:
1. Idiom & Colloquialism Resolution: Deconstruct and interpret idioms, metaphors, and informal phrasing (e.g. "yak shaving", "bikeshedding", "heisenbug", "cut corners", "bite the bullet", "elephant in the room") by extracting the underlying semantic intent rather than taking the literal words.
2. Complex Syntactic Processing: Handle complex sentences with nested conditions, concessive clauses ("notwithstanding...", "assuming that...", "unless..."), and multiple interdependent requirements without getting confused.
3. Synonym & Semantic Invariance: Recognize that queries phrased with varied vocabulary ("scaffold a performant endpoint" vs "build a fast API route") share identical intent.
4. Direct & Articulate Output: Address the exact core problem clearly and directly. Never lecture the user about their choice of words or idioms unless they explicitly ask for etymology.`;

  if (analysis && analysis.detectedIdioms.length > 0) {
    prompt += `\n\n[DETECTED IDIOMS IN USER QUERY - RESOLVED MEANINGS]:`;
    for (const item of analysis.detectedIdioms) {
      prompt += `\n- "${item.phrase}": ${item.meaning}`;
    }
  }

  if (analysis && analysis.syntacticComplexity === 'complex') {
    prompt += `\n\n[COMPLEX SYNTAX DIRECTIVE]:
The user's input contains complex conditional clauses or multi-part dependencies. Ensure you systematically address each condition, premise, and trade-off in your answer.`;
  }

  return prompt;
}
