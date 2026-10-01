export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
  searchEntryPoint?: {
    renderedContent?: string;
  };
}

export interface ImageAttachment {
  data: string; // Base64 without data URI prefix
  mimeType: string;
  previewUrl: string;
  name?: string;
}

export interface AIModelVersion {
  id: string; // e.g. 'bolex-4.0', 'bolex-3.8', 'bolex-2.0', 'bolex-o1'
  name: string; // e.g. 'Bolex 4.0 Omni'
  versionNumber: string; // e.g. '4.0', '3.8', '2.0', 'o1'
  tag: string; // e.g. 'Plus', 'Ultra', 'Free', 'Deep Reasoner'
  tagColor: string;
  description: string;
  speed: string; // 'Instant', 'Ultra Fast', 'Balanced', 'Deep Thought'
  intelligence: string; // '5/5', '4.5/5', '4/5', '5+/5'
  contextLength: string;
  icon: string;
  highlight?: boolean;
  requiredTier?: 'free' | 'plus' | 'ultra' | 'quantum';
  isLockedForFree?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: ImageAttachment;
  isStreaming?: boolean;
  error?: string;
  grounding?: GroundingMetadata;
  modelVersion?: string;
  latencyMs?: number;
  ttftMs?: number;
  tokenMetrics?: {
    prompt: number;
    completion: number;
    total: number;
    tokensPerSecond?: number;
  };
}

export interface PersonaRole {
  id: string;
  name: string;
  badge: string;
  description: string;
  systemPrompt: string;
  icon: string;
}

export interface ChatFolder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
  isCollapsed?: boolean;
}

export interface ContextualAnchor {
  id: string;
  title: string;
  category: 'architecture' | 'styleguide' | 'technical_doc' | 'system_rule' | 'custom';
  keywords: string[];
  content: string;
  isEnabled: boolean;
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  roleId: string;
  modelVersion?: string;
  customSystemPrompt?: string;
  enableSearch: boolean;
  temperature: number;
  enableCognitiveTrace?: boolean;
  anchorsEnabled?: boolean;
  systemStateSummary?: string;
  summary?: string;
  isSummaryLoading?: boolean;
  isPinned?: boolean;
  folderId?: string | null;
  isDeleted?: boolean;
  deletedAt?: number | null;
}

export interface SpeechSettings {
  rate: number;
  pitch: number;
  voiceURI?: string;
  autoNarrate: boolean;
}

export interface MapNode {
  id: string;
  label: string;
  description?: string;
  category: 'core' | 'code' | 'research' | 'action' | 'location' | 'creative';
  x: number;
  y: number;
  parentId?: string;
  lat?: number;
  lng?: number;
  placeName?: string;
  expanded?: boolean;
  color?: string;
  notes?: string;
  confidence?: number;
}

export interface MapLink {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: 'solid' | 'dashed' | 'curved';
}

export interface MapData {
  nodes: MapNode[];
  links: MapLink[];
  viewMode: 'knowledge' | 'places';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  isBolexPlus?: boolean;
  isBolexUltra?: boolean;
  isBolexQuantum?: boolean;
  planTier?: 'free' | 'plus' | 'ultra' | 'quantum';
  trialTier?: 'plus' | 'ultra' | 'quantum' | null;
  trialStartedAt?: string | null;
  trialExpiresAt?: string | null;
}

export interface PublicUserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  planTier?: 'free' | 'plus' | 'ultra' | 'quantum';
  createdAt: string;
  updatedAt: string;
}

export type FeedbackCategory = 'accuracy' | 'code_quality' | 'speed' | 'formatting' | 'completeness' | 'general';

export interface MessageFeedback {
  id: string;
  messageId: string;
  sessionId: string;
  sessionTitle: string;
  model: string;
  rating: number; // 1 to 5 integer
  comment?: string;
  category?: FeedbackCategory;
  userPromptSnippet?: string;
  assistantResponseSnippet?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FeedbackStats {
  totalCount: number;
  averageRating: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  positivePercentage: number;
}


