import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "./useConversations";

export function useGoogleAI() {
  const sendMessage = async (input: string, history: Message[]) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API key is not configured");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    const result = await model.generateContent({ contents });
    return result.response.text();
  };

  return { sendMessage };
}
