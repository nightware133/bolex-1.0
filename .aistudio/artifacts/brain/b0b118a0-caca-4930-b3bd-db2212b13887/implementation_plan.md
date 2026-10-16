# Implementation Plan: Knowledge Base & NLU Comprehension Engine

Connect Bolex AI to a comprehensive hybrid knowledge base (Wikipedia + Developer Documentation Dataset) with automatic intent-based retrieval, rate-limit safeguards for free-tier API usage, and an advanced Natural Language Understanding (NLU) synthesis engine handling idioms, synonyms, and complex sentence structures.

## User Preferences & Requirements
- **Knowledge Sources**: Hybrid (Wikipedia API for broad encyclopedic facts + Developer Architecture Dataset for software engineering).
- **Trigger Strategy**: Automatic retrieval based on query intent, named entity recognition, and question semantics.
- **NLU Focus**: Hybrid technical and conversational (developer jargon, idioms, colloquial phrasing, complex subordinating clauses).
- **Free-Tier Constraints**: Clear rate-limiting protection (15 RPM free tier ceiling), aggressive client/server caching to prevent quota exhaustion, and visual quota status.

---

## Architecture & Components

```
User Prompt (with idioms / complex syntax)
                    │
                    ▼
┌────────────────────────────────────────────────────────┐
│               NLU Comprehension Engine                 │
│  - Idiomatic expression normalization                  │
│  - Synonym expansion & syntactic clause decomposition  │
│  - Intent & entity classification                      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Hybrid Knowledge Base Router                │
│  - Free-tier rate limiter & cache check               │
│  - Route 1: Wikipedia REST API (General/Facts)         │
│  - Route 2: Developer Knowledge Corpus (Engineering)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Synthesis & Stream Generation              │
│  - Grounded prompt with retrieved knowledge chunks     │
│  - Few-shot NLU comprehension exemplars                │
│  - Streamed response with clickable citation pills     │
└────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### 1. Developer Documentation Knowledge Base Dataset (`src/data/developerKnowledgeBase.ts`)
- Curate a structured, high-density developer reference dataset covering:
  - Frontend engineering (React 19, TypeScript 5, Vite, Tailwind CSS, DOM APIs)
  - Backend & Distributed systems (REST, WebSocket, SSE, PostgreSQL, Microservices, Caching)
  - Cloud, Security & AI APIs (OAuth2, CORS, JWT, Prompt Engineering, Gemini models)
  - Algorithms & Data Structures (Time complexity, Graphs, Trees, Concurrency patterns)

### 2. Knowledge Base Service & Wikipedia Client (`src/lib/knowledgeBase.ts`)
- Implement zero-cost live Wikipedia REST API client (`en.wikipedia.org/api/rest_v1/page/summary` and Search API).
- Implement local semantic keyword matcher for the Developer Knowledge Base.
- Automatic routing logic:
  - If prompt contains programming, architectural, or algorithmic terms -> Query Developer Docs.
  - If prompt contains encyclopedic, scientific, historical, biographical, or general concepts -> Query Wikipedia.
  - If mixed query -> Query both and synthesize top relevant snippets.
- Unpaid API Quota Protector & Cache:
  - 1-hour in-memory and `localStorage` caching to minimize redundant fetches.
  - Rate-limit tracker ensuring user stays well within free-tier thresholds (15 requests/min).

### 3. Natural Language Understanding (NLU) Engine (`src/lib/nluEngine.ts`)
- **Idiom & Jargon Mapper**: Resolves 100+ colloquial idioms ("cut to the chase", "hit a brick wall", "spill the beans") and software idioms ("yak shaving", "dogfooding", "heisenbug", "spaghetti code", "bikeshedding", "DRY", "boilerplate").
- **Complex Sentence Decomposer**: Identifies conditional clauses ("if... then...", "notwithstanding...", "unless...", "whereas...") and extracts the core question.
- **In-Context NLU Training Exemplars**: Curated dataset of few-shot linguistic pairs injected into system instructions to guide model interpretation.

### 4. Integration into Chat Generation (`src/App.tsx` & `server.ts`)
- Pre-process user prompts through `nluEngine.processInput()`.
- Automatically query `knowledgeBase.query()` for relevant articles/docs.
- Inject formatted knowledge snippets into the conversation context as grounding facts.
- Store retrieved source citations on the assistant `ChatMessage` (`sources: KnowledgeSource[]`).

### 5. UI Components & Citation Display
- **Knowledge Citation Pills (`src/components/KnowledgeCitationPills.tsx`)**:
  - Rendered beneath assistant messages showing source badges (`[Wikipedia: ...]`, `[DevDocs: ...]`).
  - Clickable modal preview showing article title, description, and direct link.
- **Knowledge Base & NLU Inspector Modal (`src/components/KnowledgeBaseModal.tsx`)**:
  - Live Wikipedia & DevDocs query tester.
  - NLU idiom analyzer (type an idiomatic expression to view decoded meaning and normalized intent).
  - Free-tier query frequency and quota monitor.

---

## Verification Plan
1. **Compilation & Linting**: Run `lint_applet` and `compile_applet` to ensure zero TypeScript and build errors.
2. **Knowledge Base Retrieval Test**:
   - Query Wikipedia: "Explain the Fermi Paradox and its proposed solutions" -> verify Wikipedia summary retrieval.
   - Query DevDocs: "How do React hooks handle state updates batching in React 19?" -> verify DevDocs snippet retrieval.
3. **NLU Comprehension Test**:
   - Test idiomatic developer query: "Let's not bikeshed this PR, but rather tackle the heisenbug that's been biting us" -> verify NLU resolves intent without misunderstanding.
   - Test complex syntax: "Assuming we want low latency without sacrificing ACID guarantees, under what conditions should we pick Postgres over Mongo?" -> verify decomposition.
4. **Rate Limit & Caching Test**: Run repeated queries to verify cache hit and quota monitor indicators.
