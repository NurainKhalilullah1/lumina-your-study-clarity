import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TextPart { text: string; }
interface InlineDataPart { inlineData: { mimeType: string; data: string }; }
type Part = TextPart | InlineDataPart;
interface Message { role: "user" | "model"; parts: Part[]; }
interface RequestBody { contents: Message[]; }

// ── Convert Gemini contents → OpenAI messages ────────────────────────────────
function toOpenAIMessages(contents: Message[]) {
  return contents.map((msg) => {
    const role = msg.role === "model" ? "assistant" : "user";
    const textParts = msg.parts.filter((p): p is TextPart => 'text' in p);
    const imageParts = msg.parts.filter((p): p is InlineDataPart => 'inlineData' in p);

    if (imageParts.length > 0 && msg.role === "user") {
      const contentArray: any[] = textParts.map(p => ({ type: "text", text: p.text }));
      for (const img of imageParts) {
        contentArray.push({
          type: "image_url",
          image_url: { url: `data:${img.inlineData.mimeType};base64,${img.inlineData.data}` },
        });
      }
      return { role, content: contentArray };
    }

    return { role, content: textParts.map(p => p.text).join("\n") };
  });
}

function hasImages(contents: Message[]): boolean {
  return contents.some(msg => msg.parts.some(p => 'inlineData' in p));
}

// ── Groq request (OpenAI-compatible) ─────────────────────────────────────────
async function tryGroq(apiKey: string, model: string, contents: Message[]): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  try {
    return await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: toOpenAIMessages(contents),
        // Vision-preview models on Groq are capped at 4 096 output tokens;
        // sending 8 192 causes a 400. All other Groq models support 8 192.
        max_tokens: model.includes("vision-preview") ? 4096 : 8192,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── OpenRouter request (OpenAI-compatible, free tier) ────────────────────────
async function tryOpenRouter(apiKey: string, model: string, contents: Message[]): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  try {
    return await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://studyflow.app",
        "X-Title": "StudyFlow AI Tutor",
      },
      body: JSON.stringify({
        model,
        messages: toOpenAIMessages(contents),
        max_tokens: 8192,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Gemini request ────────────────────────────────────────────────────────────
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const primary = Deno.env.get("GEMINI_API_KEY");
  if (primary) keys.push(primary);
  for (let i = 2; i <= 10; i++) {
    const k = Deno.env.get(`GEMINI_API_KEY_${i}`);
    if (k) keys.push(k);
  }
  return keys;
}

async function tryGemini(apiKey: string, model: string, contents: Message[]): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  try {
    return await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
        signal: controller.signal,
      }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contents }: RequestBody = await req.json();
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      throw new Error("Invalid request: 'contents' array is required and cannot be empty");
    }

    const withImages = hasImages(contents);
    let lastError = "";

    // ── 1. Try Groq first (free, 14,400 req/day) ──────────────────────────
    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (groqKey) {
      const groqModels = withImages
        ? ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
        : ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"];

      for (const model of groqModels) {
        let resp: Response;
        try {
          resp = await tryGroq(groqKey, model, contents);
        } catch (e: any) {
          lastError = `Groq/${model}: fetch error — ${e.message}`;
          console.warn(lastError);
          continue;
        }

        if (resp.ok) {
          const data = await resp.json();
          const text = data?.choices?.[0]?.message?.content;
          if (!text) throw new Error("No response text from Groq");
          console.log(`✓ Groq / ${model}`);
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Rate limited → try next Groq model
        if (resp.status === 429 || resp.status === 503) {
          lastError = `Groq/${model}: rate limited (${resp.status}) — trying next model…`;
          console.warn(lastError);
          continue;
        }

        // Other error → skip to Gemini fallback
        const errBody = await resp.text();
        lastError = `Groq/${model}: error ${resp.status} — ${errBody.slice(0, 200)}`;
        console.warn(lastError);
        break;
      }
    } else {
      console.warn("GROQ_API_KEY not set — skipping Groq, falling back to Gemini");
    }

    // ── 2. Fall back to Gemini keys ────────────────────────────────────────
    const geminiKeys = getGeminiKeys();
    if (geminiKeys.length === 0 && !groqKey) {
      throw new Error("No API keys configured. Add GROQ_API_KEY or GEMINI_API_KEY to Supabase secrets.");
    }

    const geminiModels = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-pro"];

    for (const [ki, apiKey] of geminiKeys.entries()) {
      for (const model of geminiModels) {
        let resp: Response;
        try {
          resp = await tryGemini(apiKey, model, contents);
        } catch (fetchErr: any) {
          lastError = `Gemini key ${ki + 1}/${model}: fetch error — ${fetchErr.message}`;
          console.warn(lastError);
          continue;
        }

        if (resp.ok) {
          console.log(`✓ Gemini key ${ki + 1} / ${model}`);
          const data = await resp.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) throw new Error("No response text from Gemini");
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (resp.status === 404 || resp.status === 400) {
          lastError = `Gemini key ${ki + 1}/${model}: not available (${resp.status})`;
          console.warn(lastError);
          continue;
        }

        if (resp.status === 429) {
          lastError = `Gemini key ${ki + 1} quota exhausted (429) — trying next key…`;
          console.warn(lastError);
          break; // try next Gemini key
        }

        const errBody = await resp.text();
        throw new Error(`Gemini API error (${resp.status}): ${errBody}`);
      }
    }

    // ── 3. Fall back to OpenRouter (free-tier models) ──────────────────────
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (openRouterKey) {
      // Free models on OpenRouter (no credits required, :free suffix).
      // Ordered by capability. 404 models are skipped automatically below.
      const openRouterModels = withImages
        ? [
            "meta-llama/llama-3.2-11b-vision-instruct:free",
            "google/gemini-2.0-flash-exp:free",
            "openrouter/auto", // auto-selects any available free model
          ]
        : [
            "meta-llama/llama-3.3-70b-instruct:free",
            "google/gemini-2.0-flash-exp:free",
            "deepseek/deepseek-r1-distill-llama-70b:free",
            "qwen/qwen3-8b:free",
            "mistralai/mistral-7b-instruct:free",
            "deepseek/deepseek-chat-v3-0324:free",
            "nousresearch/hermes-3-llama-3.1-405b:free",
            "openrouter/auto", // catch-all: picks whichever free model has capacity
          ];


      for (const model of openRouterModels) {
        let resp: Response;
        try {
          resp = await tryOpenRouter(openRouterKey, model, contents);
        } catch (e: any) {
          lastError = `OpenRouter/${model}: fetch error — ${e.message}`;
          console.warn(lastError);
          continue;
        }

        if (resp.ok) {
          const data = await resp.json();
          const text = data?.choices?.[0]?.message?.content;
          if (!text) {
            lastError = `OpenRouter/${model}: empty response`;
            console.warn(lastError);
            continue;
          }
          console.log(`✓ OpenRouter / ${model}`);
          return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (resp.status === 429 || resp.status === 503) {
          lastError = `OpenRouter/${model}: rate limited (${resp.status}) — trying next model…`;
          console.warn(lastError);
          continue;
        }

        // 404 = endpoint removed/unavailable — skip silently
        if (resp.status === 404) {
          lastError = `OpenRouter/${model}: endpoint not found (404) — skipping…`;
          console.warn(lastError);
          continue;
        }

        const errBody = await resp.text();
        lastError = `OpenRouter/${model}: error ${resp.status} — ${errBody.slice(0, 200)}`;
        console.warn(lastError);
        continue; // try next model rather than giving up
      }
    } else {
      console.warn("OPENROUTER_API_KEY not set — skipping OpenRouter fallback");
    }

    console.error(`All providers exhausted. Last error: ${lastError}`);
    const isRateLimit = /429|rate.?limit|quota|too many requests/i.test(lastError);
    throw new Error(
      isRateLimit
        ? "AI is temporarily busy — please wait a moment and try again."
        : "AI service is temporarily unavailable. Please try again later."
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message, text: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
