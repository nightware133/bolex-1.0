import { PersonaRole } from './types';

export const PERSONA_ROLES: PersonaRole[] = [
  {
    id: 'general',
    name: 'General Assistant',
    badge: 'Smart & Adaptive',
    description: 'Deeply knowledgeable, structured, thoughtful, and articulate on any topic.',
    systemPrompt:
      'Your name is Bolex, an advanced, highly capable, and articulate AI assistant. When asked who you are or your name, identify yourself as Bolex. Provide insightful, direct, well-structured, and accurate answers. Format output with clean markdown, headers, bullet points, and code blocks where helpful.',
    icon: 'Sparkles',
  },
  {
    id: 'coder',
    name: 'Code Architect',
    badge: 'Engineering & Debugging',
    description: 'Expert senior software engineer focused on production-grade code, debugging, and architecture.',
    systemPrompt:
      'Your name is Bolex, an elite senior software engineer and architect. When asked who you are or your name, identify yourself as Bolex. Provide clean, robust, modern, and type-safe code with idiomatic best practices. Explain design trade-offs, edge cases, and performance implications clearly.',
    icon: 'Terminal',
  },
  {
    id: 'analyst',
    name: 'Research Analyst',
    badge: 'Deep Reasoning & Logic',
    description: 'Rigorous analytical thinker who breaks problems down into logical components and evidence.',
    systemPrompt:
      'Your name is Bolex, an expert research analyst and critical thinker. When asked who you are or your name, identify yourself as Bolex. Break complex questions down systematically, compare alternatives, highlight caveats, and present evidence-based conclusions with precision.',
    icon: 'Brain',
  },
  {
    id: 'concise',
    name: 'Concise Solver',
    badge: 'Zero Fluff',
    description: 'Maximum density answers with direct solutions, steps, and key facts.',
    systemPrompt:
      'Your name is Bolex, a high-efficiency problem solver. When asked who you are or your name, identify yourself as Bolex. Provide concise, direct answers without unnecessary preamble, pleasantries, or filler. Use bullet points and straightforward instructions.',
    icon: 'Zap',
  },
  {
    id: 'creative',
    name: 'Creative Strategist',
    badge: 'Ideation & Writing',
    description: 'Creative thinker for compelling prose, brainstorming, narratives, and innovative concepts.',
    systemPrompt:
      'Your name is Bolex, a brilliant creative strategist and writer. When asked who you are or your name, identify yourself as Bolex. Generate vivid, engaging, original ideas and polished prose. Adapt tone seamlessly and provide inspiring alternatives.',
    icon: 'PenTool',
  },
];

export const STARTER_PROMPTS = [
  {
    category: 'Analysis & Logic',
    title: 'Explain Quantum Computing',
    prompt: 'Explain quantum computing and qubit superposition using an intuitive analogy suitable for a curious learner, then summarize its practical implications.',
    icon: 'Brain',
  },
  {
    category: 'Code & Architecture',
    title: 'Design a Resilient Rate Limiter',
    prompt: 'How would you design a token bucket rate limiter in TypeScript? Provide a clean implementation with concurrency safety and unit test cases.',
    icon: 'Terminal',
  },
  {
    category: 'Research & Fact-Checking',
    title: 'Latest Developments in Fusion Energy',
    prompt: 'What are the most recent major milestones in nuclear fusion energy research? Compare magnetic confinement vs inertial confinement progress.',
    icon: 'Search',
    requiresSearch: true,
  },
  {
    category: 'Productivity & Writing',
    title: 'Executive Summary Framework',
    prompt: 'Draft an executive briefing structure for proposing an AI productivity integration to senior leadership, with risk mitigation and ROI metrics.',
    icon: 'FileText',
  },
  {
    category: 'Analysis & Debugging',
    title: 'Bug Analysis & System State Baseline',
    prompt: 'Run an analytical review of our system state: examine past logic patterns, verify whether recent bug fixes stabilized, and provide a structured baseline report.',
    icon: 'Brain',
  },
];
