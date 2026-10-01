import { ChatSession, ChatMessage } from '../types';

export const SESSION_STORAGE_KEY = 'bolex_sessions_v2';
export const FOLDERS_STORAGE_KEY = 'bolex_folders_v1';
export const USER_PROFILE_STORAGE_KEY = 'bolex_user_profile';

/**
 * Validates and repairs an individual message object.
 */
export function validateAndSanitizeMessage(msg: any): ChatMessage | null {
  if (!msg || typeof msg !== 'object') return null;
  const id = typeof msg.id === 'string' && msg.id.trim() ? msg.id : `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const role = msg.role === 'user' ? 'user' : 'assistant';
  const content = typeof msg.content === 'string' ? msg.content : '';
  const timestamp = typeof msg.timestamp === 'number' && !isNaN(msg.timestamp) ? msg.timestamp : Date.now();

  return {
    ...msg,
    id,
    role,
    content,
    timestamp,
    image: msg.image && typeof msg.image === 'object' ? msg.image : undefined,
    isStreaming: Boolean(msg.isStreaming),
    error: msg.error ? String(msg.error) : undefined,
  };
}

/**
 * Validates and repairs an individual chat session object.
 */
export function validateAndSanitizeSession(session: any, defaultModel: string = 'bolex-3.8'): ChatSession | null {
  if (!session || typeof session !== 'object') return null;

  const id = typeof session.id === 'string' && session.id.trim() ? session.id : `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const title = typeof session.title === 'string' && session.title.trim() ? session.title : 'New Chat';
  const createdAt = typeof session.createdAt === 'number' && !isNaN(session.createdAt) ? session.createdAt : Date.now();
  const updatedAt = typeof session.updatedAt === 'number' && !isNaN(session.updatedAt) ? session.updatedAt : createdAt;

  const rawMessages = Array.isArray(session.messages) ? session.messages : [];
  const messages: ChatMessage[] = rawMessages
    .map(validateAndSanitizeMessage)
    .filter((m): m is ChatMessage => m !== null);

  return {
    ...session,
    id,
    title,
    createdAt,
    updatedAt,
    messages,
    model: typeof session.model === 'string' ? session.model : defaultModel,
    summary: typeof session.summary === 'string' ? session.summary : undefined,
    folderId: typeof session.folderId === 'string' ? session.folderId : undefined,
    pinned: Boolean(session.pinned),
    tags: Array.isArray(session.tags) ? session.tags.filter((t: any) => typeof t === 'string') : [],
  };
}

/**
 * Safely loads sessions from localStorage, filtering out corrupted entries and repairing structure.
 */
export function safeLoadSessions(storageKey: string = SESSION_STORAGE_KEY, createDefault: () => ChatSession): ChatSession[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = parsed
          .map((s) => validateAndSanitizeSession(s))
          .filter((s): s is ChatSession => s !== null);

        if (sanitized.length > 0) {
          return sanitized;
        }
      }
    }
  } catch (err) {
    console.warn('[SessionRecovery] Corrupted session JSON detected in localStorage:', err);
  }

  const defaultSession = createDefault();
  try {
    localStorage.setItem(storageKey, JSON.stringify([defaultSession]));
  } catch {
    // Ignore storage quota errors
  }
  return [defaultSession];
}

/**
 * Creates an emergency backup JSON export of all localStorage keys.
 */
export function exportEmergencyStateBackup(): void {
  try {
    const backupData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key);
        try {
          backupData[key] = val ? JSON.parse(val) : val;
        } catch {
          backupData[key] = val;
        }
      }
    }

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bolex_emergency_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[SessionRecovery] Failed to create state backup:', err);
  }
}

/**
 * Purges corrupted session data from localStorage while preserving user profile & preferences.
 */
export function repairAndResetSessionState(): void {
  try {
    // Preserve user profile & theme
    const userProfile = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    const themeMode = localStorage.getItem('bolex_theme_mode');
    const founderPasskey = localStorage.getItem('bolex_founder_passkey_session');

    // Clear session storage keys
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('bolex_sessions_v1');
    localStorage.removeItem(FOLDERS_STORAGE_KEY);
    localStorage.removeItem('bolex_active_session');

    // Restore preserved preferences
    if (userProfile) localStorage.setItem(USER_PROFILE_STORAGE_KEY, userProfile);
    if (themeMode) localStorage.setItem('bolex_theme_mode', themeMode);
    if (founderPasskey) localStorage.setItem('bolex_founder_passkey_session', founderPasskey);

    console.info('[SessionRecovery] Session state successfully repaired.');
  } catch (err) {
    console.error('[SessionRecovery] Error repairing session state:', err);
  }
}
