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
  planTier?: 'free' | 'plus';
}

