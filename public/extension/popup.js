// Bolex AI Extension Client
const DEFAULT_HOST = 'https://ais-pre-cge2tjdimpisaqembh3jzh-693311015224.us-west2.run.app';

let messages = [];
let isGenerating = false;

document.addEventListener('DOMContentLoaded', () => {
  const messagesContainer = document.getElementById('messagesContainer');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');

  // Load saved state
  loadSavedState();

  // Handle Quick Chips
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt && !isGenerating) {
        sendMessage(prompt);
      }
    });
  });

  // Handle Clear Chat
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      messages = [];
      saveState();
      // Keep only welcome element
      const welcome = messagesContainer.querySelector('.system-welcome');
      messagesContainer.innerHTML = '';
      if (welcome) messagesContainer.appendChild(welcome);
    });
  }

  // Handle Send Button
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      const text = chatInput.value.trim();
      if (text && !isGenerating) {
        sendMessage(text);
        chatInput.value = '';
      }
    });
  }

  // Handle Enter key (Shift+Enter for newline)
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text && !isGenerating) {
          sendMessage(text);
          chatInput.value = '';
        }
      }
    });
  }

  function appendMessageUI(role, text) {
    const msgEl = document.createElement('div');
    msgEl.className = `message ${role}`;
    msgEl.textContent = text;
    messagesContainer.appendChild(msgEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgEl;
  }

  async function sendMessage(userText) {
    if (isGenerating) return;
    isGenerating = true;

    // Add user message
    messages.push({ role: 'user', content: userText });
    appendMessageUI('user', userText);

    // Create assistant message container
    const assistantEl = appendMessageUI('assistant', 'Thinking...');
    assistantEl.style.opacity = '0.7';

    // Standard system instruction
    const systemInstruction = "Your name is Bolex, an advanced AI Assistant built for precision, clarity, and thoughtful engineering. Provide insightful, direct, well-structured, and accurate answers.";

    try {
      const endpoint = `${DEFAULT_HOST}/api/chat`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let streamBuffer = '';
      assistantEl.textContent = '';
      assistantEl.style.opacity = '1';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        // Keep the last partial line in the buffer
        streamBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulated += parsed.text;
                assistantEl.textContent = accumulated;
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
            } catch (e) {
              // Ignore non-json chunks
            }
          }
        }
      }

      if (accumulated) {
        messages.push({ role: 'assistant', content: accumulated });
        saveState();
      } else {
        assistantEl.textContent = "No response received. Please check backend connection.";
      }
    } catch (err) {
      console.error('Bolex error:', err);
      assistantEl.textContent = `Connection Notice: ${err.message || 'Failed to reach Bolex API'}. Please ensure the Bolex backend server is running.`;
    } finally {
      isGenerating = false;
      assistantEl.style.opacity = '1';
    }
  }

  function saveState() {
    try {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ bolex_messages: messages.slice(-20) });
      } else {
        localStorage.setItem('bolex_messages', JSON.stringify(messages.slice(-20)));
      }
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  function loadSavedState() {
    try {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['bolex_messages'], (result) => {
          if (result && Array.isArray(result.bolex_messages)) {
            restoreMessages(result.bolex_messages);
          }
        });
      } else {
        const raw = localStorage.getItem('bolex_messages');
        if (raw) {
          restoreMessages(JSON.parse(raw));
        }
      }
    } catch (e) {
      console.warn('Storage load failed:', e);
    }
  }

  function restoreMessages(savedList) {
    if (!Array.isArray(savedList)) return;
    messages = savedList;
    savedList.forEach((m) => {
      appendMessageUI(m.role, m.content);
    });
  }
});
