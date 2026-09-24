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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: ImageAttachment;
  isStreaming?: boolean;
  error?: string;
  grounding?: GroundingMetadata;
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

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  roleId: string;
  customSystemPrompt?: string;
  enableSearch: boolean;
  temperature: number;
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

