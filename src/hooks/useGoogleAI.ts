import { supabase } from "@/integrations/supabase/client";
import { Message } from "./useConversations";

export function useGoogleAI() {
  const sendMessage = async (input: string, history: Message[]) => {
    // Format history for Gemini
    const contents = history.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: input }]
    });

    // Call via Supabase Edge Function (works on both web and Android)
    const { data, error } = await supabase.functions.invoke("gemini-chat", {
      body: { contents },
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    if (!data?.text) throw new Error("No response received from AI");

    return data.text as string;
  };

  return { sendMessage };
}
