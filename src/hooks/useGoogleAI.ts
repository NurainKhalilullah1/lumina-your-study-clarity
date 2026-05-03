import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "./useConversations";

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export function useGoogleAI() {
  const sendMessage = async (input: string, history: Message[], image?: { data: string; mimeType: string }) => {
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
      }

      // Try gemini-2.0-flash first, fall back to gemini-flash-latest and gemini-2.5-flash
      const models = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-flash"];
      let lastError: any = null;

      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });

          // Format history for Gemini
          const chatHistory = history.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
          }));

          const chat = model.startChat({
            history: chatHistory,
          });

          const parts: any[] = [{ text: input }];
          if (image) {
            parts.push({
              inlineData: {
                data: image.data,
                mimeType: image.mimeType
              }
            });
          }

          const result = await chat.sendMessage(parts);
          const response = await result.response;
          return response.text();
        } catch (err) {
          lastError = err;
          console.warn(`Model ${modelName} failed, trying next...`, err);
          continue;
        }
      }

      throw lastError || new Error("Failed to get response from AI");
    } catch (error: any) {
      console.error("Gemini SDK Error:", error);
      throw new Error(error.message || "Failed to communicate with AI");
    }
  };

  const generateContent = async (prompt: string) => {
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
      }

      const models = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-2.5-flash"];
      let lastError: any = null;

      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        } catch (err) {
          lastError = err;
          continue;
        }
      }
      throw lastError || new Error("Failed to generate content");
    } catch (error: any) {
      console.error("Gemini SDK Error:", error);
      throw new Error(error.message || "Failed to communicate with AI");
    }
  };

  return { sendMessage, generateContent };
}
