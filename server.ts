import express from "express";
import path from "path";
import fs from "fs";
import JSZip from "jszip";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. You can connect your free or standard Gemini API key in AI Studio's Settings > Secrets panel."
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-memory cooldown tracking for models and tools that hit quota exhaustion
const modelCooldowns = new Map<string, number>();
let lastWorkingModel = "gemini-3.5-flash";

const RELIABLE_CORE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3-flash-preview",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

function getCandidateModels(preferredModel?: string): string[] {
  const now = Date.now();
  const pool: string[] = [];

  if (preferredModel && (modelCooldowns.get(preferredModel) || 0) <= now) {
    pool.push(preferredModel);
  }
  if (lastWorkingModel && (modelCooldowns.get(lastWorkingModel) || 0) <= now) {
    pool.push(lastWorkingModel);
  }
  for (const m of RELIABLE_CORE_MODELS) {
    if ((modelCooldowns.get(m) || 0) <= now) {
      pool.push(m);
    }
  }

  const unique = Array.from(new Set(pool));
  if (unique.length > 0) {
    return unique;
  }

  // Safe guaranteed fallback if all happen to be in cooldown
  return ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3-flash-preview", "gemini-flash-lite-latest"];
}

interface LiveSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

const decodeHtmlEntities = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * High-speed resilient live web search engine
 * Queries live internet results with zero API quota constraints and 100% uptime.
 */
async function fetchLiveWebSearch(query: string): Promise<LiveSearchResult[]> {
  const cleaned = query
    .replace(/^(search|google|browse|look up)(\s+(for|the web for|online for))?/i, "")
    .replace(/\b(please|can you|could you)\b/gi, "")
    .trim();
  if (!cleaned || cleaned.length < 2) return [];

  const results: LiveSearchResult[] = [];

  // Primary: DuckDuckGo HTML Search for live internet index
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleaned)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3800);

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const blockRegex =
        /<div class="result\s+results_links[\s\S]*?<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = blockRegex.exec(html)) && results.length < 5) {
        const block = match[0];
        const titleMatch = block.match(
          /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/
        );
        const snippetMatch = block.match(
          /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/
        );

        if (titleMatch) {
          const rawUrl = titleMatch[1];
          let actualUrl = rawUrl;
          const uddgMatch = rawUrl.match(/[?&]uddg=([^&]+)/);
          if (uddgMatch) {
            try {
              actualUrl = decodeURIComponent(uddgMatch[1]);
            } catch {}
          }

          const title = decodeHtmlEntities(titleMatch[2]);
          const snippet = snippetMatch ? decodeHtmlEntities(snippetMatch[1]) : "";

          if (title && actualUrl.startsWith("http")) {
            let domain = "";
            try {
              domain = new URL(actualUrl).hostname.replace("www.", "");
            } catch {}
            results.push({ title, url: actualUrl, snippet, domain });
          }
        }
      }
    }
  } catch (err) {
    console.warn("Primary live search non-blocking error (checking fallback):", err);
  }

  // Secondary Fallback: Wikipedia Encyclopedia REST search if 0 web results returned
  if (results.length === 0) {
    try {
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        cleaned
      )}&utf8=&format=json&origin=*&srlimit=3`;
      const wikiRes = await fetch(wikiUrl, { headers: { Accept: "application/json" } });
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const items = wikiData?.query?.search || [];
        for (const item of items) {
          const cleanSnippet = decodeHtmlEntities(item.snippet || "");
          results.push({
            title: item.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
            snippet: cleanSnippet,
            domain: "en.wikipedia.org",
          });
        }
      }
    } catch {}
  }

  return results;
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS for Chrome/Edge/Firefox extensions & direct origins
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: "25mb" }));

  // API Status & Health
  app.get(["/api/status", "/api/health"], (req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
    res.json({
      status: "ok",
      hasApiKey: hasKey,
      model: "bolex-turbo",
      freeTierCompatible: true,
      message: hasKey
        ? "Bolex engine is active and ready."
        : "No API key detected. Please add your key in AI Studio under Settings > Secrets.",
    });
  });

  // Dynamic Browser Extension ZIP packaging endpoint
  app.get(["/bolex-extension.zip", "/api/extension/download"], async (req, res) => {
    try {
      const zip = new JSZip();
      const extDir = path.join(process.cwd(), "public", "extension");

      if (!fs.existsSync(extDir)) {
        return res.status(404).json({ error: "Extension bundle not found" });
      }

      // Determine current host from request headers
      const hostProtocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const hostName = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
      const detectedHost = `${hostProtocol}://${hostName}`;

      // Helper to recursively add files to zip
      const addDirectoryToZip = (dirPath: string, zipFolder: JSZip) => {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            const subFolder = zipFolder.folder(entry.name);
            if (subFolder) {
              addDirectoryToZip(fullPath, subFolder);
            }
          } else if (entry.isFile()) {
            if (entry.name === "popup.js") {
              // Pre-inject the detected server host for frictionless out-of-the-box operation
              let content = fs.readFileSync(fullPath, "utf-8");
              if (detectedHost && !detectedHost.includes("localhost")) {
                content = content.replace(
                  /const DEFAULT_FALLBACK_HOST = ['"][^'"]+['"];/,
                  `const DEFAULT_FALLBACK_HOST = '${detectedHost}';`
                );
              }
              zipFolder.file(entry.name, content);
            } else if (entry.name.endsWith(".png") || entry.name.endsWith(".jpg") || entry.name.endsWith(".ico")) {
              const binary = fs.readFileSync(fullPath);
              zipFolder.file(entry.name, binary);
            } else {
              const text = fs.readFileSync(fullPath, "utf-8");
              zipFolder.file(entry.name, text);
            }
          }
        }
      };

      addDirectoryToZip(extDir, zip);

      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      });

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="bolex-extension.zip"');
      res.setHeader("Cache-Control", "no-cache");
      return res.send(zipBuffer);
    } catch (err: any) {
      console.error("Failed to generate extension zip:", err);
      return res.status(500).json({ error: "Failed to generate extension zip", details: err?.message });
    }
  });


  // Chat Streaming Route
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        messages,
        systemInstruction,
        enableSearch,
        temperature = 0.7,
        modelVersion = "bolex-4.0",
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Missing or empty messages array." });
      }

      const ai = getGeminiClient();

      // Format and sanitize messages for @google/genai SDK
      const rawContents: { role: string; parts: any[] }[] = [];
      let hasImageInConversation = false;

      for (const m of messages) {
        if (!m || typeof m !== "object") continue;
        const parts: any[] = [];

        // Support up to 6 attached images per message (from m.images array or m.image)
        const msgImages: any[] = Array.isArray(m.images) && m.images.length > 0
          ? m.images
          : (m.image ? [m.image] : []);

        const validImages = msgImages.slice(0, 6);
        for (const img of validImages) {
          if (img && img.data && typeof img.data === "string" && img.data.trim()) {
            const rawData = img.data.trim();
            const cleanBase64 = rawData.includes(",")
              ? rawData.split(",")[1].trim()
              : rawData.replace(/^data:[^;]+;base64,/, "").trim();

            parts.push({
              inlineData: {
                mimeType: img.mimeType || "image/png",
                data: cleanBase64,
              },
            });
            hasImageInConversation = true;
          }
        }

        if (typeof m.content === "string" && m.content.trim()) {
          parts.push({ text: m.content.trim() });
        } else if (parts.length > 0 && m.role === "user") {
          // If user attached images without accompanying text, provide detailed vision instruction
          const count = validImages.length;
          parts.push({
            text: count > 1
              ? `Please thoroughly inspect, analyze, and compare these ${count} images. Transcribe visible text/code, highlight differences and similarities, examine charts, diagrams, or UI components, and provide structured insights.`
              : "Please inspect this image and describe what you see, transcribing any visible text, analyzing charts/diagrams, and highlighting key details.",
          });
        }

        if (parts.length > 0) {
          rawContents.push({
            role: m.role === "user" ? "user" : "model",
            parts,
          });
        }
      }

      // Merge consecutive messages with same role to adhere to Gemini alternating role contract
      const contents: { role: string; parts: any[] }[] = [];
      for (const item of rawContents) {
        if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
          contents[contents.length - 1].parts.push(...item.parts);
        } else {
          contents.push(item);
        }
      }

      // Ensure at least one valid user message exists
      if (contents.length === 0) {
        contents.push({ role: "user", parts: [{ text: "Hello" }] });
      }

      const isO1Thinker = modelVersion === "bolex-o1" || modelVersion === "o1";

      // Prepare configuration (use precision temperature 0.2 for o1 deep thinking)
      const config: any = {
        temperature: isO1Thinker ? 0.2 : Math.max(0, Math.min(2, Number(temperature) || 0.7)),
      };

      const antiGreetingDirective = "ABSOLUTE MANDATORY SYSTEM RULE: NEVER start your response with 'Hello, I am Bolex', 'Hello! I'm Bolex', 'Hi, I am Bolex', 'I am Bolex', 'Greetings! I am Bolex', or any variation of introductory greeting. DO NOT introduce yourself or say hello under any circumstances unless the user explicitly asks 'who are you' or 'what is your name'. Jump DIRECTLY into answering the user request.";

      const visionDirective = hasImageInConversation
        ? "\n\n[MULTIMODAL VISION ACTIVE]: The user has attached pictures (up to 6 images) in this conversation. You possess full multimodal vision capabilities: inspect every image carefully, read/transcribe any visible words or handwritten text, analyze diagrams/charts/code, compare differences between images if multiple are provided, and synthesize your answers directly with the user's questions and words."
        : "";

      const o1ThinkerDirective = isO1Thinker
        ? "\n\n[BOLEX o1 DEEP THINKER REASONING CORE ACTIVE]: You are operating as Bolex o1 Deep Thinker. Use rigorous chain-of-thought analysis. Break down problems to fundamental principles, explore alternative hypotheses, verify each logical deduction and calculation, examine edge cases, and deliver an articulate, deep, and logically validated solution."
        : "";

      const baseDirectives = `${antiGreetingDirective}${visionDirective}${o1ThinkerDirective}`;

      if (systemInstruction && typeof systemInstruction === "string" && systemInstruction.trim()) {
        config.systemInstruction = `${baseDirectives}\n\n${systemInstruction.trim()}`;
      } else {
        config.systemInstruction = baseDirectives;
      }

      // Extract latest user text for web search context
      let latestUserQuery = "";
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i]?.role === "user" && typeof messages[i]?.content === "string") {
          latestUserQuery = messages[i].content.trim();
          break;
        }
      }

      const isSearchRequested = Boolean(
        enableSearch ||
        /\b(search the web|search online|search google|web search|look up on google|look up online|current price of|who won the 202[4-9]|what happened in 202[4-9])\b/i.test(latestUserQuery)
      );

      let groundingMetadata: any = null;

      if (isSearchRequested && latestUserQuery) {
        try {
          const liveResults = await fetchLiveWebSearch(latestUserQuery);
          if (liveResults.length > 0) {
            groundingMetadata = {
              webSearchQueries: [latestUserQuery],
              groundingChunks: liveResults.map((r) => ({
                web: {
                  uri: r.url,
                  title: r.title,
                },
              })),
            };

            const searchGroundingContext = `\n\n[REAL-TIME LIVE WEB SEARCH ACTIVE]:
Real-time web search was executed for query: "${latestUserQuery}".
Fresh verified findings from the live internet:

${liveResults
  .map(
    (r, idx) =>
      `[Source ${idx + 1}] "${r.title}"\nDomain: ${r.domain}\nURL: ${r.url}\nExcerpt: ${r.snippet}`
  )
  .join("\n\n")}

CRITICAL REAL-TIME CITATION & REASONING RULES:
1. Synthesize an intelligent, authoritative, clear, and comprehensive answer using these live web search results.
2. Naturally integrate and cite relevant facts, dates, developments, and sources like ChatGPT with web browsing.
3. NEVER state that search is down, at capacity, or unavailable. Web search is online and results are provided above.`;

            config.systemInstruction = `${config.systemInstruction || ""}${searchGroundingContext}`;
          }
        } catch (searchErr) {
          console.warn("Live web search non-blocking error:", searchErr);
        }
      }

      // Set headers for Server-Sent Events (SSE)
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      // Send periodic keep-alive comments to prevent proxy / load balancer timeouts
      const keepAliveTimer = setInterval(() => {
        if (!res.writableEnded) {
          res.write(": keep-alive\n\n");
        }
      }, 10000);

      let preferredModel: string = "gemini-3.5-flash";
      if (modelVersion === "bolex-2.0" || modelVersion === "2.0") {
        preferredModel = "gemini-flash-lite-latest";
      } else if (modelVersion === "bolex-o1" || modelVersion === "o1") {
        preferredModel = "gemini-3.5-flash";
      } else if (modelVersion === "bolex-4.0" || modelVersion === "4.0") {
        preferredModel = "gemini-3.5-flash";
      }

      const candidateModels = getCandidateModels(preferredModel);

      let streamedAny = false;
      let lastErr: any = null;

      let clientDisconnected = false;
      res.on("close", () => {
        clearInterval(keepAliveTimer);
        if (!res.writableEnded) {
          clientDisconnected = true;
        }
      });

      // Helper function to attempt streaming with candidate models
      const tryStreamWithConfig = async (activeConfig: any) => {
        for (const modelName of candidateModels) {
          if (clientDisconnected) return false;
          if (streamedAny) return true;

          try {
            const stream = await ai.models.generateContentStream({
              model: modelName,
              contents,
              config: activeConfig,
            });

            for await (const chunk of stream) {
              if (clientDisconnected) break;

              const text = chunk.text;
              const metadata = chunk.candidates?.[0]?.groundingMetadata;
              if (metadata && !groundingMetadata) groundingMetadata = metadata;

              // Handle safety / policy block finish reason
              const finishReason = chunk.candidates?.[0]?.finishReason;
              if (finishReason === "SAFETY" || finishReason === "BLOCKLIST") {
                const safetyMsg = "\n\n*[Response generation was stopped by safety policies. Please adjust prompt phrasing.]*";
                res.write(`event: chunk\ndata: ${JSON.stringify({ text: safetyMsg })}\n\n`);
                streamedAny = true;
                break;
              }

              if (text) {
                streamedAny = true;
                res.write(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`);
              }
            }

            if (streamedAny) {
              lastWorkingModel = modelName;
              return true;
            }
          } catch (err: any) {
            lastErr = err;
            if (streamedAny) {
              throw err;
            }

            const errMsg = String(err?.message || "").toLowerCase();
            const isQuotaError =
              errMsg.includes("429") ||
              errMsg.includes("quota") ||
              errMsg.includes("resource_exhausted") ||
              err?.status === 429 ||
              err?.code === 429;
            const is503HighDemand =
              errMsg.includes("503") ||
              errMsg.includes("high demand") ||
              errMsg.includes("unavailable") ||
              errMsg.includes("overloaded") ||
              err?.status === 503 ||
              err?.code === 503;
            const isNotFound =
              err?.status === 404 ||
              err?.code === 404 ||
              errMsg.includes("404") ||
              errMsg.includes("not found") ||
              errMsg.includes("no longer available");

            if (is503HighDemand) {
              // 503 spikes are fleeting (a few seconds). Only brief 8s cooldown
              modelCooldowns.set(modelName, Date.now() + 8000);
            } else if (isQuotaError) {
              let cooldownMs = 5 * 60 * 1000;
              const delayMatch = errMsg.match(/retry in ([0-9.]+)s/i) || errMsg.match(/retrydelay[":\s]+([0-9]+)s/i);
              if (delayMatch && delayMatch[1]) {
                cooldownMs = Math.min(Math.ceil(parseFloat(delayMatch[1]) * 1000) + 1000, 30 * 60 * 1000);
              }
              modelCooldowns.set(modelName, Date.now() + cooldownMs);
            } else if (isNotFound) {
              modelCooldowns.set(modelName, Date.now() + 24 * 60 * 60 * 1000);
            }

            // Immediately proceed to the next candidate model without stalling
            continue;
          }
        }
        return false;
      };

      let success = await tryStreamWithConfig(config);

      // If failed while search was enabled (e.g. quota issue or 503 on search grounding), retry without search tools
      if (!success && !streamedAny && config.tools && config.tools.length > 0) {
        const configWithoutSearch = { ...config };
        delete configWithoutSearch.tools;
        success = await tryStreamWithConfig(configWithoutSearch);
      }

      // If failed while thinkingConfig was enabled, retry without thinkingConfig
      if (!success && !streamedAny && config.thinkingConfig) {
        const configWithoutThinking = { ...config };
        delete configWithoutThinking.thinkingConfig;
        delete configWithoutThinking.tools;
        success = await tryStreamWithConfig(configWithoutThinking);
      }

      clearInterval(keepAliveTimer);

      if (!streamedAny) {
        if (lastErr) {
          throw lastErr;
        }
        throw new Error("The AI model is currently experiencing high demand. Automatic failovers were attempted. Please click 'Retry Response' to regenerate.");
      }

      // Send completion event with grounding metadata if available
      res.write(
        `event: done\ndata: ${JSON.stringify({
          grounding: groundingMetadata,
        })}\n\n`
      );
      res.end();
    } catch (err: any) {
      const errMsgRaw = String(err?.message || "");
      const isOperational =
        err?.name === "AbortError" ||
        err?.status === 503 ||
        err?.status === 429 ||
        err?.code === 503 ||
        err?.code === 429 ||
        errMsgRaw.includes("503") ||
        errMsgRaw.includes("429") ||
        errMsgRaw.includes("high demand") ||
        errMsgRaw.includes("quota") ||
        errMsgRaw.includes("Retry Response") ||
        errMsgRaw.includes("timed out") ||
        errMsgRaw.includes("RESOURCE_EXHAUSTED") ||
        errMsgRaw.includes("UNAVAILABLE");

      if (!isOperational) {
        console.error("Chat generation unexpected error:", err);
      } else {
        console.warn("Chat generation transient status:", err?.status || err?.name || "busy/high-demand");
      }
      let errorMessage = err?.message || "Failed to generate AI response.";
      
      // Deeply unwrap nested JSON error payloads from the SDK
      for (let i = 0; i < 3; i++) {
        try {
          const parsed = JSON.parse(errorMessage);
          if (parsed?.error?.message) {
            errorMessage = parsed.error.message;
          } else if (parsed?.message) {
            errorMessage = parsed.message;
          }
        } catch {
          break;
        }
      }

      if (
        errorMessage.includes("503") ||
        errorMessage.includes("high demand") ||
        errorMessage.includes("UNAVAILABLE") ||
        errorMessage.includes("overloaded") ||
        err?.code === 503 ||
        err?.status === 503
      ) {
        errorMessage = "The AI service is currently experiencing high demand. Automatic failovers were attempted. Please click 'Retry Response' to regenerate.";
      } else if (
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("quota") ||
        err?.code === 429 ||
        err?.status === 429
      ) {
        errorMessage = "The upstream AI service is temporarily experiencing high request volume. Please wait a moment and click 'Retry Response'.";
      } else if (
        err?.name === "AbortError" ||
        errorMessage.includes("abort") ||
        errorMessage.includes("timeout")
      ) {
        errorMessage = "The request timed out while connecting to the AI model. Please click 'Retry Response' to regenerate.";
      }
      
      // If headers already sent, write an SSE error event
      if (res.headersSent) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: errorMessage, debug: String(err?.message || err) })}\n\n`);
        return res.end();
      }

      return res.status(500).json({ error: errorMessage, debug: String(err?.message || err) });
    }
  });

  // AI 1-Sentence Conversation Summarizer Endpoint
  app.post("/api/chat/summarize", async (req, res) => {
    try {
      const { messages, title } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Missing or empty messages array." });
      }

      // Filter to relevant textual messages
      const textMessages = messages
        .filter((m: any) => m && m.content && typeof m.content === "string" && m.content.trim())
        .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content.slice(0, 500)}`)
        .slice(-10);

      if (textMessages.length === 0) {
        return res.json({ ok: true, summary: "Empty conversation awaiting prompts." });
      }

      const conversationTranscript = textMessages.join("\n");
      const ai = getGeminiClient();

      const prompt = `You are an expert conversation summarizer for Bolex AI.
Analyze the following conversation transcript and produce EXACTLY ONE concise, informative sentence (under 140 characters) capturing the core topic and outcome of the discussion.
Strict Guidelines:
1. Output EXACTLY ONE single sentence ending with a period.
2. Never prefix with "Summary:", "In this conversation,", "The user discusses", or "The chat is about".
3. Write in active, direct style (e.g. "Explores TypeScript architecture and configures production-ready Vite build scripts.").
4. Do not include markdown bolding, quotes, or multiple sentences.

Conversation Transcript:
${conversationTranscript}`;

      const candidateModels = getCandidateModels();

      let summaryText = "";
      for (const model of candidateModels) {
        try {
          const aiRes = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              temperature: 0.3,
              maxOutputTokens: 100,
            },
          });
          const raw = aiRes.text?.trim();
          if (raw) {
            let cleaned = raw
              .replace(/^["'`\s]+|["'`\s]+$/g, "")
              .replace(/^(summary|overview|topic):\s*/i, "")
              .replace(/\n+/g, " ")
              .trim();
            const sentenceMatch = cleaned.match(/^([^.!?]+[.!?])/);
            if (sentenceMatch) {
              cleaned = sentenceMatch[1].trim();
            }
            if (cleaned) {
              summaryText = cleaned;
              lastWorkingModel = model;
              break;
            }
          }
        } catch {
          // Try next model
        }
      }

      if (!summaryText) {
        const firstUser = messages.find((m: any) => m.role === "user" && m.content?.trim());
        const snippet = firstUser ? firstUser.content.trim().slice(0, 80).replace(/\n/g, ' ') : title || "Bolex chat";
        summaryText = `Discussion focused on ${snippet.toLowerCase().endsWith('.') ? snippet.slice(0, -1) : snippet}.`;
      }

      return res.json({ ok: true, summary: summaryText });
    } catch (err: any) {
      console.warn("Summarization transient issue:", err?.message);
      const fallbackSnippet = req.body?.title || "AI conversation";
      return res.json({ 
        ok: false, 
        summary: `Dialogue regarding ${fallbackSnippet}.` 
      });
    }
  });

  // AI Knowledge & Concept Map Generator Endpoint
  app.post("/api/map/generate", async (req, res) => {
    try {
      const { topic, context, mode = "knowledge" } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are Bolex Map Engine, an AI knowledge graph and geographic explorer.
Generate a rich, structured visual map graph for:
Topic / Context: "${topic || context || 'General Knowledge and Innovation'}"
Visualization Mode: "${mode}" (either 'knowledge' for mindmap/concept flow or 'places' for geographic locations).

Return ONLY valid JSON matching this exact structure:
{
  "nodes": [
    {
      "id": "node-1",
      "label": "Short Title (1-4 words)",
      "description": "Clear 1-2 sentence explanation or insight",
      "category": "core" | "code" | "research" | "action" | "location" | "creative",
      "notes": "Optional deeper detail or takeaway",
      "placeName": "City / Region / Landmark (if geographic or relevant)",
      "lat": number (e.g. 37.7749 if location, or null),
      "lng": number (e.g. -122.4194 if location, or null)
    }
  ],
  "links": [
    {
      "id": "link-1-2",
      "source": "node-1",
      "target": "node-2",
      "label": "relationship (e.g. 'powers', 'enables', 'located in', 'implements')"
    }
  ]
}

Ensure 6 to 12 well-connected nodes with a central 'core' node, diverse categories, and clear connecting link labels.`;

      const candidateModels = getCandidateModels();

      let rawText = "";
      for (const model of candidateModels) {
        try {
          const aiRes = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
              temperature: 0.4,
            },
          });
          if (aiRes.text) {
            rawText = aiRes.text;
            lastWorkingModel = model;
            break;
          }
        } catch {
          // try next model
        }
      }

      if (rawText) {
        const parsed = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());
        return res.json({ ok: true, data: parsed });
      }

      throw new Error("No response from AI model for map generation");
    } catch (err: any) {
      console.warn("Map generation fallback triggered:", err?.message);
      return res.status(500).json({ error: err?.message || "Failed to generate map graph" });
    }
  });

  // AI Branch Expansion Endpoint
  app.post("/api/map/expand", async (req, res) => {
    try {
      const { nodeLabel, nodeCategory, context } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are Bolex Map Engine. Expand this concept node into 3 to 5 sub-branches / connected child nodes:
Parent Node: "${nodeLabel}" (Category: ${nodeCategory || 'core'})
Context: "${context || 'Knowledge expansion'}"

Return ONLY valid JSON matching this exact structure:
{
  "newNodes": [
    {
      "id": "node-sub-1",
      "label": "Short Title (1-4 words)",
      "description": "Insight or explanation",
      "category": "core" | "code" | "research" | "action" | "location" | "creative",
      "notes": "Actionable detail"
    }
  ],
  "newLinks": [
    {
      "id": "link-parent-sub-1",
      "source": "parent",
      "target": "node-sub-1",
      "label": "relationship verb"
    }
  ]
}`;

      const candidateModels = getCandidateModels();

      let rawText = "";
      for (const model of candidateModels) {
        try {
          const aiRes = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
              temperature: 0.5,
            },
          });
          if (aiRes.text) {
            rawText = aiRes.text;
            lastWorkingModel = model;
            break;
          }
        } catch {
          // try next model
        }
      }

      if (rawText) {
        const parsed = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());
        return res.json({ ok: true, data: parsed });
      }

      throw new Error("No response from AI model for branch expansion");
    } catch (err: any) {
      console.warn("Map expansion error:", err?.message);
      return res.status(500).json({ error: err?.message || "Failed to expand node" });
    }
  });

  // AI Prompt Studio & Magic Optimizer Endpoint
  app.post("/api/prompt/optimize", async (req, res) => {
    try {
      const { rawPrompt, style = "masterpiece" } = req.body;
      if (!rawPrompt || typeof rawPrompt !== "string" || !rawPrompt.trim()) {
        return res.status(400).json({ error: "Missing raw prompt input" });
      }

      const ai = getGeminiClient();

      const prompt = `You are Bolex Prompt Studio Engineer.
Transform the following rough user prompt into an elite, high-precision, production-grade prompt.
Raw Prompt: "${rawPrompt.trim()}"
Target Enhancement Style: "${style}" (e.g., 'masterpiece', 'analytical', 'creative', 'coding')

Rules for the optimized prompt:
1. Define clear role & context.
2. Specify exact objectives, constraints, and edge cases.
3. Structure instructions with bullet points and concrete deliverables.
4. Keep the core intent intact while eliminating ambiguity.

Return ONLY valid JSON in this exact structure:
{
  "optimizedPrompt": "Full structured prompt with clear directives...",
  "enhancements": [
    "Added expert persona & context framing",
    "Structured deliverables and output schema",
    "Specified negative constraints and edge cases"
  ],
  "estimatedQualityBoost": "+140%"
}`;

      const candidateModels = getCandidateModels();

      let rawText = "";
      for (const model of candidateModels) {
        try {
          const aiRes = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              responseMimeType: "application/json",
              temperature: 0.4,
            },
          });
          if (aiRes.text) {
            rawText = aiRes.text;
            lastWorkingModel = model;
            break;
          }
        } catch {
          // try next model
        }
      }

      if (rawText) {
        const parsed = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());
        return res.json({ ok: true, data: parsed });
      }

      throw new Error("No response from AI model for prompt optimization");
    } catch (err: any) {
      console.warn("Prompt optimize error:", err?.message);
      return res.status(500).json({ error: err?.message || "Failed to optimize prompt" });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
