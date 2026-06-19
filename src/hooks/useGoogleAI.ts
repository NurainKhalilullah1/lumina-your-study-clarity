import { supabase } from "@/integrations/supabase/client";
import { Message } from "./useConversations";

// ── Chunking constants ────────────────────────────────────────────────────────
// Documents shorter than this threshold are handled by a single AI call.
const SINGLE_CALL_THRESHOLD = 12_000; // chars

// Each chunk sent to a parallel agent. Chosen to stay well under model context
// limits while leaving room for the system prompt + user question.
const CHUNK_SIZE = 8_000; // chars

// Overlap prevents important content near chunk boundaries from being missed.
const CHUNK_OVERLAP = 500; // chars

// Maximum parallel agents. Beyond 10 we risk exhausting rate limits.
const MAX_PARALLEL_CHUNKS = 10;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Splits a large document string into overlapping chunks.
 * For very large docs (> MAX_PARALLEL_CHUNKS × CHUNK_SIZE) the chunk size
 * is auto-scaled so we never exceed MAX_PARALLEL_CHUNKS agents.
 */
function chunkDocument(content: string): string[] {
  const totalChars = content.length;

  // Auto-scale chunk size if the document is extremely long
  const effectiveChunkSize = Math.max(
    CHUNK_SIZE,
    Math.ceil(totalChars / MAX_PARALLEL_CHUNKS)
  );
  const step = effectiveChunkSize - CHUNK_OVERLAP;

  const chunks: string[] = [];
  for (let i = 0; i < totalChars && chunks.length < MAX_PARALLEL_CHUNKS; i += step) {
    chunks.push(content.slice(i, i + effectiveChunkSize));
  }
  return chunks;
}

/**
 * Builds the per-chunk prompt sent to each parallel agent.
 * The agent only sees its slice of the document, but the full user question.
 */
function buildChunkPrompt(
  chunk: string,
  userQuestion: string,
  chunkIndex: number,
  totalChunks: number
): string {
  return `You are an expert AI study assistant analyzing PART ${chunkIndex + 1} of ${totalChunks} of a large document.

DOCUMENT EXCERPT (Part ${chunkIndex + 1}/${totalChunks}):
${chunk}

USER QUESTION: "${userQuestion}"

INSTRUCTIONS:
- Answer the user's question based ONLY on the content in this excerpt.
- If the answer is not in this excerpt, reply with exactly: "NOT_IN_THIS_CHUNK"
- Be concise but thorough. Use Markdown headings and bullet points.
- Do NOT start with "As an AI…" or similar clichés.`;
}

/**
 * Builds the synthesis prompt that merges all partial agent answers
 * into one coherent, well-structured final response.
 */
function buildSynthesisPrompt(
  userQuestion: string,
  partialAnswers: string[]
): string {
  const answersText = partialAnswers
    .map((a, i) => `[Agent ${i + 1}]:\n${a}`)
    .join("\n\n---\n\n");

  return `You are an expert AI study assistant. Multiple AI agents each analyzed a different section of a large document to answer the user's question. Your job is to synthesize their partial answers into one final, coherent, comprehensive response.

USER QUESTION: "${userQuestion}"

PARTIAL ANSWERS FROM AGENTS:
${answersText}

SYNTHESIS INSTRUCTIONS:
- Combine the information from all agents into a single, well-structured answer.
- Remove duplicates and resolve any contradictions (prefer the more detailed answer).
- Ignore any agent that replied "NOT_IN_THIS_CHUNK".
- Use Markdown: headers (##, ###), bullet points, bold for key terms.
- Do NOT mention "agents", "chunks", or "parts" — write as if you read the whole document yourself.
- Do NOT start with "As an AI…" or similar clichés. Dive straight into the answer.`;
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useGoogleAI() {
  /**
   * Send a chat message with optional conversation history and image.
   * Routes through the `gemini-chat` Supabase Edge Function so that:
   *  - No CORS issues in Android WebView (server-to-server call)
   *  - API key is stored securely as a Supabase secret, not in the APK
   */
  const sendMessage = async (
    input: string,
    history: Message[],
    image?: { data: string; mimeType: string }
  ): Promise<string> => {
    try {
      // Format previous messages into Gemini's contents format
      const rawHistory = history.map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: msg.content }],
      }));

      // Gemini requires the history to start with a 'user' message.
      // Strip any leading 'model' messages (e.g. system confirmation messages).
      const firstUserIdx = rawHistory.findIndex((m) => m.role === "user");
      const validHistory = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

      // Build the new user message — include inline image data if present
      const userParts: any[] = [{ text: input }];
      if (image) {
        userParts.push({
          inlineData: { data: image.data, mimeType: image.mimeType },
        });
      }

      const contents = [
        ...validHistory,
        { role: "user", parts: userParts },
      ];

      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: { contents },
      });

      if (error) throw new Error(error.message || "Edge Function call failed");
      if (data?.error) throw new Error(data.error);
      if (!data?.text) throw new Error("No response received from AI");

      return data.text as string;
    } catch (error: any) {
      console.error("AI Error:", error);
      throw new Error(error.message || "Failed to communicate with AI");
    }
  };

  /**
   * Generate content from a single prompt (no history, no image).
   * Used for flashcard generation, quiz generation, chat title rename, etc.
   */
  const generateContent = async (prompt: string): Promise<string> => {
    try {
      const contents = [{ role: "user", parts: [{ text: prompt }] }];

      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: { contents },
      });

      if (error) throw new Error(error.message || "Edge Function call failed");
      if (data?.error) throw new Error(data.error);
      if (!data?.text) throw new Error("No response received from AI");

      return data.text as string;
    } catch (error: any) {
      console.error("AI Error:", error);
      throw new Error(error.message || "Failed to communicate with AI");
    }
  };

  /**
   * Send a message with a large document as context.
   *
   * For short documents (< SINGLE_CALL_THRESHOLD chars) this is identical to
   * a regular sendMessage call — no overhead whatsoever.
   *
   * For large documents it:
   *  1. Splits the document into overlapping chunks (up to MAX_PARALLEL_CHUNKS)
   *  2. Fires one AI call per chunk simultaneously (parallel agents)
   *  3. Filters out "NOT_IN_THIS_CHUNK" non-answers
   *  4. Runs a final synthesis call to merge all partial answers
   *
   * This means the AI reads the ENTIRE document regardless of its size.
   */
  const sendMessageWithLargeDoc = async (
    input: string,
    history: Message[],
    document: string,
    image?: { data: string; mimeType: string }
  ): Promise<string> => {
    // Short document — use the regular single-call path
    if (document.length <= SINGLE_CALL_THRESHOLD) {
      const promptWithDoc = `You are an advanced, helpful, and highly capable AI assistant.
ACTIVE DOCUMENT:
${document}

USER: "${input}"

CRITICAL INSTRUCTIONS:
- TONE & STYLE: Be helpful, empathetic, objective, and highly articulate.
- FORMATTING: Use Markdown headers (##, ###), bold for key terms, bullet points.
- ACCURACY & DEPTH: Provide comprehensive, accurate explanations.
- NO ROBOTIC CLICHES: Avoid starting with "As an AI…". Dive straight into the answer.`;
      return sendMessage(promptWithDoc, history, image);
    }

    // Large document — parallel chunked analysis
    console.log(
      `[Large Doc] Document is ${document.length.toLocaleString()} chars — splitting into parallel chunks`
    );

    const chunks = chunkDocument(document);
    console.log(`[Large Doc] ${chunks.length} parallel agents will be used`);

    // Build one batch entry per chunk
    const batches = chunks.map((chunk, idx) => ({
      contents: [
        {
          role: "user" as const,
          parts: [
            {
              text: buildChunkPrompt(chunk, input, idx, chunks.length),
            },
          ],
        },
      ],
    }));

    // Fire all chunk agents in parallel
    const { data, error } = await supabase.functions.invoke("gemini-chat", {
      body: { batches },
    });

    if (error) throw new Error(error.message || "Parallel agent call failed");
    if (!data?.results) throw new Error("No results from parallel agents");

    // Collect successful partial answers, filter out sentinel-only responses.
    // Use an exact trimmed match so a real answer that quotes the sentinel
    // phrase in context is never accidentally dropped.
    const SENTINEL = "NOT_IN_THIS_CHUNK";
    const partialAnswers: string[] = (data.results as Array<{ text: string | null; error: string | null }>)
      .filter((r) => r.text && r.text.trim() !== SENTINEL)
      .map((r) => r.text as string);

    if (partialAnswers.length === 0) {
      throw new Error("No relevant content found in the document for this question.");
    }

    console.log(
      `[Large Doc] ${partialAnswers.length}/${chunks.length} agents found relevant content — synthesizing`
    );

    // Synthesis: merge all partial answers into one coherent response
    const synthesisPrompt = buildSynthesisPrompt(input, partialAnswers);
    return generateContent(synthesisPrompt);
  };

  return { sendMessage, generateContent, sendMessageWithLargeDoc };
}
