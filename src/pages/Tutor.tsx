import { useState, useRef, useEffect } from "react";
// FIX: Removed curly braces because DashboardLayout is likely a default export
import DashboardLayout from "@/components/DashboardLayout"; 
import { ChatMessages } from "@/components/tutor/ChatMessages";
import { ChatInput } from "@/components/tutor/ChatInput";
import { StarterCards } from "@/components/tutor/StarterCards";
import { useToast } from "@/hooks/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractTextFromPDF } from "@/utils/pdfUtils";
import { useAuth } from "@/contexts/AuthContext";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export default function Tutor() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Auto-scroll logic
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  const handleSendMessage = async (inputMessage: string, file?: File) => {
    if (!inputMessage.trim() && !file) return;

    // 1. Update UI immediately
    const newMsg = { 
      role: "user", 
      content: inputMessage, 
      attachment_name: file?.name 
    };
    setMessages((prev) => [...prev, newMsg]);
    setIsLoading(true);

    try {
      let contextText = "";

      // 2. Process File (if uploaded)
      if (file) {
        if (file.type === "application/pdf") {
          contextText = await extractTextFromPDF(file);
        } else {
          contextText = await file.text();
        }
      }

      // 3. Build the System Prompt (The "Brain")
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `
        You are Lumina, a specialized study assistant for students.
        
        USER CONTEXT:
        ${contextText ? `DOCUMENT CONTENT:\n${contextText.slice(0, 30000)}... (truncated)` : "No document provided."}
        
        USER REQUEST: "${inputMessage}"

        YOUR INSTRUCTIONS:
        1. IF QUIZ REQUESTED: Generate 5 Multiple Choice Questions based on the document. Format them clearly. At the end, provide an answer key hidden behind a "Answers:" spoiler tag if possible, or just at the very bottom.
        
        2. IF SUMMARY REQUESTED: Use the "Feynman Technique" (Simple language). Use Bullet Points.
        
        3. ALWAYS: If the text contains complex academic jargon, identify 3 key terms and define them simply at the bottom of your response under a "📝 Key Terms" section.
        
        4. TONE: Encouraging, concise, and mobile-friendly.
      `;

      // 4. Generate Response
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // 5. Add AI Response to UI
      const aiMsg = { role: "assistant", content: responseText };
      setMessages((prev) => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)] bg-background">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <StarterCards onCardClick={(text) => handleSendMessage(text)} />
          ) : (
            <ChatMessages messages={messages} />
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  );
}
