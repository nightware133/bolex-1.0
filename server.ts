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
let searchGroundingExhaustedUntil = 0;

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

  // Cache last working model to skip unavailable models on subsequent requests
  let lastWorkingModel = "gemini-3.6-flash";

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
      for (const m of messages) {
        if (!m || typeof m !== "object") continue;
        const parts: any[] = [];

        if (m.image && m.image.data && typeof m.image.data === "string" && m.image.data.trim()) {
          parts.push({
            inlineData: {
              mimeType: m.image.mimeType || "image/png",
              data: m.image.data.replace(/^data:image\/[a-z]+;base64,/, ""),
            },
          });
        }

        if (typeof m.content === "string" && m.content.trim()) {
          parts.push({ text: m.content.trim() });
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

      // Prepare configuration
      const config: any = {
        temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
      };

      if (modelVersion === "bolex-o1" || modelVersion === "o1") {
        config.thinkingConfig = { thinkingBudget: 4096 };
      }

      const antiGreetingDirective = "ABSOLUTE MANDATORY SYSTEM RULE: NEVER start your response with 'Hello, I am Bolex', 'Hello! I'm Bolex', 'Hi, I am Bolex', 'I am Bolex', 'Greetings! I am Bolex', or any variation of introductory greeting. DO NOT introduce yourself or say hello under any circumstances unless the user explicitly asks 'who are you' or 'what is your name'. Jump DIRECTLY into answering the user request.";

      if (systemInstruction && typeof systemInstruction === "string" && systemInstruction.trim()) {
        config.systemInstruction = `${antiGreetingDirective}\n\n${systemInstruction.trim()}`;
      } else {
        config.systemInstruction = antiGreetingDirective;
      }

      let searchNoticeNeeded = false;
      if (enableSearch) {
        if (Date.now() < searchGroundingExhaustedUntil) {
          searchNoticeNeeded = true;
        } else {
          config.tools = [{ googleSearch: {} }];
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

      // Verified active models mapped to version selection
      const now = Date.now();
      let baseModels: string[] = [];

      if (modelVersion === "bolex-4.0" || modelVersion === "4.0") {
        baseModels = [
          "gemini-2.5-flash",
          "gemini-3.7-flash",
          "gemini-2.5-pro",
          "gemini-3.6-flash",
          "gemini-2.0-flash",
        ];
      } else if (modelVersion === "bolex-2.0" || modelVersion === "2.0") {
        baseModels = [
          "gemini-2.5-flash-lite",
          "gemini-2.5-flash",
          "gemini-2.0-flash",
        ];
      } else if (modelVersion === "bolex-o1" || modelVersion === "o1") {
        baseModels = [
          "gemini-2.5-pro",
          "gemini-3.7-flash",
          "gemini-2.5-flash",
        ];
      } else {
        // default: bolex-3.8 / bolex-turbo
        baseModels = [
          "gemini-2.5-flash",
          "gemini-3.7-flash",
          "gemini-3.6-flash",
          "gemini-2.0-flash",
        ];
      }

      let candidateModels = baseModels
        .filter((m) => {
          const cooldown = modelCooldowns.get(m) || 0;
          return now >= cooldown;
        })
        .filter((val, idx, arr) => arr.indexOf(val) === idx);

      if (candidateModels.length === 0) {
        modelCooldowns.clear();
        candidateModels = baseModels;
      }

      let groundingMetadata: any = null;
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
      const tryStreamWithConfig = async (activeConfig: any, isSearchRetry = false) => {
        for (const modelName of candidateModels) {
          if (clientDisconnected) return false;
          if (streamedAny) return true;

          let attemptDone = false;
          const attemptTimeout = setTimeout(() => {
            if (!attemptDone && !streamedAny) {
              console.warn(`Model ${modelName} attempt timed out at 30s`);
            }
          }, 30000);

          try {
            // Attempt 1: Streaming
            try {
              const stream = await ai.models.generateContentStream({
                model: modelName,
                contents,
                config: activeConfig,
              });

              for await (const chunk of stream) {
                attemptDone = true;
                clearTimeout(attemptTimeout);
                if (clientDisconnected) break;

                const text = chunk.text;
                const metadata = chunk.candidates?.[0]?.groundingMetadata;
                if (metadata) groundingMetadata = metadata;

                // Handle safety / policy block finish reason
                const finishReason = chunk.candidates?.[0]?.finishReason;
                if (finishReason === "SAFETY" || finishReason === "BLOCKLIST") {
                  const safetyMsg = "\n\n*[Response generation was stopped by safety policies. Please adjust prompt phrasing.]*";
                  res.write(`event: chunk\ndata: ${JSON.stringify({ text: safetyMsg })}\n\n`);
                  streamedAny = true;
                  break;
                }

                if (text) {
                  if ((isSearchRetry || searchNoticeNeeded) && !streamedAny) {
                    const notice = "> *Note: Web Search Grounding is temporarily at capacity. Responding via direct intelligence:*\n\n";
                    res.write(`event: chunk\ndata: ${JSON.stringify({ text: notice })}\n\n`);
                    searchNoticeNeeded = false;
                  }
                  streamedAny = true;
                  res.write(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`);
                }
              }
            } catch (streamErr: any) {
              attemptDone = true;
              if (streamedAny) throw streamErr;
            }

            // Attempt 2: Direct generateContent if stream did not produce any tokens
            if (!streamedAny && !clientDisconnected) {
              const directRes = await ai.models.generateContent({
                model: modelName,
                contents,
                config: activeConfig,
              });
              attemptDone = true;
              const text = directRes.text;
              const metadata = directRes.candidates?.[0]?.groundingMetadata;
              if (metadata) groundingMetadata = metadata;
              if (text) {
                if ((isSearchRetry || searchNoticeNeeded) && !streamedAny) {
                  const notice = "> *Note: Web Search Grounding is temporarily at capacity. Responding via direct intelligence:*\n\n";
                  res.write(`event: chunk\ndata: ${JSON.stringify({ text: notice })}\n\n`);
                  searchNoticeNeeded = false;
                }
                streamedAny = true;
                res.write(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`);
              }
            }

            clearTimeout(attemptTimeout);
            if (streamedAny) {
              lastWorkingModel = modelName;
              return true;
            }
          } catch (err: any) {
            clearTimeout(attemptTimeout);
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

            // Extract dynamic retry delay if provided
            let cooldownMs = 30_000;
            const delayMatch = errMsg.match(/retry in ([0-9.]+)s/i) || errMsg.match(/retrydelay[":\s]+([0-9]+)s/i);
            if (delayMatch && delayMatch[1]) {
              cooldownMs = Math.ceil(parseFloat(delayMatch[1]) * 1000) + 1000;
            }

            if (isQuotaError) {
              modelCooldowns.set(modelName, Date.now() + cooldownMs);
            }

            // If Google Search tool quota exhausted, trigger fallback without search
            if (activeConfig.tools && (isQuotaError || is503HighDemand)) {
              if (isQuotaError) {
                searchGroundingExhaustedUntil = Date.now() + 60_000;
              }
              return false;
            }

            // Brief pause before trying next candidate model
            await new Promise((r) => setTimeout(r, 200));
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
        success = await tryStreamWithConfig(configWithoutSearch, true);
      }

      // If failed while thinkingConfig was enabled, retry without thinkingConfig
      if (!success && !streamedAny && config.thinkingConfig) {
        const configWithoutThinking = { ...config };
        delete configWithoutThinking.thinkingConfig;
        delete configWithoutThinking.tools;
        success = await tryStreamWithConfig(configWithoutThinking, true);
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

      const candidateModels = [
        lastWorkingModel,
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash",
      ].filter((m) => (modelCooldowns.get(m) || 0) <= Date.now())
       .filter((val, idx, arr) => arr.indexOf(val) === idx);

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

      const candidateModels = [
        lastWorkingModel,
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash",
      ].filter((m) => (modelCooldowns.get(m) || 0) <= Date.now())
       .filter((val, idx, arr) => arr.indexOf(val) === idx);

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

      const candidateModels = [
        lastWorkingModel,
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash",
      ].filter((m) => (modelCooldowns.get(m) || 0) <= Date.now())
       .filter((val, idx, arr) => arr.indexOf(val) === idx);

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

      const candidateModels = [
        lastWorkingModel,
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash",
      ].filter((m) => (modelCooldowns.get(m) || 0) <= Date.now())
       .filter((val, idx, arr) => arr.indexOf(val) === idx);

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
