import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MessageItem } from './components/MessageItem';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { RoleModal } from './components/RoleModal';
import { SettingsModal } from './components/SettingsModal';
import { PERSONA_ROLES } from './constants';
import { ChatMessage, ChatSession, ImageAttachment, PersonaRole } from './types';

const STORAGE_KEY = 'smart_ai_assistant_sessions_v1';

function createDefaultSession(): ChatSession {
  return {
    id: `session-${Date.now()}`,
    title: 'New Chat',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    roleId: 'general',
    enableSearch: false,
    temperature: 0.7,
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Checking connection...');
  const [isLoading, setIsLoading] = useState(false);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || createDefaultSession();

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

  // Create new session
  const handleNewSession = () => {
    const newSession = createDefaultSession();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  // Delete a session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      const fresh = createDefaultSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      return;
    }
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
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
      const sender = msg.role === 'user' ? '### 👤 User' : '### 🤖 Gemini 3.8';
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

  // Stop Generation
  const handleStopGeneration = () => {
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
  const handleSendMessage = async (text: string, image?: ImageAttachment) => {
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

    // Auto title if first message in chat
    const isFirstMessage = activeSession.messages.length === 0;
    const sessionTitle =
      isFirstMessage && text
        ? text.slice(0, 32) + (text.length > 32 ? '...' : '')
        : activeSession.title;

    const updatedMessages = [...activeSession.messages, userMessage, assistantMessage];

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
      // Compose system instruction (persona + custom prompt)
      let finalSystemPrompt = currentRole.systemPrompt;
      if (activeSession.customSystemPrompt?.trim()) {
        finalSystemPrompt += `\n\nAdditional user guidelines:\n${activeSession.customSystemPrompt.trim()}`;
      }

      // Format payload messages
      const apiMessages = [...activeSession.messages, userMessage].map((m) => ({
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
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // user aborted intentionally
        return;
      }

      console.error('Inference error:', err);
      updateActiveSession((s) => {
        const msgs = [...s.messages];
        const lastIdx = msgs.findIndex((m) => m.id === assistantMessageId);
        if (lastIdx !== -1) {
          msgs[lastIdx] = {
            ...msgs[lastIdx],
            isStreaming: false,
            error:
              err.message ||
              'Unable to generate response. Please ensure your free Gemini API key is attached in Settings > Secrets.',
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
    if (activeSession.messages.length < 2 || isLoading) return;

    // Find last user message
    const msgs = [...activeSession.messages];
    const lastUserIdx = msgs.map((m) => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;

    const userMsg = msgs[lastUserIdx];
    // Remove everything from lastUserIdx + 1 onwards
    const trimmed = msgs.slice(0, lastUserIdx);

    updateActiveSession((s) => ({
      ...s,
      messages: trimmed,
    }));

    handleSendMessage(userMsg.content, userMsg.image);
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
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main chat column */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative bg-neutral-900/30">
        {/* Header */}
        <Header
          currentRole={currentRole}
          onOpenRoles={() => setIsRoleModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onNewChat={handleNewSession}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          enableSearch={activeSession.enableSearch}
          onToggleSearch={() =>
            updateActiveSession((s) => ({ ...s, enableSearch: !s.enableSearch }))
          }
          onExportChat={handleExportChat}
          onClearChat={handleClearChat}
          hasMessages={activeSession.messages.length > 0}
          isBackendConnected={isBackendConnected}
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

      {/* Settings Modal */}
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
      />
    </div>
  );
}
