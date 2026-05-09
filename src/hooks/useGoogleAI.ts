import { supabase } from "@/integrations/supabase/client";
import { Message } from "./useConversations";

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

  return { sendMessage, generateContent };
}
