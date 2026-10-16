// Bolex AI Extension - Content Script Anti-Copy Interceptor & Protection
// Preserves raw selected text and neutralizes anti-cheating copy overrides (e.g. Edgenuity, Canvas, Khan Academy)

(function () {
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

  function cleanText(text) {
    if (!text) return '';
    let result = text;
    for (const pattern of ANTI_COPY_PATTERNS) {
      result = result.replace(pattern, '');
    }
    return result.trim();
  }

  // Intercept copy event at document capture phase before site scripts mutate selection
  window.addEventListener(
    'copy',
    function (e) {
      try {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const rawSelectedText = selection.toString();
        if (!rawSelectedText || !rawSelectedText.trim()) return;

        const cleaned = cleanText(rawSelectedText);

        if (e.clipboardData) {
          e.stopPropagation();
          e.preventDefault();
          e.clipboardData.setData('text/plain', cleaned || rawSelectedText);
        }
      } catch (err) {
        // Fallback gracefully
      }
    },
    true
  );
})();
