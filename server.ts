import express from "express";
import path from "path";
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API Status & Health
  app.get("/api/status", (req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
    res.json({
      status: "ok",
      hasApiKey: hasKey,
      model: "gemini-3.8-flash",
      freeTierCompatible: true,
      message: hasKey
        ? "AI engine is active with Gemini 3.8 Flash (Free Tier Compatible)."
        : "No API key detected. Please add your key in AI Studio under Settings > Secrets.",
    });
  });

  // Chat Streaming Route
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        messages,
        systemInstruction,
        enableSearch,
        temperature = 0.7,
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Missing or empty messages array." });
      }

      const ai = getGeminiClient();

      // Format messages for @google/genai
      const contents = messages.map((m: { role: string; content: string; image?: { mimeType: string; data: string } }) => {
        const parts: any[] = [];

        if (m.image && m.image.data) {
          parts.push({
            inlineData: {
              mimeType: m.image.mimeType || "image/png",
              data: m.image.data,
            },
          });
        }

        if (m.content) {
          parts.push({ text: m.content });
        }

        return {
          role: m.role === "user" ? "user" : "model",
          parts: parts.length > 0 ? parts : [{ text: "" }],
        };
      });

      // Prepare configuration
      const config: any = {
        temperature: Math.max(0, Math.min(2, Number(temperature) || 0.7)),
      };

      if (systemInstruction && typeof systemInstruction === "string" && systemInstruction.trim()) {
        config.systemInstruction = systemInstruction.trim();
      }

      if (enableSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      // Set headers for Server-Sent Events (SSE)
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];
      let groundingMetadata: any = null;
      let streamedAny = false;
      let lastErr: any = null;

      // Helper function to attempt streaming with candidate models
      const tryStreamWithConfig = async (activeConfig: any, isSearchRetry = false) => {
        for (const modelName of candidateModels) {
          try {
            const stream = await ai.models.generateContentStream({
              model: modelName,
              contents,
              config: activeConfig,
            });

            if (isSearchRetry && !streamedAny) {
              const notice = "> *Web Search Grounding requires a paid search tier quota. Falling back to direct model intelligence:*\n\n";
              res.write(`event: chunk\ndata: ${JSON.stringify({ text: notice })}\n\n`);
            }

            for await (const chunk of stream) {
              const text = chunk.text;
              const metadata = chunk.candidates?.[0]?.groundingMetadata;
              if (metadata) groundingMetadata = metadata;
              if (text) {
                streamedAny = true;
                res.write(`event: chunk\ndata: ${JSON.stringify({ text })}\n\n`);
              }
            }

            // Successfully finished stream
            return true;
          } catch (err: any) {
            console.warn(`Model ${modelName} error during stream:`, err?.message || err);
            lastErr = err;
            if (!streamedAny) {
              continue;
            }
            throw err;
          }
        }
        return false;
      };

      let success = await tryStreamWithConfig(config);

      // If failed while search was enabled (e.g. quota issue on free tier keys), retry without search tools
      if (!success && !streamedAny && config.tools && config.tools.length > 0) {
        const configWithoutSearch = { ...config };
        delete configWithoutSearch.tools;
        success = await tryStreamWithConfig(configWithoutSearch, true);
      }

      if (!streamedAny && lastErr) {
        throw lastErr;
      }

      // Send completion event with grounding metadata if available
      res.write(
        `event: done\ndata: ${JSON.stringify({
          grounding: groundingMetadata,
        })}\n\n`
      );
      res.end();
    } catch (err: any) {
      console.error("Chat generation error:", err);
      let errorMessage = err?.message || "Failed to generate AI response.";
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed?.error?.message) {
          try {
            const nested = JSON.parse(parsed.error.message);
            if (nested?.error?.message) {
              errorMessage = nested.error.message;
            }
          } catch {
            errorMessage = parsed.error.message;
          }
        }
      } catch {
        // Keep original errorMessage
      }
      
      // If headers already sent, write an SSE error event
      if (res.headersSent) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`);
        return res.end();
      }

      return res.status(500).json({ error: errorMessage });
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
