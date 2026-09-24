import { ChatMessage } from '../types';

/**
 * Fallback generator for a concise 1-sentence summary based on chat history
 */
export function getLocalFallbackSummary(messages: ChatMessage[], title?: string): string {
  const userMessages = messages.filter((m) => m.role === 'user' && m.content && m.content.trim());
  if (userMessages.length === 0) {
    return 'Empty conversation awaiting first prompt.';
  }

  const firstUserText = userMessages[0].content.trim().replace(/\n+/g, ' ');
  const cleanSnippet = firstUserText.length > 75 ? firstUserText.slice(0, 75).trim() + '...' : firstUserText;

  if (userMessages.length === 1) {
    return `Inquiry examining "${cleanSnippet}".`;
  }

  const lastUserText = userMessages[userMessages.length - 1].content.trim().replace(/\n+/g, ' ');
  const cleanLastSnippet = lastUserText.length > 50 ? lastUserText.slice(0, 50).trim() + '...' : lastUserText;

  return `Dialogue beginning with "${cleanSnippet}" and resolving into "${cleanLastSnippet}".`;
}

/**
 * Requests an AI-powered 1-sentence conversation summary from the server
 */
export async function generateConversationSummary(
  messages: ChatMessage[],
  title?: string
): Promise<string> {
  const nonStreaming = messages.filter((m) => !m.isStreaming && m.content && m.content.trim());
  if (nonStreaming.length === 0) {
    return 'Empty conversation awaiting prompts.';
  }

  try {
    const res = await fetch('/api/chat/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: nonStreaming.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        title: title || 'Conversation',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.summary && typeof data.summary === 'string' && data.summary.trim()) {
        return data.summary.trim();
      }
    }
  } catch (err) {
    console.warn('Could not generate server conversation summary:', err);
  }

  return getLocalFallbackSummary(nonStreaming, title);
}
