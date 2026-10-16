export interface DevDocEntry {
  id: string;
  title: string;
  category: 'Frontend' | 'Backend' | 'Architecture' | 'Algorithms' | 'Security & Auth' | 'Databases' | 'AI & LLMs';
  summary: string;
  details: string;
  keywords: string[];
  bestPractices: string[];
  codeExample?: string;
  url: string;
}

export const DEVELOPER_KNOWLEDGE_BASE: DevDocEntry[] = [
  {
    id: 'react-19-actions-transitions',
    title: 'React 19 Actions, useActionState & Server Functions',
    category: 'Frontend',
    summary: 'React 19 introduces native support for async Actions with useActionState, useOptimistic, and automatic pending state handling without manual loading flags.',
    details: 'Actions in React 19 allow functions that trigger transitions to execute asynchronously while managing pending state, error boundaries, and optimistic updates automatically. useActionState(fn, initialState) wraps async handlers, returning [state, formAction, isPending]. Server Functions integrate directly with forms for progressive enhancement.',
    keywords: ['react 19', 'useactionstate', 'useoptimistic', 'actions', 'transitions', 'starttransition', 'useformstatus'],
    bestPractices: [
      'Use useActionState instead of manual try/catch/finally loading states in forms',
      'Leverage useOptimistic for immediate UI feedback before network roundtrips complete',
      'Wrap state updates in startTransition when updating non-urgent UI elements'
    ],
    codeExample: `const [state, formAction, isPending] = useActionState(async (prevState, formData) => {
  const result = await updateProfile(formData);
  return result;
}, initialData);`,
    url: 'https://react.dev/blog/2024/12/05/react-19'
  },
  {
    id: 'typescript-5-const-type-parameters',
    title: 'TypeScript 5.x Const Type Parameters & Satisfies Operator',
    category: 'Frontend',
    summary: 'TypeScript 5+ features const type parameters for literal inference without as const assertions, alongside the satisfies operator for type validation without widening.',
    details: 'Const Type Parameters allow generic type parameters to be declared with const (e.g. <const T extends string[]>), preserving literal tuple and object types automatically. The satisfies operator validates that an expression matches a type contract without widening the inferred type, keeping exact literal keys and union discriminations intact.',
    keywords: ['typescript', 'const type parameters', 'satisfies operator', 'type inference', 'literal types', 'generics'],
    bestPractices: [
      'Use satisfies when verifying config objects against a schema without losing specific literal keys',
      'Use <const T> in utility functions to avoid requiring callers to append "as const"',
      'Prefer template literal types over enums for ergonomic, zero-runtime overhead string unions'
    ],
    codeExample: `// Const type parameter preserves literal array
function createRoutes<const T extends readonly string[]>(routes: T): T {
  return routes;
}
const appRoutes = createRoutes(['/home', '/dashboard'] as const);`,
    url: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html'
  },
  {
    id: 'acid-database-isolation-levels',
    title: 'ACID Guarantees & Transaction Isolation Levels',
    category: 'Databases',
    summary: 'Understanding Atomicity, Consistency, Isolation, and Durability (ACID) and ANSI SQL isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable).',
    details: 'Isolation levels prevent concurrency anomalies: Dirty Reads (reading uncommitted data), Non-repeatable Reads (row re-read returns different values), and Phantom Reads (re-query returns new rows inserted by another txn). PostgreSQL defaults to Read Committed using Multi-Version Concurrency Control (MVCC), where each transaction sees a snapshot from the query start.',
    keywords: ['acid', 'database', 'isolation levels', 'dirty read', 'phantom read', 'mvcc', 'postgresql', 'transactions', 'serializable', 'read committed'],
    bestPractices: [
      'Default to Read Committed for typical OLTP workloads to maximize concurrency',
      'Use Serializable or explicit advisory locks for critical financial ledgers or inventory deduction',
      'Keep transactions concise to prevent connection pool starvation and lock contention'
    ],
    url: 'https://www.postgresql.org/docs/current/transaction-iso.html'
  },
  {
    id: 'rest-vs-sse-vs-websockets',
    title: 'Network Communication: REST, Server-Sent Events (SSE), and WebSockets',
    category: 'Architecture',
    summary: 'Architectural trade-offs between stateless REST, unidirectional Server-Sent Events over HTTP, and bidirectional full-duplex WebSockets.',
    details: 'REST is ideal for discrete CRUD operations. Server-Sent Events (SSE) use standard HTTP with text/event-stream, providing lightweight unidirectional streaming from server to client with automatic reconnection and HTTP/2 multiplexing (ideal for AI chat streaming). WebSockets provide full-duplex, low-latency binary/text channels over a persistent TCP connection (ideal for multiplayer gaming and live collaborative canvases).',
    keywords: ['sse', 'server-sent events', 'websockets', 'rest', 'streaming', 'http/2', 'real-time', 'duplex'],
    bestPractices: [
      'Choose SSE over WebSockets for AI token streaming: it operates over standard HTTP, traverses proxies easily, and has built-in reconnection',
      'Choose WebSockets when bidirectional low-latency data flow is strictly required (e.g. collaborative canvases, gaming)',
      'Always implement keep-alive heartbeats to prevent cloud load balancers and intermediate proxies from severing idle streams'
    ],
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events'
  },
  {
    id: 'system-design-caching-patterns',
    title: 'Caching Strategies: Cache-Aside, Write-Through & Write-Behind',
    category: 'Architecture',
    summary: 'System architecture patterns for high-throughput distributed caching, eviction policies, and cache invalidation mechanics.',
    details: 'Cache-Aside (Lazy Loading): The application first checks cache; on miss, loads from DB and writes to cache. Write-Through: Data is written to cache and DB synchronously. Write-Behind (Write-Back): Data is written to cache immediately, and asynchronously written to the DB in batches. Key concerns include Cache Stampede (solved with mutexes or probabilistic early expiration) and Cache Penetration (solved with Bloom filters or caching null results).',
    keywords: ['caching', 'cache-aside', 'write-through', 'write-behind', 'redis', 'cache stampede', 'bloom filter', 'eviction policy', 'lru'],
    bestPractices: [
      'Apply jitter to cache TTLs (e.g. base TTL + random delta) to prevent simultaneous mass expiration (stampede)',
      'Use Cache-Aside with Redis for read-heavy distributed applications',
      'Cache computed tokens and embeddings locally in client apps to preserve free-tier AI API quotas'
    ],
    url: 'https://en.wikipedia.org/wiki/Cache_(computing)'
  },
  {
    id: 'oauth2-pkce-flow',
    title: 'OAuth 2.0 with PKCE (Proof Key for Code Exchange) in SPAs',
    category: 'Security & Auth',
    summary: 'Modern authorization standard for Single Page Applications (SPAs) and mobile clients without exposing client secrets.',
    details: 'Authorization Code Flow with PKCE eliminates the need for client secrets in public clients. The client creates a cryptographically random code_verifier and derives a code_challenge (using SHA-256). The authorization server stores the challenge, and validates the verifier upon code exchange. Tokens should be stored in memory or secure HttpOnly cookies rather than localStorage to prevent XSS exfiltration.',
    keywords: ['oauth2', 'pkce', 'auth', 'security', 'code verifier', 'code challenge', 'jwt', 'spa authentication', 'cors'],
    bestPractices: [
      'Never hardcode client secrets in client-side Single Page Applications',
      'Always use state parameters to mitigate Cross-Site Request Forgery (CSRF)',
      'Use PKCE for all authorization code flows, even confidential clients'
    ],
    url: 'https://oauth.net/2/pkce/'
  },
  {
    id: 'algorithms-algorithmic-complexity',
    title: 'Big-O Computational Complexity & Algorithmic Optimization',
    category: 'Algorithms',
    summary: 'Formal asymptotic notation analysis of time and space complexity across core algorithms and data structures.',
    details: 'Big-O describes upper bound scalability. Common time complexities: O(1) Constant (hash table lookup), O(log n) Logarithmic (binary search, balanced BST), O(n) Linear (single pass traversal), O(n log n) Linearithmic (MergeSort, QuickSort avg, TimSort), O(n^2) Quadratic (nested loops), O(2^n) Exponential (recursive subsets). Space complexity must account for call stack depth during recursion.',
    keywords: ['big-o', 'complexity', 'time complexity', 'space complexity', 'algorithms', 'sorting', 'binary search', 'hash table', 'quicksort'],
    bestPractices: [
      'Replace O(n) array scans inside loops with O(1) Map/Set index lookups',
      'Prefer in-place algorithms or iterative loops to avoid O(n) recursive stack overflow limits in JavaScript V8',
      'Pre-allocate typed arrays when handling large numeric or audio signal buffers'
    ],
    url: 'https://en.wikipedia.org/wiki/Big_O_notation'
  },
  {
    id: 'gemini-api-prompt-engineering',
    title: 'Gemini Models: Multi-Turn Context, System Instructions & Grounding',
    category: 'AI & LLMs',
    summary: 'Optimizing Gemini models (gemini-3.8-flash, gemini-3.7-flash, gemini-3.1-pro-preview) through structured system instructions, few-shot prompting, and search grounding.',
    details: 'The @google/genai SDK provides unified access to multimodal Gemini models. Key engineering practices include: using explicit system instructions to enforce output boundaries and prevent introductory greetings, enforcing strict alternating user/model message roles, employing thinkingConfig for reasoning models, and incorporating search grounding with googleSearch tool.',
    keywords: ['gemini', 'prompt engineering', 'system instruction', 'google search grounding', 'few-shot', 'llm', 'thinking budget', 'genai'],
    bestPractices: [
      'Use gemini-3.8-flash for real-time streaming, high-throughput chat, and low latency',
      'Use gemini-3.1-pro-preview for complex coding, mathematical proofs, and deep reasoning',
      'Cache retrieved knowledge snippets before sending prompts to avoid burning API rate limits (15 RPM free tier)',
      'Always specify systemInstruction at model configuration level rather than prepending to user prompt'
    ],
    url: 'https://ai.google.dev/docs'
  },
  {
    id: 'web-performance-core-web-vitals',
    title: 'Core Web Vitals & Frontend Performance Optimization',
    category: 'Frontend',
    summary: 'Optimizing Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS).',
    details: 'LCP measures perceived load speed (target <= 2.5s); optimize by preloading hero assets and eliminating render-blocking CSS. INP measures responsiveness to user input (target <= 200ms); optimize by yielding to the main thread via requestAnimationFrame or scheduler.yield(). CLS measures visual stability (target <= 0.1); optimize by specifying explicit width/height on images and reserving space for dynamic content.',
    keywords: ['core web vitals', 'lcp', 'inp', 'cls', 'performance', 'rendering', 'repaint', 'reflow', 'requestanimationframe'],
    bestPractices: [
      'Batch state updates during rapid streams to avoid re-rendering DOM nodes on every token',
      'Use content-visibility: auto for long message lists to skip rendering off-screen elements',
      'Avoid layout thrashing by reading scrollHeight before writing to scrollTop'
    ],
    url: 'https://web.dev/explore/fast'
  },
  {
    id: 'distributed-systems-cap-theorem',
    title: 'CAP Theorem & Eventual Consistency in Distributed Systems',
    category: 'Architecture',
    summary: 'Theoretical limits of distributed data stores: Consistency, Availability, and Partition Tolerance.',
    details: 'Brewer\'s CAP Theorem states that in the event of a network partition (P), a distributed system must choose between Consistency (C - every read receives the most recent write or an error) or Availability (A - every non-failing node returns a response, without guarantee of latest data). Systems like Spanner achieve CP via atomic clocks, while Cassandra/DynamoDB favor AP with eventual consistency, vector clocks, and conflict-free replicated data types (CRDTs).',
    keywords: ['cap theorem', 'distributed systems', 'consistency', 'availability', 'partition tolerance', 'eventual consistency', 'crdt', 'dynamodb'],
    bestPractices: [
      'Choose AP with optimistic updates for real-time collaborative chat applications',
      'Choose CP with strict read-after-write consistency for billing and transaction records',
      'Implement idempotent retry keys for distributed network writes to prevent duplicate operations'
    ],
    url: 'https://en.wikipedia.org/wiki/CAP_theorem'
  }
];
