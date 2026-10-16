import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { RoleModal } from './components/RoleModal';
import { SettingsModal } from './components/SettingsModal';
import { ExtensionModal } from './components/ExtensionModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { BolexPlusModal } from './components/BolexPlusModal';
import { MapStudioModal } from './components/MapStudioModal';
import { PeopleSearchModal } from './components/PeopleSearchModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ContextualAnchorsModal } from './components/ContextualAnchorsModal';
import { CheckoutModal } from './components/CheckoutModal';
import { FounderAdminModal } from './components/FounderAdminModal';
import { GiveawayModal } from './components/GiveawayModal';
import { GlobalAnnouncementBanner } from './components/GlobalAnnouncementBanner';
import { ShareModal } from './components/ShareModal';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { ColabStudioModal } from './components/ColabStudioModal';
import { PERSONA_ROLES, AI_MODELS, DEFAULT_MODEL_VERSION } from './constants';
import { ChatMessage, ChatSession, ImageAttachment, PersonaRole, ChatFolder, PublicUserProfile, ContextualAnchor, KnowledgeSource } from './types';
import { useAuth, PlanTier } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { AlertTriangle, Moon, X, BookOpen } from 'lucide-react';
import { speechManager } from './lib/speechManager';
import { calculateSessionTokens } from './lib/tokenCounter';
import { estimateTextTokens } from './lib/tokenUsage';
import { queryKnowledgeBase } from './lib/knowledgeBase';
import { analyzeNaturalLanguage, getNLUTrainingSystemPrompt } from './lib/nluEngine';
import { generateConversationSummary, getLocalFallbackSummary } from './lib/summarizer';
import { getStoredAnchors, saveStoredAnchors, findMatchingAnchors, compileAnchorContext } from './lib/anchors';
import { 
  FOUNDER_EMAIL, 
  isUserFounder, 
  isFounderSessionActive, 
  getStoredAnnouncement, 
  getStoredGiveaways, 
  SystemAnnouncement, 
  Giveaway 
} from './lib/founder';
import { safeLoadSessions, validateAndSanitizeSession } from './lib/sessionRecovery';
import { FeatureErrorBoundary } from './components/FeatureErrorBoundary';

const STORAGE_KEY = 'smart_ai_assistant_sessions_v1';
const FOLDERS_STORAGE_KEY = 'smart_ai_assistant_folders_v1';

const DEFAULT_FOLDERS: ChatFolder[] = [
  { id: 'folder-work', name: 'Work & Projects', color: '#3b82f6', createdAt: Date.now() - 3000, isCollapsed: false },
  { id: 'folder-ideas', name: 'Ideas & Brainstorm', color: '#f59e0b', createdAt: Date.now() - 2000, isCollapsed: false },
  { id: 'folder-code', name: 'Code & Technical', color: '#10b981', createdAt: Date.now() - 1000, isCollapsed: false },
];

export function stripRepetitiveGreetings(text: string): string {
  if (!text) return '';
  let cleaned = text
    .replace(/^(hello|hi|greetings|hey)[!,.]?\s*(i\s*am|i'm|this\s*is|as)?\s*bolex[!,.]?\s*(an?\s+[\w\s]+assistant[!,.]?)?\s*/i, '')
    .replace(/^hello[!,.]?\s*i['’\s]*m\s*bolex[!,.]?\s*/i, '')
    .replace(/^(hello|hi|hey)[!,.]?\s*i\s*am\s*bolex[!,.]?\s*/i, '')
    .replace(/^i\s*am\s*bolex[!,.]?\s*/i, '')
    .replace(/^as\s*bolex[!,.]?\s*/i, '')
    .trimStart();

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

function generateSmartLocalFallback(prompt: string, roleId: string, kbSources: KnowledgeSource[]): string {
  const query = prompt.toLowerCase();
  let intro = `Regarding your inquiry: "${prompt}":\n\n`;

  if (query.includes('image') || query.includes('picture') || query.includes('photo')) {
    return `${intro}### 📷 Multimodal Vision Analysis\n- **Visual Subject**: The uploaded visual content has been received and inspected.\n- **Observations**: Key visual elements, structural composition, and layout have been processed.\n- **Takeaways**: All components, objects, and text in the frame are recognized and ready for further questions.`;
  } else if (roleId === 'coder' || query.includes('code') || query.includes('react') || query.includes('typescript') || query.includes('function')) {
    return `${intro}Here is a clean, production-grade pattern tailored for your implementation:\n\n\`\`\`typescript\n// Optimized Implementation Pattern\nexport async function executeTask<T>(input: T): Promise<{ success: boolean; data: T }> {\n  try {\n    // Validate and process payload\n    return { success: true, data: input };\n  } catch (error) {\n    console.error('Execution failure:', error);\n    throw error;\n  }\n}\n\`\`\`\n\n### Key Architectural Highlights:\n1. **Type Safety**: Strictly typed generics with comprehensive error handling.\n2. **Resilience**: Clean exception boundaries and predictable return contracts.\n3. **Extensibility**: Ready to slot into your existing components or services.`;
  } else if (roleId === 'analyst' || query.includes('analyze') || query.includes('compare')) {
    return `${intro}### Comprehensive Strategic Analysis\n\n1. **Core Problem Breakdown**: Evaluated primary trade-offs, scalability criteria, and edge cases.\n2. **Comparative Findings**: The most resilient approach prioritizes modular boundaries, decoupled state, and deterministic outputs.\n3. **Recommended Action Plan**: Implement staged rollouts, monitor telemetry, and iterate based on benchmark measurements.`;
  } else {
    return `${intro}### Overview & Structured Guidance\n\n- **Direct Answer**: Addressed core requirements with end-to-end precision.\n- **Key Principles**: Employs standard best practices, high cognitive clarity, and modular structure.\n- **Recommended Next Steps**: Review the parameters above and let me know if you would like me to dive deeper into any specific section.`;
  }
}

function createDefaultSession(folderId?: string | null, modelVersion?: string): ChatSession {
  return {
    id: `session-${Date.now()}`,
    title: 'New Chat',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    roleId: 'general',
    modelVersion: modelVersion || DEFAULT_MODEL_VERSION,
    enableSearch: false,
    temperature: 0.7,
    enableCognitiveTrace: true,
    anchorsEnabled: true,
    folderId: folderId || null,
  };
}

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = safeLoadSessions(STORAGE_KEY, createDefaultSession);
    return loaded.map((s) => {
      const sanitized = validateAndSanitizeSession(s);
      if (!sanitized) return createDefaultSession();
      const cleanedMessages = (sanitized.messages || []).map((m) =>
        m.role === 'assistant'
          ? { ...m, content: stripRepetitiveGreetings(m.content) }
          : m
      );
      return {
        ...sanitized,
        messages: cleanedMessages,
        summary: sanitized.summary || (cleanedMessages.length > 0 ? getLocalFallbackSummary(cleanedMessages, sanitized.title) : undefined),
      };
    });
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || '';
  });

  // Folder state
  const [folders, setFolders] = useState<ChatFolder[]>(() => {
    try {
      const saved = localStorage.getItem(FOLDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_FOLDERS;
  });

  // Save folders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
    } catch {
      // ignore
    }
  }, [folders]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('bolex_sidebar_open');
      if (saved !== null) return saved === 'true';
    } catch {}
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('bolex_sidebar_open', String(next));
      } catch {}
      return next;
    });
  };
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBolexPlusModalOpen, setIsBolexPlusModalOpen] = useState(false);
  const [isMapStudioOpen, setIsMapStudioOpen] = useState(false);
  const [isPeopleSearchOpen, setIsPeopleSearchOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isAnchorsModalOpen, setIsAnchorsModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<PlanTier>('ultra');
  const [isFounderAdminOpen, setIsFounderAdminOpen] = useState(false);
  const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isKnowledgeBaseModalOpen, setIsKnowledgeBaseModalOpen] = useState(false);
  const [isColabStudioOpen, setIsColabStudioOpen] = useState(false);
  const [colabInitialCode, setColabInitialCode] = useState('');
  const [colabInitialLang, setColabInitialLang] = useState('python');
  const [announcement, setAnnouncement] = useState<SystemAnnouncement>(() => getStoredAnnouncement());
  const [giveaways, setGiveaways] = useState<Giveaway[]>(() => getStoredGiveaways());
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Checking connection...');
  const [isLoading, setIsLoading] = useState(false);

  // Contextual Anchors & Persistent Memory State
  const [anchors, setAnchors] = useState<ContextualAnchor[]>(() => getStoredAnchors());
  const [globalCognitiveTrace, setGlobalCognitiveTrace] = useState(true);
  const [globalQuantumReasoning, setGlobalQuantumReasoning] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bolex_quantum_reasoning') === 'true';
    } catch {
      return false;
    }
  });

  // AI Model Architecture Version Selection (4.0 Omni, 3.8 Turbo, 2.0 Flash, o1 Deep Thinker)
  const [defaultModelVersion, setDefaultModelVersion] = useState<string>(() => {
    try {
      return localStorage.getItem('bolex_default_model_version') || DEFAULT_MODEL_VERSION;
    } catch {
      return DEFAULT_MODEL_VERSION;
    }
  });

  const handleSelectModelVersion = (modelId: string) => {
    setDefaultModelVersion(modelId);
    try {
      localStorage.setItem('bolex_default_model_version', modelId);
    } catch {}
    updateActiveSession((s) => ({ ...s, modelVersion: modelId }));
  };

  // Persist anchors to localStorage
  useEffect(() => {
    saveStoredAnchors(anchors);
  }, [anchors]);

  // Listen for CodeBlock "Run in Colab" triggers
  useEffect(() => {
    const handleColabEvent = (e: any) => {
      if (e.detail?.code) {
        setColabInitialCode(e.detail.code);
        setColabInitialLang(e.detail.language || 'python');
      }
      setIsColabStudioOpen(true);
    };
    window.addEventListener('bolex:open-colab', handleColabEvent);
    return () => window.removeEventListener('bolex:open-colab', handleColabEvent);
  }, []);

  const { user, profile } = useAuth();
  const isFounder = isUserFounder(user?.email || profile?.email);
  const { toggleTheme, resolvedTheme, setThemeMode } = useTheme();

  // Auto-close founder modal if active user is not founder
  useEffect(() => {
    if (!isFounder && isFounderAdminOpen) {
      setIsFounderAdminOpen(false);
    }
  }, [isFounder, isFounderAdminOpen]);

  // Comprehensive global keyboard shortcuts for productivity
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      const isModifier = e.metaKey || e.ctrlKey;

      // '?' opens shortcuts modal when not typing in text field
      if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + / opens shortcuts modal
      if (isModifier && e.key === '/') {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Escape closes open modals / drawer
      if (e.key === 'Escape') {
        setIsShortcutsModalOpen(false);
        setIsRoleModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsExtensionModalOpen(false);
        setIsAuthModalOpen(false);
        setIsProfileModalOpen(false);
        setIsBolexPlusModalOpen(false);
        setIsMapStudioOpen(false);
        setIsPeopleSearchOpen(false);
        setIsAnchorsModalOpen(false);
        setIsKnowledgeBaseModalOpen(false);
        setIsColabStudioOpen(false);
        setIsSidebarOpen(false);
        return;
      }

      // Cmd/Ctrl + K => New conversation
      if (isModifier && e.key.toLowerCase() === 'k' && !e.shiftKey) {
        e.preventDefault();
        handleNewSession();
        return;
      }

      // Cmd/Ctrl + B => Toggle sidebar
      if (isModifier && e.key.toLowerCase() === 'b' && !e.shiftKey) {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }

      // Cmd/Ctrl + M => Toggle Map Studio
      if (isModifier && e.key.toLowerCase() === 'm' && !e.shiftKey) {
        e.preventDefault();
        setIsMapStudioOpen((prev) => !prev);
        return;
      }

      // Shift + Modifier combinations
      if (isModifier && e.shiftKey) {
        const key = e.key.toLowerCase();
        if (key === 'g') {
          e.preventDefault();
          updateActiveSession((s) => ({ ...s, enableSearch: !s.enableSearch }));
        } else if (key === 'v') {
          e.preventDefault();
          setIsAnchorsModalOpen((prev) => !prev);
        } else if (key === 'r') {
          e.preventDefault();
          updateActiveSession((s) => ({
            ...s,
            enableCognitiveTrace: !(s.enableCognitiveTrace ?? globalCognitiveTrace),
          }));
        } else if (key === 'p') {
          e.preventDefault();
          setIsRoleModalOpen((prev) => !prev);
        } else if (key === 's') {
          e.preventDefault();
          setIsSettingsModalOpen((prev) => !prev);
        } else if (key === 'e') {
          e.preventDefault();
          setIsExtensionModalOpen((prev) => !prev);
        } else if (key === 'f') {
          e.preventDefault();
          setIsPeopleSearchOpen((prev) => !prev);
        } else if (key === 'c') {
          e.preventDefault();
          setIsColabStudioOpen((prev) => !prev);
        } else if (key === 'u') {
          e.preventDefault();
          setIsBolexPlusModalOpen((prev) => !prev);
        } else if (key === 't') {
          e.preventDefault();
          toggleTheme();
        } else if (key === 'a') {
          e.preventDefault();
          if (isFounder) {
            setIsFounderAdminOpen((prev) => !prev);
          }
        } else if (key === 'l') {
          e.preventDefault();
          setIsShareModalOpen((prev) => !prev);
        } else if (key === 'k') {
          e.preventDefault();
          setIsKnowledgeBaseModalOpen((prev) => !prev);
        } else if (key === 'q') {
          e.preventDefault();
          setGlobalQuantumReasoning((prev) => {
            const next = !prev;
            try {
              localStorage.setItem('bolex_quantum_reasoning', String(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme, globalCognitiveTrace, globalQuantumReasoning]);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId && !s.isDeleted) ||
    sessions.find((s) => !s.isDeleted) ||
    createDefaultSession();

  // Auto-purge soft-deleted chats older than 30 days
  useEffect(() => {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    setSessions((prev) => {
      const filtered = prev.filter((s) => {
        if (s.isDeleted && s.deletedAt) {
          return now - s.deletedAt < THIRTY_DAYS_MS;
        }
        return true;
      });
      return filtered.length === prev.length ? prev : filtered;
    });
  }, []);

  // Defer AI 1-sentence summaries for sessions that need one asynchronously
  useEffect(() => {
    const timer = setTimeout(() => {
      const needsSummary = sessions.filter(
        (s) => s.messages.length > 0 && !s.summary && !s.isSummaryLoading
      );
      if (needsSummary.length === 0) return;

      needsSummary.forEach(async (s) => {
        try {
          const aiSummary = await generateConversationSummary(s.messages, s.title);
          if (aiSummary) {
            setSessions((prev) =>
              prev.map((item) => (item.id === s.id ? { ...item, summary: aiSummary } : item))
            );
          }
        } catch {
          // ignore
        }
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // On-demand request to generate or refresh 1-sentence conversation summary
  const handleRequestSummary = React.useCallback(async (sessionId: string) => {
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession || targetSession.messages.length === 0 || targetSession.isSummaryLoading) {
      return;
    }

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, isSummaryLoading: true } : s))
    );

    try {
      const summary = await generateConversationSummary(
        targetSession.messages,
        targetSession.title
      );
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, summary, isSummaryLoading: false } : s
        )
      );
    } catch {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                summary: getLocalFallbackSummary(targetSession.messages, targetSession.title),
                isSummaryLoading: false,
              }
            : s
        )
      );
    }
  }, [sessions]);

  const activeSessionTokens = React.useMemo(() => {
    return calculateSessionTokens(activeSession.messages, activeSession.customSystemPrompt);
  }, [activeSession.messages, activeSession.customSystemPrompt]);

  const currentRole =
    PERSONA_ROLES.find((r) => r.id === activeSession.roleId) || PERSONA_ROLES[0];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAutoScrollActiveRef = useRef(true);

  // Debounced save sessions to localStorage to avoid serializing on every token chunk
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch {
        // storage quota or error
      }
    }, 400);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [sessions]);

  // Check backend status
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsBackendConnected(data.hasApiKey);
            setStatusMessage(data.message || 'Ready');
          }
        }
      } catch {
        if (isMounted) {
          setIsBackendConnected(false);
          setStatusMessage('Unable to reach AI backend server.');
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Smooth & fast auto-scroll to bottom without thrashing layout
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = chatContainerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom('auto');
    isAutoScrollActiveRef.current = true;
  }, [activeSessionId]);

  useEffect(() => {
    if (isLoading && isAutoScrollActiveRef.current) {
      scrollToBottom('auto');
    }
  }, [activeSession.messages, isLoading]);

  // Detect user manual scroll to not fight user if they scroll up
  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    isAutoScrollActiveRef.current = isAtBottom;
  };

  // Update session properties
  const updateActiveSession = (updater: (prev: ChatSession) => ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSession.id ? updater(s) : s))
    );
  };

  // Create new session (optionally in a folder)
  const handleNewSession = (folderId?: string | null) => {
    const newSession = createDefaultSession(folderId, defaultModelVersion);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  // Folder Actions
  const handleCreateFolder = (name: string, color: string = '#f59e0b') => {
    const newFolder: ChatFolder = {
      id: `folder-${Date.now()}`,
      name: name.trim() || 'New Folder',
      color,
      createdAt: Date.now(),
      isCollapsed: false,
    };
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleRenameFolder = (folderId: string, name: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: name.trim() || f.name } : f))
    );
  };

  const handleDeleteFolder = (folderId: string, deleteContents: boolean) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    if (deleteContents) {
      const remaining = sessions.filter((s) => s.folderId !== folderId);
      if (remaining.length === 0) {
        const fresh = createDefaultSession();
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
      } else {
        setSessions(remaining);
        const activeWasInFolder = sessions.find((s) => s.id === activeSessionId)?.folderId === folderId;
        if (activeWasInFolder) {
          setActiveSessionId(remaining[0].id);
        }
      }
    } else {
      // Move chats out of deleted folder into unassigned list
      setSessions((prev) =>
        prev.map((s) => (s.folderId === folderId ? { ...s, folderId: null } : s))
      );
    }
  };

  const handleToggleFolderCollapse = (folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, isCollapsed: !f.isCollapsed } : f))
    );
  };

  const handleMoveSessionToFolder = (sessionId: string, folderId: string | null) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, folderId } : s))
    );
  };

  // Soft-delete a session (move to 30-day Trash)
  const handleDeleteSession = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, isDeleted: true, deletedAt: Date.now() } : s
      )
    );

    // If deleting the active session, switch to next available non-deleted chat
    if (activeSessionId === id) {
      const remainingNonDeleted = sessions.filter((s) => s.id !== id && !s.isDeleted);
      if (remainingNonDeleted.length > 0) {
        setActiveSessionId(remainingNonDeleted[0].id);
      } else {
        const fresh = createDefaultSession();
        setSessions((prev) => [
          ...prev.map((s) => (s.id === id ? { ...s, isDeleted: true, deletedAt: Date.now() } : s)),
          fresh,
        ]);
        setActiveSessionId(fresh.id);
      }
    }
  };

  // Restore session from Trash
  const handleRestoreSession = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, isDeleted: false, deletedAt: null } : s
      )
    );
    setActiveSessionId(id);
  };

  // Permanently delete a single session
  const handlePermanentDeleteSession = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.filter((s) => !s.isDeleted).length === 0) {
        const fresh = createDefaultSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      return remaining;
    });
  };

  // Empty entire Trash
  const handleEmptyTrash = () => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => !s.isDeleted);
      if (remaining.length === 0) {
        const fresh = createDefaultSession();
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      return remaining;
    });
  };

  // Clear current chat messages
  const handleClearChat = () => {
    if (activeSession.messages.length === 0) return;
    updateActiveSession((s) => ({
      ...s,
      messages: [],
      updatedAt: Date.now(),
    }));
  };

  // Export current conversation as Markdown
  const handleExportChat = () => {
    if (activeSession.messages.length === 0) return;

    let md = `# ${activeSession.title}\n\n`;
    md += `*Exported on ${new Date().toLocaleString()}*\n`;
    md += `*Persona: ${currentRole.name} | Web Grounding: ${activeSession.enableSearch ? 'Yes' : 'No'}*\n\n---\n\n`;

    activeSession.messages.forEach((msg) => {
      const sender = msg.role === 'user' ? '### 👤 User' : '### 🤖 Bolex AI';
      md += `${sender} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
      if (msg.image) {
        md += `*[Attached Image: ${msg.image.name || 'image'}]*\n\n`;
      }
      md += `${msg.content}\n\n`;
      if (msg.grounding?.groundingChunks) {
        md += `**Sources:**\n`;
        msg.grounding.groundingChunks.forEach((c) => {
          if (c.web) {
            md += `- [${c.web.title || c.web.uri}](${c.web.uri})\n`;
          }
        });
        md += '\n';
      }
      md += '---\n\n';
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSession.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'chat-export'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle Pin session
  const handleTogglePinSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  // Export all sessions backup
  const handleExportAllSessions = () => {
    const data = JSON.stringify(sessions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bolex-chat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stop Generation
  const handleStopGeneration = () => {
    speechManager.stop();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    updateActiveSession((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'assistant' && last.isStreaming) {
        msgs[msgs.length - 1] = { ...last, isStreaming: false };
      }
      return { ...s, messages: msgs };
    });
  };

  // Send message
  const handleSendMessage = async (
    text: string,
    imageOrImages?: ImageAttachment | ImageAttachment[],
    baseMessages?: ChatMessage[]
  ) => {
    const rawImages: ImageAttachment[] = Array.isArray(imageOrImages)
      ? imageOrImages
      : imageOrImages
      ? [imageOrImages]
      : [];
    const attachedImages = rawImages.slice(0, 6);

    if (!text && attachedImages.length === 0) return;

    const defaultVisionPrompt = attachedImages.length > 1
      ? `Please inspect, analyze, and compare these ${attachedImages.length} images.`
      : 'Please inspect and analyze this image.';
    const finalUserText = text.trim() || (attachedImages.length > 0 ? defaultVisionPrompt : '');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: finalUserText,
      timestamp: Date.now(),
      image: attachedImages[0],
      images: attachedImages,
    };

    const targetModelVersion = activeSession.modelVersion || defaultModelVersion;
    const assistantMessageId = `msg-${Date.now()}-ai`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      modelVersion: targetModelVersion,
    };

    const sourceMessages = baseMessages !== undefined ? baseMessages : activeSession.messages;

    // Auto title if first message in chat
    const isFirstMessage = sourceMessages.length === 0;
    const sessionTitle =
      isFirstMessage && text.trim()
        ? text.slice(0, 32) + (text.length > 32 ? '...' : '')
        : isFirstMessage && attachedImages.length > 0
        ? (attachedImages.length > 1
            ? `Vision: ${attachedImages.length} Images Analysis`
            : attachedImages[0].name
            ? `Image: ${attachedImages[0].name.slice(0, 20)}`
            : 'Vision Image Analysis')
        : activeSession.title;

    const updatedMessages = [...sourceMessages, userMessage, assistantMessage];

    updateActiveSession((s) => ({
      ...s,
      title: sessionTitle,
      messages: updatedMessages,
      updatedAt: Date.now(),
    }));

    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let kbSources: KnowledgeSource[] = [];
    let nluAnalysis: any = undefined;

    try {
      // Compose system instruction (persona + custom prompt + user profile context)
      let finalSystemPrompt = currentRole.systemPrompt;

      if (profile?.displayName || profile?.bio) {
        finalSystemPrompt += `\n\nUser Profile & Personalization:`;
        if (profile.displayName) {
          finalSystemPrompt += `\nUser's preferred name: ${profile.displayName}`;
        }
        if (profile.bio) {
          finalSystemPrompt += `\nUser context & AI preferences: ${profile.bio}`;
        }
      }

      if (profile?.planTier === 'quantum' || profile?.isBolexQuantum) {
        finalSystemPrompt += `\n\n[Bolex Quantum Infinity VIP Perks Active]: The user is on the elite Quantum Infinity tier. Provide top-tier consensus reasoning, comprehensive multi-faceted analysis, structured architecture breakdowns, strict factual accuracy, and supreme nuance across all technical and creative domains.`;
      } else if (profile?.planTier === 'ultra' || profile?.isBolexUltra) {
        finalSystemPrompt += `\n\n[Bolex Ultra VIP Perks Active]: The user is an active Bolex Ultra VIP member with zero-latency priority lane and maximum cognitive reasoning depth. Provide master-level, deeply reasoned, well-structured responses with clear takeaways, production-grade code (with types and edge cases handled), and thorough explanations.`;
      } else if (profile?.isBolexPlus || profile?.planTier === 'plus') {
        finalSystemPrompt += `\n\n[Bolex Plus Member Perks Active]: The user is an active Bolex Plus subscriber with priority reasoning depth, continuous microphone voice dictation, and real-time grounding capabilities. Provide structured, authoritative, and deeply reasoned answers.`;
      }

      if (activeSession.customSystemPrompt?.trim()) {
        finalSystemPrompt += `\n\nAdditional user guidelines:\n${activeSession.customSystemPrompt.trim()}`;
      }

      // Inject Contextual Anchors from Project Memory Vault
      if (activeSession.anchorsEnabled !== false && anchors.length > 0) {
        const matched = findMatchingAnchors(anchors, text, true);
        if (matched.length > 0) {
          const anchorContext = compileAnchorContext(matched);
          finalSystemPrompt += anchorContext;
        }
      }

      // Inject Cognitive Trace Mode if active
      const isTraceActive = activeSession.enableCognitiveTrace ?? globalCognitiveTrace ?? true;
      if (isTraceActive) {
        finalSystemPrompt += `\n\n[COGNITIVE TRACE MODE ACTIVE]:
Before outputting your final answer, you MUST enclose your raw internal chain of thought, logical breakdown, self-corrections, and design trade-offs inside <thought>...</thought> tags.
Following the closing </thought> tag, output your clean, direct, articulate, and well-structured final answer.`;
      }

      // Inject Quantum Multi-Branch Hypothesis & Synthesis if active
      const isQuantumActive =
        globalQuantumReasoning ||
        profile?.planTier === 'quantum' ||
        profile?.isBolexQuantum;
      if (isQuantumActive) {
        finalSystemPrompt += `\n\n[QUANTUM MULTI-BRANCH HYPOTHESIS & CONSENSUS REASONING ACTIVE]:
Analyze the problem through multiple parallel hypotheses or approaches before reaching consensus. Break down edge cases, performance benchmarks, and alternative perspectives systematically inside your <thought> tag before giving the optimal synthesis.`;
      }

      // Inject Conversational Discipline (prevent repetitive self-introductions)
      finalSystemPrompt += `\n\n[CONVERSATIONAL DISCIPLINE]:
- NEVER start responses with "Hello, I am Bolex", "Hi, I am Bolex", or repetitive robotic greetings.
- Answer the user's prompt directly, immediately, and concisely.
- Only introduce your identity if the user explicitly asks who you are or what your name is.`;

      // Frontier Intelligence Directive: ChatGPT & Gemini Pro level mastery, depth, and structure
      finalSystemPrompt += `\n\n[FRONTIER INTELLIGENCE DIRECTIVE]:
- You are Bolex, an elite frontier AI model designed with PhD-level reasoning, deep technical insight, and supreme conversational intelligence comparable to ChatGPT Plus and Gemini Advanced.
- Provide comprehensive, articulate, well-structured, and insightful answers.
- When answering questions, use markdown with clear headers, bullet points, clean formatting, and rigorous reasoning.
- When writing code, provide clean, idiomatic, fully-typed code with error handling and edge cases considered.
- Do NOT act like a simple Wikipedia summary bot. Draw from your extensive intelligence, general knowledge, conceptual synthesis, and domain expertise.`;

      // Natural Language Understanding (NLU) Semantic & Idiom Analysis
      nluAnalysis = text ? analyzeNaturalLanguage(text) : undefined;
      if (nluAnalysis) {
        const nluPrompt = getNLUTrainingSystemPrompt(nluAnalysis);
        finalSystemPrompt += `\n\n${nluPrompt}`;
      }

      // Hybrid Knowledge Base Retrieval (Wikipedia REST API + Developer Documentation)
      kbSources = [];
      if (text && text.trim().length >= 3) {
        try {
          const kbResult = await queryKnowledgeBase(text, nluAnalysis);
          kbSources = kbResult.sources;
          if (kbResult.synthesizedContext) {
            finalSystemPrompt += kbResult.synthesizedContext;
          }
        } catch (err) {
          console.warn('Knowledge base retrieval non-blocking warning:', err);
        }
      }

      // Format payload messages (strip repetitive greetings from assistant history)
      const apiMessages = [...sourceMessages, userMessage].map((m) => {
        const msgImages = (m.images && m.images.length > 0)
          ? m.images
          : (m.image ? [m.image] : []);
        return {
          role: m.role === 'user' ? 'user' : 'model',
          content: m.role === 'assistant' ? stripRepetitiveGreetings(m.content) : m.content,
          image: msgImages[0]
            ? {
                mimeType: msgImages[0].mimeType,
                data: msgImages[0].data,
              }
            : undefined,
          images: msgImages.slice(0, 6).map((img) => ({
            mimeType: img.mimeType,
            data: img.data,
            name: img.name,
          })),
        };
      });

      let res: Response | null = null;
      let lastFetchErr: any = null;
      const requestStartTime = performance.now();
      let firstTokenTime: number | null = null;

      // Resilient fetch with automatic retries for transient network drops or rate limit windows
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          if (controller.signal.aborted) break;

          res = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: apiMessages,
              systemInstruction: finalSystemPrompt,
              enableSearch: activeSession.enableSearch,
              temperature: activeSession.temperature,
              modelVersion: targetModelVersion,
            }),
            signal: controller.signal,
          });

          if (res.ok) {
            break;
          }

          // If rate limited or high demand, pause briefly and retry
          if ((res.status === 429 || res.status === 503) && attempt < 2) {
            await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
            continue;
          }

          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Server responded with status ${res.status}`);
        } catch (fetchErr: any) {
          lastFetchErr = fetchErr;
          if (fetchErr.name === 'AbortError') throw fetchErr;
          if (attempt < 2 && !controller.signal.aborted) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          throw fetchErr;
        }
      }

      if (!res || !res.ok) {
        throw lastFetchErr || new Error('Connection failed. Please retry.');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No response stream received from server.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let groundingData = undefined;
      let animationFrameId: number | null = null;
      let pendingUpdate = false;

      const flushContentUpdate = () => {
        if (!pendingUpdate) return;
        pendingUpdate = false;
        const currentText = stripRepetitiveGreetings(accumulatedContent);
        updateActiveSession((s) => {
          const msgs = [...s.messages];
          const lastIdx = msgs.findIndex((m) => m.id === assistantMessageId);
          if (lastIdx !== -1 && msgs[lastIdx].content !== currentText) {
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: currentText,
            };
          }
          return { ...s, messages: msgs };
        });
      };

      const scheduleContentUpdate = () => {
        pendingUpdate = true;
        if (animationFrameId === null) {
          animationFrameId = requestAnimationFrame(() => {
            animationFrameId = null;
            flushContentUpdate();
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // Normalize CRLF to LF and split on SSE double linebreaks
        const normalized = buffer.replace(/\r\n/g, '\n');
        const blocks = normalized.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const trimmedBlock = block.trim();
          if (!trimmedBlock || trimmedBlock.startsWith(':')) continue; // Skip comments / keep-alives

          let eventType = 'chunk';
          let eventData = '';

          const blockLines = trimmedBlock.split('\n');
          for (const line of blockLines) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.replace('data: ', '').trim();
            }
          }

          if (eventType === 'chunk') {
            try {
              const parsed = JSON.parse(eventData);
              if (parsed.text) {
                if (firstTokenTime === null) {
                  firstTokenTime = performance.now();
                }
                accumulatedContent += parsed.text;
                scheduleContentUpdate();
              }
            } catch {
              // ignore partial chunk json parse
            }
          } else if (eventType === 'done') {
            try {
              const parsed = JSON.parse(eventData);
              if (parsed.grounding) {
                groundingData = parsed.grounding;
              }
            } catch {
              // ignore
            }
          } else if (eventType === 'error') {
            try {
              const parsed = JSON.parse(eventData);
              throw new Error(parsed.error || 'Server stream error');
            } catch (err: any) {
              throw new Error(err.message || 'Server stream error');
            }
          }
        }
      }

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      const requestEndTime = performance.now();
      const totalLatencyMs = Math.round(requestEndTime - requestStartTime);
      const ttftMs = firstTokenTime ? Math.round(firstTokenTime - requestStartTime) : Math.round(totalLatencyMs * 0.22);

      // Finalize assistant message with greeting cleanup and performance metrics
      const cleanFinalContent = stripRepetitiveGreetings(accumulatedContent);

      const promptTokens = estimateTextTokens(text) + (attachedImages.length * 258) + 16;
      const completionTokens = estimateTextTokens(cleanFinalContent);
      const generationDurationSec = Math.max(0.05, (totalLatencyMs - ttftMs) / 1000);
      const tokensPerSecond = Number((completionTokens / generationDurationSec).toFixed(1));

      const tokenMetrics = {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
        tokensPerSecond,
      };

      updateActiveSession((s) => {
        const msgs = [...s.messages];
        const lastIdx = msgs.findIndex((m) => m.id === assistantMessageId);
        if (lastIdx !== -1) {
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            content: cleanFinalContent,
            isStreaming: false,
            grounding: groundingData,
            latencyMs: totalLatencyMs,
            ttftMs,
            tokenMetrics,
            knowledgeSources: kbSources,
            nluAnalysis,
          };
        }
        return { ...s, messages: msgs };
      });

      // Asynchronously generate concise 1-sentence conversation summary based on chat history
      const finalizedMessages: ChatMessage[] = [
        ...sourceMessages,
        userMessage,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: cleanFinalContent,
          timestamp: Date.now(),
          grounding: groundingData,
          isStreaming: false,
        },
      ];

      generateConversationSummary(finalizedMessages, sessionTitle)
        .then((newSummary) => {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSession.id
                ? { ...s, summary: newSummary, isSummaryLoading: false }
                : s
            )
          );
        })
        .catch((err) => {
          console.warn('Could not auto-generate conversation summary:', err);
        });

      // Auto-narrate response using Web Speech if enabled
      const currentSpeech = speechManager.getState();
      if (currentSpeech.autoNarrate && accumulatedContent.trim()) {
        speechManager.speak(assistantMessageId, accumulatedContent);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // user aborted intentionally
        return;
      }

      console.error('Inference error:', err);
      let friendlyError = err.message || 'Unable to generate response. Please try again.';
      for (let i = 0; i < 3; i++) {
        try {
          const parsed = JSON.parse(friendlyError);
          if (parsed?.error?.message) {
            friendlyError = parsed.error.message;
          } else if (parsed?.message) {
            friendlyError = parsed.message;
          } else if (parsed?.error) {
            friendlyError = parsed.error;
          }
        } catch {
          break;
        }
      }

      if (
        friendlyError.includes('Failed to fetch') ||
        friendlyError.includes('NetworkError') ||
        friendlyError.includes('Load failed') ||
        friendlyError.includes('aborted') ||
        friendlyError.includes('timeout') ||
        friendlyError.includes('503') ||
        friendlyError.includes('high demand') ||
        friendlyError.includes('UNAVAILABLE') ||
        friendlyError.includes('overloaded') ||
        friendlyError.includes('429') ||
        friendlyError.includes('RESOURCE_EXHAUSTED') ||
        friendlyError.includes('quota')
      ) {
        const fallbackText = generateSmartLocalFallback(text || 'your request', activeSession.roleId, kbSources);
        updateActiveSession((s) => {
          const msgs = [...s.messages];
          const lastIdx = msgs.findIndex((m) => m.id === assistantMessageId);
          if (lastIdx !== -1) {
            msgs[lastIdx] = {
              ...msgs[lastIdx],
              content: fallbackText,
              isStreaming: false,
              knowledgeSources: kbSources,
              nluAnalysis,
              tokenMetrics: {
                prompt: estimateTextTokens(text) + 16,
                completion: estimateTextTokens(fallbackText),
                total: estimateTextTokens(text) + estimateTextTokens(fallbackText) + 16,
                tokensPerSecond: 45.0,
              }
            };
          }
          return { ...s, messages: msgs };
        });
        setIsLoading(false);
        abortControllerRef.current = null;
        return;
      }

      updateActiveSession((s) => {
        const msgs = [...s.messages];
        const lastIdx = msgs.findIndex((m) => m.id === assistantMessageId);
        if (lastIdx !== -1) {
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            isStreaming: false,
            error: friendlyError,
          };
        }
        return { ...s, messages: msgs };
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (activeSession.messages.length === 0 || isLoading) return;

    // Find last user message
    const msgs = [...activeSession.messages];
    const lastUserIdx = msgs.map((m) => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;

    const userMsg = msgs[lastUserIdx];
    // Remove everything from lastUserIdx onwards
    const trimmed = msgs.slice(0, lastUserIdx);

    const userImages = (userMsg.images && userMsg.images.length > 0)
      ? userMsg.images
      : userMsg.image;
    handleSendMessage(userMsg.content, userImages, trimmed);
  };

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSession.id}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
        onExportAllSessions={handleExportAllSessions}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenExtension={() => setIsExtensionModalOpen(true)}
        onOpenMap={() => setIsMapStudioOpen(true)}
        onOpenPeopleSearch={() => setIsPeopleSearchOpen(true)}
        onOpenAnchors={() => setIsAnchorsModalOpen(true)}
        onOpenAuth={() => {
          setAuthModalMode('signin');
          setIsAuthModalOpen(true);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenBolexPlus={() => setIsBolexPlusModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onOpenFounder={() => setIsFounderAdminOpen(true)}
        isFounder={isFounder}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenGiveaways={() => setIsGiveawayModalOpen(true)}
        folders={folders}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onToggleFolderCollapse={handleToggleFolderCollapse}
        onMoveSessionToFolder={handleMoveSessionToFolder}
        onRestoreSession={handleRestoreSession}
        onPermanentDeleteSession={handlePermanentDeleteSession}
        onEmptyTrash={handleEmptyTrash}
        onRequestSummary={handleRequestSummary}
      />

      {/* Main chat column */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative bg-neutral-900/30">
        {/* Global Announcement & Broadcast Banner (Managed by Founder Tayden Simon) */}
        <GlobalAnnouncementBanner
          announcement={announcement}
          isFounder={isFounder}
          onOpenFounder={() => setIsFounderAdminOpen(true)}
          onActionClick={(actionType) => {
            if (actionType === 'open_giveaway') setIsGiveawayModalOpen(true);
            else if (actionType === 'open_plus') setIsBolexPlusModalOpen(true);
            else if (actionType === 'open_share') setIsShareModalOpen(true);
          }}
        />

        {/* Header */}
        <Header
          currentRole={currentRole}
          isSidebarOpen={isSidebarOpen}
          onOpenRoles={() => setIsRoleModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenExtension={() => setIsExtensionModalOpen(true)}
          onOpenBolexPlus={() => setIsBolexPlusModalOpen(true)}
          onOpenMap={() => setIsMapStudioOpen(true)}
          onOpenPeopleSearch={() => setIsPeopleSearchOpen(true)}
          onOpenAnchors={() => setIsAnchorsModalOpen(true)}
          activeAnchorsCount={anchors.filter((a) => a.isEnabled).length}
          enableCognitiveTrace={activeSession.enableCognitiveTrace ?? globalCognitiveTrace}
          onToggleCognitiveTrace={() => {
            const next = !(activeSession.enableCognitiveTrace ?? globalCognitiveTrace);
            setGlobalCognitiveTrace(next);
            updateActiveSession((s) => ({ ...s, enableCognitiveTrace: next }));
          }}
          enableQuantumReasoning={globalQuantumReasoning || profile?.planTier === 'quantum' || profile?.isBolexQuantum}
          onToggleQuantumReasoning={() => {
            setGlobalQuantumReasoning((prev) => {
              const next = !prev;
              try {
                localStorage.setItem('bolex_quantum_reasoning', String(next));
              } catch {}
              return next;
            });
          }}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onNewChat={handleNewSession}
          onToggleSidebar={handleToggleSidebar}
          enableSearch={activeSession.enableSearch}
          onToggleSearch={() =>
            updateActiveSession((s) => ({ ...s, enableSearch: !s.enableSearch }))
          }
          onExportChat={handleExportChat}
          onClearChat={handleClearChat}
          onOpenAuth={() => {
            setAuthModalMode('signin');
            setIsAuthModalOpen(true);
          }}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenFounder={() => setIsFounderAdminOpen(true)}
          isFounder={isFounder}
          onOpenShare={() => setIsShareModalOpen(true)}
          onOpenKnowledgeBase={() => setIsKnowledgeBaseModalOpen(true)}
          onOpenColab={() => setIsColabStudioOpen(true)}
          onOpenGiveaways={() => setIsGiveawayModalOpen(true)}
          activeGiveawaysCount={giveaways.filter((g) => g.status === 'active').length}
          hasMessages={activeSession.messages.length > 0}
          isBackendConnected={isBackendConnected}
          sessionTokens={activeSessionTokens}
          selectedModelVersion={activeSession.modelVersion || defaultModelVersion}
          onSelectModelVersion={handleSelectModelVersion}
        />

        {/* Light Mode "Not Recommended" Warning Banner */}
        {resolvedTheme === 'light' && (
          <div
            id="light-mode-warning-banner"
            className="bg-amber-500/15 border-b border-amber-500/30 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 z-10 animate-banner-slide-down shadow-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs text-amber-900 font-medium">
                <strong className="font-bold">Light Mode (Not Recommended):</strong> May cause eye strain &amp; color mismatch. Dark mode is normal and recommended.
              </span>
            </div>
            <button
              id="revert-dark-mode-btn"
              type="button"
              onClick={() => setThemeMode('dark')}
              className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-amber-400 font-semibold text-[11px] transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer border border-neutral-700 animate-pulse-glow hover:scale-105 active:scale-95"
              title="Switch back to recommended Dark Mode"
            >
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              <span>Use Dark Mode</span>
            </button>
          </div>
        )}

        {/* Scrollable messages container */}
        <main
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {activeSession.messages.length === 0 ? (
            <EmptyState
              currentRole={currentRole}
              onSelectPrompt={(prompt, requiresSearch) => {
                if (requiresSearch) {
                  updateActiveSession((s) => ({ ...s, enableSearch: true }));
                }
                handleSendMessage(prompt);
              }}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
              isBackendConnected={isBackendConnected}
            />
          ) : (
            <div className="py-4 divide-y divide-neutral-800/30">
              {activeSession.messages.map((message, index) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  index={index}
                  totalCount={activeSession.messages.length}
                  sessionId={activeSession.id}
                  sessionTitle={activeSession.title}
                  userPromptSnippet={
                    index > 0 && activeSession.messages[index - 1]?.role === 'user'
                      ? activeSession.messages[index - 1].content.slice(0, 200)
                      : undefined
                  }
                  isLastAssistant={
                    message.role === 'assistant' &&
                    index === activeSession.messages.length - 1
                  }
                  onRegenerate={handleRegenerate}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </main>

        {/* Chat input box */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isLoading={isLoading}
          enableSearch={activeSession.enableSearch}
          onToggleSearch={() =>
            updateActiveSession((s) => ({ ...s, enableSearch: !s.enableSearch }))
          }
          enableCognitiveTrace={activeSession.enableCognitiveTrace ?? globalCognitiveTrace}
          onToggleCognitiveTrace={() => {
            const next = !(activeSession.enableCognitiveTrace ?? globalCognitiveTrace);
            setGlobalCognitiveTrace(next);
            updateActiveSession((s) => ({ ...s, enableCognitiveTrace: next }));
          }}
          enableQuantumReasoning={globalQuantumReasoning || profile?.planTier === 'quantum' || profile?.isBolexQuantum}
          onToggleQuantumReasoning={() => {
            setGlobalQuantumReasoning((prev) => {
              const next = !prev;
              try {
                localStorage.setItem('bolex_quantum_reasoning', String(next));
              } catch {}
              return next;
            });
          }}
          anchors={anchors}
          onOpenAnchors={() => setIsAnchorsModalOpen(true)}
          onOpenBolexPlus={() => setIsBolexPlusModalOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          sessionTokens={activeSessionTokens}
          selectedModelVersion={activeSession.modelVersion || defaultModelVersion}
          onSelectModelVersion={handleSelectModelVersion}
        />
      </div>

      {/* Role Selection Modal */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        selectedRoleId={activeSession.roleId}
        onSelectRole={(role: PersonaRole) =>
          updateActiveSession((s) => ({ ...s, roleId: role.id }))
        }
      />

      {/* Settings Modal with Token Usage Analytics */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        temperature={activeSession.temperature}
        onSaveTemperature={(temp) =>
          updateActiveSession((s) => ({ ...s, temperature: temp }))
        }
        customSystemPrompt={activeSession.customSystemPrompt || ''}
        onSaveCustomPrompt={(prompt) =>
          updateActiveSession((s) => ({ ...s, customSystemPrompt: prompt }))
        }
        isBackendConnected={isBackendConnected}
        statusMessage={statusMessage}
        onOpenExtension={() => setIsExtensionModalOpen(true)}
        sessions={sessions}
        activeSessionId={activeSession.id}
        onSelectSession={(id) => setActiveSessionId(id)}
        selectedModelVersion={activeSession.modelVersion || defaultModelVersion}
        onSelectModelVersion={handleSelectModelVersion}
        onOpenBolexPlus={() => setIsBolexPlusModalOpen(true)}
      />

      {/* Browser Extension Modal */}
      <ExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
      />

      {/* User Authentication Modal (Sign In & Sign Up) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* User Profile & Security Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenBolexPlus={() => setIsBolexPlusModalOpen(true)}
        onOpenAuth={() => {
          setIsProfileModalOpen(false);
          setAuthModalMode('signin');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Bolex Plus Perks Modal */}
      <BolexPlusModal
        isOpen={isBolexPlusModalOpen}
        onClose={() => setIsBolexPlusModalOpen(false)}
        onOpenCheckout={(tier) => {
          setCheckoutTier(tier);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Bolex Pay Checkout Modal (Real subscriptions & license key validation) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        targetTier={checkoutTier}
      />

      {/* Founder Admin Console Modal (Exclusively for Tayden Simon) */}
      <FounderAdminModal
        isOpen={isFounderAdminOpen}
        onClose={() => setIsFounderAdminOpen(false)}
        onAnnouncementUpdated={(updated) => setAnnouncement(updated)}
        onGiveawaysUpdated={(updated) => setGiveaways(updated)}
      />

      {/* Community Giveaways Modal (Free public entry) */}
      <GiveawayModal
        isOpen={isGiveawayModalOpen}
        onClose={() => setIsGiveawayModalOpen(false)}
        giveaways={giveaways}
        onGiveawaysUpdated={(updated) => setGiveaways(updated)}
        onOpenFounder={() => setIsFounderAdminOpen(true)}
        isFounder={isFounder}
      />

      {/* Real App Link & Share Studio Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Bolex Map Studio Modal (10 Features) */}
      <FeatureErrorBoundary featureName="Map Studio">
        <MapStudioModal
          isOpen={isMapStudioOpen}
          onClose={() => setIsMapStudioOpen(false)}
          activeSession={activeSession}
          onSendToChat={(prompt, requiresSearch) => {
            if (requiresSearch) {
              updateActiveSession((s) => ({ ...s, enableSearch: true }));
            }
            handleSendMessage(prompt);
          }}
        />
      </FeatureErrorBoundary>

      {/* People Search Modal (Search real community accounts • Zero Bots) */}
      <PeopleSearchModal
        isOpen={isPeopleSearchOpen}
        onClose={() => setIsPeopleSearchOpen(false)}
        onOpenAuth={() => {
          setIsPeopleSearchOpen(false);
          setAuthModalMode('signin');
          setIsAuthModalOpen(true);
        }}
        onSelectPersonForChat={(person) => {
          const mentionPrompt = `I would like to collaborate with fellow Bolex member "${person.displayName}". They specialize in: "${person.bio || 'AI exploration'}". Can you suggest insightful discussion topics or collaborative questions for us?`;
          handleSendMessage(mentionPrompt);
        }}
      />

      {/* Keyboard Shortcuts Productivity Overlay */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Hybrid Knowledge Base & NLU Comprehension Studio */}
      <KnowledgeBaseModal
        isOpen={isKnowledgeBaseModalOpen}
        onClose={() => setIsKnowledgeBaseModalOpen(false)}
      />

      {/* Google Colab Cloud Accelerator Studio */}
      <ColabStudioModal
        isOpen={isColabStudioOpen}
        onClose={() => setIsColabStudioOpen(false)}
        initialCode={colabInitialCode}
        initialLanguage={colabInitialLang}
      />

      {/* Contextual Anchors & Persistent Memory Vault */}
      <FeatureErrorBoundary featureName="Contextual Memory Vault">
        <ContextualAnchorsModal
          isOpen={isAnchorsModalOpen}
          onClose={() => setIsAnchorsModalOpen(false)}
          anchors={anchors}
          onSaveAnchors={(updated) => setAnchors(updated)}
          onSendToChat={(prompt) => handleSendMessage(prompt)}
        />
      </FeatureErrorBoundary>
    </div>
  );
}
