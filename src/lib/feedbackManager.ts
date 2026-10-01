import { MessageFeedback, FeedbackStats, FeedbackCategory } from '../types';

export const FEEDBACK_STORAGE_KEY = 'bolex_message_feedback_v1';
export const FEEDBACK_UPDATED_EVENT = 'bolex:feedback-updated';

/**
 * Retrieve all saved message feedbacks from localStorage.
 */
export function getAllFeedback(): MessageFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  } catch (err) {
    console.warn('[FeedbackManager] Failed to parse feedback from storage', err);
  }
  return [];
}

/**
 * Get feedback for a specific message by its messageId.
 */
export function getMessageFeedback(messageId: string): MessageFeedback | null {
  if (!messageId) return null;
  const all = getAllFeedback();
  return all.find((f) => f.messageId === messageId) || null;
}

/**
 * Save or update feedback for a message.
 */
export function saveMessageFeedback(feedback: Omit<MessageFeedback, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): MessageFeedback {
  const all = getAllFeedback();
  const existingIdx = all.findIndex((f) => f.messageId === feedback.messageId);
  const now = Date.now();

  let savedRecord: MessageFeedback;

  if (existingIdx >= 0) {
    savedRecord = {
      ...all[existingIdx],
      ...feedback,
      updatedAt: now,
    };
    all[existingIdx] = savedRecord;
  } else {
    savedRecord = {
      ...feedback,
      id: feedback.id || `fb_${now}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    all.unshift(savedRecord);
  }

  try {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(all));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FEEDBACK_UPDATED_EVENT, { detail: savedRecord }));
    }
  } catch (err) {
    console.error('[FeedbackManager] Failed to persist feedback', err);
  }

  return savedRecord;
}

/**
 * Delete feedback by ID.
 */
export function deleteFeedback(id: string): boolean {
  try {
    const all = getAllFeedback();
    const filtered = all.filter((f) => f.id !== id);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FEEDBACK_UPDATED_EVENT));
    }
    return true;
  } catch (err) {
    console.error('[FeedbackManager] Failed to delete feedback', err);
    return false;
  }
}

/**
 * Clear all feedback history.
 */
export function clearAllFeedback(): void {
  try {
    localStorage.removeItem(FEEDBACK_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FEEDBACK_UPDATED_EVENT));
    }
  } catch (err) {
    console.error('[FeedbackManager] Failed to clear feedback', err);
  }
}

/**
 * Calculate aggregate analytics and rating distribution.
 */
export function getFeedbackAnalytics(): FeedbackStats {
  const all = getAllFeedback();
  if (all.length === 0) {
    return {
      totalCount: 0,
      averageRating: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      positivePercentage: 0,
    };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  let positiveCount = 0;

  for (const item of all) {
    const r = Math.max(1, Math.min(5, Math.round(item.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[r] = (distribution[r] || 0) + 1;
    sum += r;
    if (r >= 4) {
      positiveCount++;
    }
  }

  const totalCount = all.length;
  const averageRating = Number((sum / totalCount).toFixed(2));
  const positivePercentage = Math.round((positiveCount / totalCount) * 100);

  return {
    totalCount,
    averageRating,
    distribution,
    positivePercentage,
  };
}

/**
 * Export all feedback records as a downloadable CSV file.
 */
export function exportFeedbackToCSV(): void {
  const all = getAllFeedback();
  if (all.length === 0) {
    alert('No feedback entries to export.');
    return;
  }

  const headers = [
    'Feedback ID',
    'Timestamp (ISO)',
    'Session ID',
    'Session Title',
    'Model',
    'Star Rating (1-5)',
    'Category',
    'User Written Comment',
    'User Prompt Snippet',
    'Assistant Response Snippet',
  ];

  const rows = all.map((f) => [
    f.id,
    new Date(f.createdAt).toISOString(),
    f.sessionId,
    `"${(f.sessionTitle || '').replace(/"/g, '""')}"`,
    f.model || 'bolex-turbo',
    f.rating,
    f.category || 'general',
    `"${(f.comment || '').replace(/"/g, '""')}"`,
    `"${(f.userPromptSnippet || '').replace(/"/g, '""')}"`,
    `"${(f.assistantResponseSnippet || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `bolex_ai_feedback_export_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
