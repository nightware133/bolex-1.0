// Bolex AI Extension Client v2.0 - Complete Multi-Feature Engine
const DEFAULT_FALLBACK_HOST = 'https://ais-pre-cge2tjdimpisaqembh3jzh-693311015224.us-west2.run.app';

let currentHost = DEFAULT_FALLBACK_HOST;
let messages = [];
let isGenerating = false;
let activeAbortController = null;
let enableSearch = false;
let currentPersona = 'general';
let currentModelVersion = 'bolex-4.0';
let currentTemperature = 0.7;
let attachedImageData = null; // { mimeType, data, name }
let activeSpeechUtterance = null;

// Persona System Instructions
const PERSONA_INSTRUCTIONS = {
  general: 'Your name is Bolex, an advanced AI Assistant built for precision, clarity, and thoughtful engineering. Provide insightful, direct, well-structured, and accurate answers.',
  developer: 'You are Bolex Lead Architect, an elite software engineer. Provide production-ready, clean, well-typed, and secure code with architectural explanations and edge case consideration.',
  analyst: 'You are Bolex Senior Research Analyst. Provide data-driven, structured breakdowns with key metrics, pros/cons analysis, citations, and strategic recommendations.',
  creative: 'You are Bolex Creative Director & Copywriter. Craft compelling, engaging, distinctive, and punchy writing tailored to modern audiences.',
  concise: 'You are Bolex Executive Briefing Engine. Be ultra-concise, direct, bulleted, and omit fluff. Maximum density of high-value information.'
};

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const messagesContainer = document.getElementById('messagesContainer');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const sendIcon = document.getElementById('sendIcon');
  const stopIcon = document.getElementById('stopIcon');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const toggleSearchBtn = document.getElementById('toggleSearchBtn');
  const searchDot = document.getElementById('searchDot');
  const searchIndicator = document.getElementById('searchIndicator');
  const summarizePageBtn = document.getElementById('summarizePageBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const backendHostInput = document.getElementById('backendHostInput');
  const saveHostBtn = document.getElementById('saveHostBtn');
  const testConnectionBtn = document.getElementById('testConnectionBtn');
  const connectionFeedback = document.getElementById('connectionFeedback');
  const modelVersionSelect = document.getElementById('modelVersionSelect');
  const personaSelect = document.getElementById('personaSelect');
  const personaTag = document.getElementById('personaTag');
  const activeModeBadge = document.getElementById('activeModeBadge');
  const temperatureSlider = document.getElementById('temperatureSlider');
  const tempValue = document.getElementById('tempValue');
  const serverStatus = document.getElementById('serverStatus');
  const openFullAppBtn = document.getElementById('openFullAppBtn');
  const attachImageBtn = document.getElementById('attachImageBtn');
  const imageFileInput = document.getElementById('imageFileInput');
  const imagePreviewBar = document.getElementById('imagePreviewBar');
  const imagePreviewImg = document.getElementById('imagePreviewImg');
  const imageFileName = document.getElementById('imageFileName');
  const removeImageBtn = document.getElementById('removeImageBtn');

  // Pill buttons
  const pillSummarizePage = document.getElementById('pillSummarizePage');
  const pillExplainCode = document.getElementById('pillExplainCode');
  const pillPromptStudio = document.getElementById('pillPromptStudio');
  const pillConceptMap = document.getElementById('pillConceptMap');

  // 1. Initialize State & Host
  await initHostAndSettings();
  await loadSavedState();
  checkServerHealth();

  // 2. Check for Pending Context Menu Action
  checkPendingContextMenu();

  // 3. Event Listeners
  // Web Search Toggle
  if (toggleSearchBtn) {
    toggleSearchBtn.addEventListener('click', () => {
      enableSearch = !enableSearch;
      updateSearchUI();
      saveSettings();
    });
  }

  function updateSearchUI() {
    if (enableSearch) {
      toggleSearchBtn.classList.add('active');
      searchIndicator.classList.remove('hidden');
    } else {
      toggleSearchBtn.classList.remove('active');
      searchIndicator.classList.add('hidden');
    }
  }

  // Model Version Change
  if (modelVersionSelect) {
    modelVersionSelect.addEventListener('change', () => {
      currentModelVersion = modelVersionSelect.value;
      saveSettings();
    });
  }

  // Persona Change
  if (personaSelect) {
    personaSelect.addEventListener('change', () => {
      currentPersona = personaSelect.value;
      const label = personaSelect.options[personaSelect.selectedIndex].text.split(' ')[0] + ' ' + personaSelect.options[personaSelect.selectedIndex].text.split(' ')[1];
      personaTag.textContent = label;
      activeModeBadge.textContent = currentPersona === 'developer' ? 'Code' : currentPersona === 'analyst' ? 'Analyst' : currentPersona === 'creative' ? 'Creative' : currentPersona === 'concise' ? 'Executive' : 'Turbo';
      saveSettings();
    });
  }

  // Temperature Change
  if (temperatureSlider) {
    temperatureSlider.addEventListener('input', () => {
      currentTemperature = parseFloat(temperatureSlider.value);
      if (tempValue) tempValue.textContent = currentTemperature.toFixed(1);
      saveSettings();
    });
  }

  // Settings Panel Toggle
  if (settingsBtn && settingsPanel) {
    settingsBtn.addEventListener('click', () => {
      settingsPanel.classList.toggle('hidden');
      if (!settingsPanel.classList.contains('hidden') && backendHostInput) {
        backendHostInput.value = currentHost;
      }
    });
  }

  if (closeSettingsBtn && settingsPanel) {
    closeSettingsBtn.addEventListener('click', () => {
      settingsPanel.classList.add('hidden');
    });
  }

  // Save Host
  if (saveHostBtn && backendHostInput) {
    saveHostBtn.addEventListener('click', () => {
      let host = backendHostInput.value.trim();
      if (!host) host = DEFAULT_FALLBACK_HOST;
      host = host.replace(/\/+$/, '');
      currentHost = host;
      if (openFullAppBtn) openFullAppBtn.href = currentHost;
      saveSettings();
      connectionFeedback.textContent = 'Host saved! Testing connection...';
      connectionFeedback.style.color = '#f59e0b';
      checkServerHealth();
    });
  }

  // Test Connection
  if (testConnectionBtn && backendHostInput) {
    testConnectionBtn.addEventListener('click', async () => {
      let host = backendHostInput.value.trim() || currentHost;
      host = host.replace(/\/+$/, '');
      connectionFeedback.textContent = 'Connecting to ' + host + '...';
      connectionFeedback.style.color = '#f59e0b';
      try {
        const res = await fetch(`${host}/api/health`, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          connectionFeedback.textContent = `Connected! ${data.message || 'Server OK'}`;
          connectionFeedback.style.color = '#10b981';
          updateServerStatusBadge(true);
        } else {
          connectionFeedback.textContent = `Server returned HTTP ${res.status}`;
          connectionFeedback.style.color = '#ef4444';
          updateServerStatusBadge(false);
        }
      } catch (err) {
        connectionFeedback.textContent = `Connection failed: ${err.message || 'Cannot reach host'}`;
        connectionFeedback.style.color = '#ef4444';
        updateServerStatusBadge(false);
      }
    });
  }

  // Clear Chat
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      if (isGenerating && activeAbortController) {
        activeAbortController.abort();
      }
      messages = [];
      saveState();
      const welcome = messagesContainer.querySelector('.system-welcome');
      messagesContainer.innerHTML = '';
      if (welcome) messagesContainer.appendChild(welcome);
    });
  }

  // Quick Chips
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt && !isGenerating) {
        sendMessage(prompt);
      }
    });
  });

  // Pill Buttons
  if (pillSummarizePage) {
    pillSummarizePage.addEventListener('click', () => handleSummarizePage());
  }
  if (summarizePageBtn) {
    summarizePageBtn.addEventListener('click', () => handleSummarizePage());
  }
  if (pillExplainCode) {
    pillExplainCode.addEventListener('click', () => {
      if (chatInput) {
        chatInput.value = 'Explain the following code, step by step, with edge case analysis:\n\n```\n\n```';
        chatInput.focus();
        autoResizeInput();
      }
    });
  }
  if (pillPromptStudio) {
    pillPromptStudio.addEventListener('click', () => {
      if (chatInput) {
        chatInput.value = 'Optimize and engineer this prompt for maximum AI performance:\n\n"';
        chatInput.focus();
        autoResizeInput();
      }
    });
  }
  if (pillConceptMap) {
    pillConceptMap.addEventListener('click', () => {
      if (chatInput) {
        chatInput.value = 'Create a comprehensive concept knowledge map for:\n\n';
        chatInput.focus();
        autoResizeInput();
      }
    });
  }

  // Image Attachment Handlers
  if (attachImageBtn && imageFileInput) {
    attachImageBtn.addEventListener('click', () => {
      imageFileInput.click();
    });

    imageFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        processImageFile(file);
      }
    });
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', () => {
      clearAttachedImage();
    });
  }

  // Anti-Copy Warning Patterns & Cleaner
  const ANTI_COPY_PATTERNS = [
    /Copying this information won['’]?t help you achieve mastery of the content\.?\s*You can master it on your own!?/gi,
    /Copying this information won['’]?t help you achieve mastery of the content\.?/gi,
    /You can master it on your own!?/gi,
    /Mastery of the content cannot be achieved by copying\.?/gi,
    /Read more at:\s*https?:\/\/[^\s]+/gi,
    /Source:\s*https?:\/\/[^\s]+/gi,
    /Copied from\s+[^\n\r]+/gi,
    /All rights reserved\.?\s*Copyright ©\s*\d{4}[^\n\r]*/gi
  ];

  function sanitizeAntiCopyTextPopup(text) {
    if (!text) return { cleaned: '', wasCleaned: false };
    let cleaned = text;
    let wasCleaned = false;
    for (const pattern of ANTI_COPY_PATTERNS) {
      if (pattern.test(cleaned)) {
        wasCleaned = true;
        cleaned = cleaned.replace(pattern, '');
      }
    }
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    return { cleaned, wasCleaned };
  }

  // Auto Paste Button Listener
  const autoPasteBtn = document.getElementById('autoPasteBtn');
  if (autoPasteBtn && chatInput) {
    autoPasteBtn.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          const res = sanitizeAntiCopyTextPopup(text);
          chatInput.value = chatInput.value ? `${chatInput.value}\n${res.cleaned}` : res.cleaned;
          chatInput.focus();
        }
      } catch (err) {
        // ignore
      }
    });
  }

  // Intercept Paste in Input
  if (chatInput) {
    chatInput.addEventListener('paste', (e) => {
      const pasted = e.clipboardData?.getData('text');
      if (pasted) {
        const res = sanitizeAntiCopyTextPopup(pasted);
        if (res.wasCleaned) {
          e.preventDefault();
          const start = chatInput.selectionStart || 0;
          const end = chatInput.selectionEnd || 0;
          chatInput.value = chatInput.value.slice(0, start) + res.cleaned + chatInput.value.slice(end);
          chatInput.selectionStart = chatInput.selectionEnd = start + res.cleaned.length;
        }
      }
    });
  }

  // Clipboard Paste for Screenshots
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    }
  });

  function processImageFile(file) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const commaIdx = result.indexOf(',');
        const base64 = commaIdx !== -1 ? result.slice(commaIdx + 1) : result;
        attachedImageData = {
          mimeType: file.type || 'image/png',
          data: base64,
          name: file.name || 'Pasted Image'
        };
        if (imagePreviewImg) imagePreviewImg.src = result;
        if (imageFileName) imageFileName.textContent = file.name || 'Pasted screenshot';
        if (imagePreviewBar) imagePreviewBar.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  }

  function clearAttachedImage() {
    attachedImageData = null;
    if (imageFileInput) imageFileInput.value = '';
    if (imagePreviewBar) imagePreviewBar.classList.add('hidden');
  }

  // Input Auto-Resize & Send
  if (chatInput) {
    chatInput.addEventListener('input', autoResizeInput);

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      if (isGenerating) {
        if (activeAbortController) {
          activeAbortController.abort();
        }
      } else {
        handleSubmit();
      }
    });
  }

  function handleSubmit() {
    const text = chatInput.value.trim();
    if ((text || attachedImageData) && !isGenerating) {
      const promptToSend = text || 'Analyze this attached image.';
      sendMessage(promptToSend, attachedImageData);
      chatInput.value = '';
      clearAttachedImage();
      autoResizeInput();
    }
  }

  function autoResizeInput() {
    if (!chatInput) return;
    chatInput.style.height = 'auto';
    chatInput.style.height = `${Math.min(chatInput.scrollHeight, 100)}px`;
  }

  // Summarize Current Page Action
  async function handleSummarizePage() {
    if (isGenerating) return;

    if (window.chrome && chrome.tabs && chrome.scripting) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          throw new Error('No active browser tab found.');
        }

        // Execute text extraction on the page
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const title = document.title || '';
            const heading = document.querySelector('h1')?.innerText || '';
            const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
            
            // Extract body text while ignoring scripts & styles
            const clone = document.body.cloneNode(true);
            const removeTags = clone.querySelectorAll('script, style, noscript, nav, footer, svg, iframe');
            removeTags.forEach(el => el.remove());
            const rawText = clone.innerText || '';
            const cleaned = rawText.replace(/\s+/g, ' ').trim().slice(0, 4500);

            return { title, heading, metaDesc, content: cleaned };
          }
        });

        const pageData = results?.[0]?.result;
        if (pageData && pageData.content) {
          const userPrompt = `Please summarize this webpage ("${pageData.title || tab.title}"):\n\n**URL:** ${tab.url}\n**Overview:** ${pageData.metaDesc || pageData.heading || 'N/A'}\n\n**Page Content:**\n${pageData.content}\n\nProvide:\n1. Executive 1-Sentence Takeaway\n2. Key Highlights & Insights (bullet points)\n3. Core Action Items or Conclusions`;
          sendMessage(userPrompt);
          return;
        }
      } catch (err) {
        console.warn('Page extraction notice:', err);
      }
    }

    // Fallback if tabs permission is restricted or outside extension context
    sendMessage('Please provide a structured summary with key takeaways of the current browsing topic.');
  }

  // 4. Send Message & Stream
  async function sendMessage(userText, imageAttachment = null) {
    if (isGenerating) return;
    isGenerating = true;
    updateSendButtonState(true);

    const userMessageObj = {
      role: 'user',
      content: userText,
      image: imageAttachment ? { mimeType: imageAttachment.mimeType, data: imageAttachment.data } : undefined
    };

    messages.push(userMessageObj);
    appendMessageUI('user', userText, imageAttachment);

    // Create Assistant Element
    const assistantEl = appendMessageUI('assistant', '');
    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';
    contentDiv.innerHTML = '<span class="typing-placeholder" style="opacity: 0.6;">Thinking...</span>';
    assistantEl.appendChild(contentDiv);

    // Prepare System Instruction
    const systemInstruction = PERSONA_INSTRUCTIONS[currentPersona] || PERSONA_INSTRUCTIONS.general;

    activeAbortController = new AbortController();

    try {
      const endpoint = `${currentHost}/api/chat`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: activeAbortController.signal,
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            image: m.image
          })),
          systemInstruction: systemInstruction,
          enableSearch: enableSearch,
          temperature: currentTemperature,
          modelVersion: currentModelVersion,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let streamBuffer = '';
      let groundingMetadata = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
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
                renderAssistantMarkdown(contentDiv, accumulated);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
              if (parsed.grounding) {
                groundingMetadata = parsed.grounding;
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
        renderAssistantMarkdown(contentDiv, accumulated);

        // Render Grounding Sources if present
        if (groundingMetadata && groundingMetadata.groundingChunks) {
          renderGroundingSources(assistantEl, groundingMetadata.groundingChunks);
        }

        // Render Message Actions (Copy & Read Aloud)
        renderMessageActions(assistantEl, accumulated);
      } else {
        contentDiv.textContent = "No response generated. Please check backend API key status.";
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        contentDiv.innerHTML += '<p style="color: #9ca3af; font-size: 11px; margin-top: 6px;">[Generation stopped by user]</p>';
      } else {
        console.error('Bolex generation error:', err);
        contentDiv.innerHTML = `<div style="color: #f87171; font-size: 12px;"><strong>Connection Error:</strong> ${escapeHtml(err.message || 'Failed to reach Bolex API')}.<br><span style="color: #9ca3af; font-size: 11px;">Verify that the server host is active in Settings.</span></div>`;
        updateServerStatusBadge(false);
      }
    } finally {
      isGenerating = false;
      activeAbortController = null;
      updateSendButtonState(false);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function updateSendButtonState(generating) {
    if (!sendBtn || !sendIcon || !stopIcon) return;
    if (generating) {
      sendIcon.classList.add('hidden');
      stopIcon.classList.remove('hidden');
      sendBtn.classList.add('stopping');
      sendBtn.title = 'Stop generating';
    } else {
      stopIcon.classList.add('hidden');
      sendIcon.classList.remove('hidden');
      sendBtn.classList.remove('stopping');
      sendBtn.title = 'Send message';
    }
  }

  function appendMessageUI(role, text, imageObj = null) {
    const msgEl = document.createElement('div');
    msgEl.className = `message ${role}`;

    if (role === 'user') {
      if (imageObj && imageObj.data) {
        const img = document.createElement('img');
        img.className = 'msg-attached-img';
        img.src = `data:${imageObj.mimeType || 'image/png'};base64,${imageObj.data}`;
        img.alt = imageObj.name || 'Attachment';
        msgEl.appendChild(img);
      }
      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      msgEl.appendChild(textSpan);
    }

    messagesContainer.appendChild(msgEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return msgEl;
  }

  // Assistant Markdown Renderer
  function renderAssistantMarkdown(container, rawText) {
    container.innerHTML = parseMarkdownToHtml(rawText);

    // Attach Copy Handlers to Code Blocks
    container.querySelectorAll('.copy-code-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const codeText = btn.getAttribute('data-code') || '';
        navigator.clipboard.writeText(codeText).then(() => {
          btn.textContent = '✓ Copied!';
          setTimeout(() => {
            btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
          }, 2000);
        });
      });
    });
  }

  function parseMarkdownToHtml(text) {
    if (!text) return '';

    // 1. Code blocks with language detection
    let html = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang.trim() || 'code';
      const cleanCode = code.trim();
      const escapedCode = escapeHtml(cleanCode);
      const encodedCode = escapeAttribute(cleanCode);
      return `
        <div class="code-block">
          <div class="code-header">
            <span>${escapeHtml(language)}</span>
            <button class="copy-code-btn" data-code="${encodedCode}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy
            </button>
          </div>
          <pre><code>${escapedCode}</code></pre>
        </div>`;
    });

    // 2. Inline code
    html = html.replace(/`([^`]+)`/g, (match, code) => `<code>${escapeHtml(code)}</code>`);

    // 3. Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 4. Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 5. Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // 6. Bullet lists
    html = html.replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');

    // 7. Paragraphs
    const paragraphs = html.split(/\n\n+/).map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<div class="code-block"')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    });

    return paragraphs.join('');
  }

  function renderGroundingSources(assistantEl, chunks) {
    const existing = assistantEl.querySelector('.sources-container');
    if (existing) existing.remove();

    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'sources-container';
    sourcesDiv.innerHTML = `
      <div class="sources-label">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        <span>Live Sources</span>
      </div>
      <div class="sources-chips"></div>
    `;

    const chipsContainer = sourcesDiv.querySelector('.sources-chips');
    const validChunks = chunks.filter(c => c.web?.uri && c.web?.title).slice(0, 5);

    validChunks.forEach(c => {
      const a = document.createElement('a');
      a.className = 'source-chip';
      a.href = c.web.uri;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = `${c.web.title} (${c.web.uri})`;
      a.innerHTML = `<span>🔗</span> ${escapeHtml(c.web.title)}`;
      chipsContainer.appendChild(a);
    });

    if (validChunks.length > 0) {
      assistantEl.appendChild(sourcesDiv);
    }
  }

  function renderMessageActions(assistantEl, fullText) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'msg-actions';

    // Copy Button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-icon-btn';
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      <span>Copy</span>
    `;
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(fullText).then(() => {
        copyBtn.innerHTML = '<span>✓ Copied</span>';
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy</span>
          `;
        }, 2000);
      });
    });

    // Read Aloud (TTS) Button
    const ttsBtn = document.createElement('button');
    ttsBtn.className = 'action-icon-btn';
    ttsBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
      <span>Read</span>
    `;
    ttsBtn.addEventListener('click', () => {
      if (window.speechSynthesis) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          ttsBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <span>Read</span>
          `;
        } else {
          const cleanText = fullText.replace(/```[\s\S]*?```/g, 'Code block omitted.').replace(/[#*`_]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.rate = 1.05;
          utterance.onend = () => {
            ttsBtn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              <span>Read</span>
            `;
          };
          window.speechSynthesis.speak(utterance);
          ttsBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>
            <span>Stop</span>
          `;
        }
      }
    });

    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(ttsBtn);
    assistantEl.appendChild(actionsDiv);
  }

  // 5. Host & Settings Management
  async function initHostAndSettings() {
    return new Promise((resolve) => {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['bolex_host', 'bolex_search', 'bolex_persona', 'bolex_temp', 'bolex_model_version'], (res) => {
          if (res.bolex_host) currentHost = res.bolex_host;
          if (res.bolex_search !== undefined) enableSearch = Boolean(res.bolex_search);
          if (res.bolex_persona) currentPersona = res.bolex_persona;
          if (res.bolex_temp) currentTemperature = Number(res.bolex_temp);
          if (res.bolex_model_version) currentModelVersion = res.bolex_model_version;
          applySettingsToUI();
          resolve();
        });
      } else {
        const savedHost = localStorage.getItem('bolex_host');
        if (savedHost) currentHost = savedHost;
        const savedSearch = localStorage.getItem('bolex_search');
        if (savedSearch !== null) enableSearch = savedSearch === 'true';
        const savedPersona = localStorage.getItem('bolex_persona');
        if (savedPersona) currentPersona = savedPersona;
        const savedTemp = localStorage.getItem('bolex_temp');
        if (savedTemp) currentTemperature = Number(savedTemp);
        const savedModel = localStorage.getItem('bolex_model_version');
        if (savedModel) currentModelVersion = savedModel;
        applySettingsToUI();
        resolve();
      }
    });
  }

  function applySettingsToUI() {
    if (backendHostInput) backendHostInput.value = currentHost;
    if (openFullAppBtn) openFullAppBtn.href = currentHost;
    if (modelVersionSelect) modelVersionSelect.value = currentModelVersion;
    if (personaSelect) personaSelect.value = currentPersona;
    if (temperatureSlider) temperatureSlider.value = String(currentTemperature);
    if (tempValue) tempValue.textContent = currentTemperature.toFixed(1);
    updateSearchUI();
  }

  function saveSettings() {
    const payload = {
      bolex_host: currentHost,
      bolex_search: enableSearch,
      bolex_persona: currentPersona,
      bolex_temp: currentTemperature,
      bolex_model_version: currentModelVersion
    };

    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(payload);
    } else {
      localStorage.setItem('bolex_host', currentHost);
      localStorage.setItem('bolex_search', String(enableSearch));
      localStorage.setItem('bolex_persona', currentPersona);
      localStorage.setItem('bolex_temp', String(currentTemperature));
      localStorage.setItem('bolex_model_version', currentModelVersion);
    }
  }

  async function checkServerHealth() {
    updateServerStatusBadge(null); // Testing state
    try {
      const res = await fetch(`${currentHost}/api/health`, { method: 'GET' });
      if (res.ok) {
        updateServerStatusBadge(true);
      } else {
        updateServerStatusBadge(false);
      }
    } catch {
      updateServerStatusBadge(false);
    }
  }

  function updateServerStatusBadge(isOnline) {
    if (!serverStatus) return;
    serverStatus.className = 'status-badge';
    if (isOnline === true) {
      serverStatus.classList.add('connected');
      serverStatus.textContent = 'Connected';
    } else if (isOnline === false) {
      serverStatus.classList.add('error');
      serverStatus.textContent = 'Offline (Check Host)';
    } else {
      serverStatus.classList.add('testing');
      serverStatus.textContent = 'Connecting...';
    }
  }

  // 6. Check Pending Context Menu Triggers
  async function checkPendingContextMenu() {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['bolex_pending_action'], async (res) => {
        const action = res.bolex_pending_action;
        if (action && action.text) {
          // Check if trigger is recent (under 3 minutes)
          if (Date.now() - (action.timestamp || 0) < 180000) {
            await chrome.storage.local.remove('bolex_pending_action');
            if (action.type === 'summarize_page') {
              handleSummarizePage();
            } else {
              sendMessage(action.text);
            }
          }
        }
      });
    }
  }

  // 7. State Persistence
  function saveState() {
    const trimmed = messages.slice(-25);
    try {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ bolex_messages: trimmed });
      } else {
        localStorage.setItem('bolex_messages', JSON.stringify(trimmed));
      }
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  function loadSavedState() {
    return new Promise((resolve) => {
      try {
        if (window.chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['bolex_messages'], (res) => {
            if (res && Array.isArray(res.bolex_messages)) {
              restoreMessages(res.bolex_messages);
            }
            resolve();
          });
        } else {
          const raw = localStorage.getItem('bolex_messages');
          if (raw) {
            restoreMessages(JSON.parse(raw));
          }
          resolve();
        }
      } catch {
        resolve();
      }
    });
  }

  function restoreMessages(list) {
    if (!Array.isArray(list) || list.length === 0) return;
    messages = list;
    list.forEach((m) => {
      if (m.role === 'user') {
        appendMessageUI('user', m.content, m.image);
      } else {
        const assistantEl = appendMessageUI('assistant', '');
        const contentDiv = document.createElement('div');
        contentDiv.className = 'msg-content';
        assistantEl.appendChild(contentDiv);
        renderAssistantMarkdown(contentDiv, m.content);
        renderMessageActions(assistantEl, m.content);
      }
    });
  }

  // Helpers
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttribute(str) {
    if (!str) return '';
    return str
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
});
