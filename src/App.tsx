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
import { PERSONA_ROLES } from './constants';
import { ChatMessage, ChatSession, ImageAttachment, PersonaRole, ChatFolder, PublicUserProfile } from './types';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { speechManager } from './lib/speechManager';
import { calculateSessionTokens } from './lib/tokenCounter';
import { generateConversationSummary, getLocalFallbackSummary } from './lib/summarizer';

const STORAGE_KEY = 'smart_ai_assistant_sessions_v1';
const FOLDERS_STORAGE_KEY = 'smart_ai_assistant_folders_v1';

const DEFAULT_FOLDERS: ChatFolder[] = [
  { id: 'folder-work', name: 'Work & Projects', color: '#3b82f6', createdAt: Date.now() - 3000, isCollapsed: false },
  { id: 'folder-ideas', name: 'Ideas & Brainstorm', color: '#f59e0b', createdAt: Date.now() - 2000, isCollapsed: false },
  { id: 'folder-code', name: 'Code & Technical', color: '#10b981', createdAt: Date.now() - 1000, isCollapsed: false },
];

function createDefaultSession(folderId?: string | null): ChatSession {
  return {
    id: `session-${Date.now()}`,
    title: 'New Chat',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    roleId: 'general',
    enableSearch: false,
    temperature: 0.7,
    folderId: folderId || null,
  };
}

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [createDefaultSession()];
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBolexPlusModalOpen, setIsBolexPlusModalOpen] = useState(false);
  const [isMapStudioOpen, setIsMapStudioOpen] = useState(false);
  const [isPeopleSearchOpen, setIsPeopleSearchOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Checking connection...');
  const [isLoading, setIsLoading] = useState(false);

  const { profile } = useAuth();
  const { toggleTheme } = useTheme();

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
        } else if (key === 'u') {
          e.preventDefault();
          setIsBolexPlusModalOpen((prev) => !prev);
        } else if (key === 't') {
          e.preventDefault();
          toggleTheme();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

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

  // Backfill 1-sentence summaries for chats that don't have one yet
  useEffect(() => {
    sessions.forEach((s) => {
      if (s.messages.length > 0 && !s.summary && !s.isSummaryLoading) {
        const fallback = getLocalFallbackSummary(s.messages, s.title);
        setSessions((prev) =>
          prev.map((item) =>
            item.id === s.id && !item.summary ? { ...item, summary: fallback } : item
          )
        );
        generateConversationSummary(s.messages, s.title)
          .then((aiSummary) => {
            setSessions((prev) =>
              prev.map((item) => (item.id === s.id ? { ...item, summary: aiSummary } : item))
            );
          })
          .catch(() => {});
      }
    });
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
    const newSession = createDefaultSession(folderId);
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
    if (window.confirm('Clear all messages in this conversation?')) {
      updateActiveSession((s) => ({
        ...s,
        messages: [],
        updatedAt: Date.now(),
      }));
    }
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
    image?: ImageAttachment,
    baseMessages?: ChatMessage[]
  ) => {
    if (!text && !image) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      image,
    };

    const assistantMessageId = `msg-${Date.now()}-ai`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const sourceMessages = baseMessages !== undefined ? baseMessages : activeSession.messages;

    // Auto title if first message in chat
    const isFirstMessage = sourceMessages.length === 0;
    const sessionTitle =
      isFirstMessage && text
        ? text.slice(0, 32) + (text.length > 32 ? '...' : '')
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

      // Format payload messages
      const apiMessages = [...sourceMessages, userMessage].map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
        image: m.image
          ? {
              mimeType: m.image.mimeType,
              data: m.image.data,
            }
          : undefined,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          systemInstruction: finalSystemPrompt,
          enableSearch: activeSession.enableSearch,
          temperature: activeSession.temperature,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
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
        const currentText = accumulatedContent;
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
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;

          let eventType = 'chunk';
          let eventData = '';

          const blockLines = block.split('\n');
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
                accumulatedContent += parsed.text;
                scheduleContentUpdate();
              }
            } catch {
              // ignore parse errors
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

      // Finalize assistant message
      updateActiveSession((s) => {
        const msgs = [...s.messages];
        const lastIdx = msgs.findIndex((m) => m.id === assistantMessageId);
        if (lastIdx !== -1) {
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            content: accumulatedContent,
            isStreaming: false,
            grounding: groundingData,
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
          content: accumulatedContent,
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
        friendlyError.includes('503') ||
        friendlyError.includes('high demand') ||
        friendlyError.includes('UNAVAILABLE') ||
        friendlyError.includes('overloaded')
      ) {
        friendlyError = 'The AI model is currently experiencing high demand. Automatic retries were attempted. Please click "Retry Response" to regenerate.';
      } else if (
        friendlyError.includes('429') ||
        friendlyError.includes('RESOURCE_EXHAUSTED') ||
        friendlyError.includes('quota')
      ) {
        friendlyError = 'AI generation quota or rate limit reached. Please wait a moment and click "Retry Response".';
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

    handleSendMessage(userMsg.content, userMsg.image, trimmed);
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
        onOpenAuth={() => {
          setAuthModalMode('signin');
          setIsAuthModalOpen(true);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenBolexPlus={() => setIsBolexPlusModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
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
        {/* Header */}
        <Header
          currentRole={currentRole}
          onOpenRoles={() => setIsRoleModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenExtension={() => setIsExtensionModalOpen(true)}
          onOpenBolexPlus={() => setIsBolexPlusModalOpen(true)}
          onOpenMap={() => setIsMapStudioOpen(true)}
          onOpenPeopleSearch={() => setIsPeopleSearchOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          onNewChat={handleNewSession}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
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
          hasMessages={activeSession.messages.length > 0}
          isBackendConnected={isBackendConnected}
          sessionTokens={activeSessionTokens}
        />

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
          onOpenBolexPlus={() => setIsBolexPlusModalOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          sessionTokens={activeSessionTokens}
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
      />

      {/* Bolex Map Studio Modal (10 Features) */}
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
    </div>
  );
}
