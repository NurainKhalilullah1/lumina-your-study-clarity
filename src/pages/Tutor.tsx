import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ChatMessages } from "@/components/tutor/ChatMessages";
import { ChatInput } from "@/components/tutor/ChatInput";
import { StarterCards } from "@/components/tutor/StarterCards";
import { ChatSidebar } from "@/components/tutor/ChatSidebar";
import { useToast } from "@/hooks/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractTextFromPDF } from "@/utils/pdfUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // For mobile sidebar
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export default function Tutor() {
  const [messages, setMessages] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isLoading]);

  // Load Messages when switching sessions
  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    const loadHistory = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };
    loadHistory();
  }, [sessionId]);

  const handleSendMessage = async (inputMessage: string, file?: File) => {
    if (!inputMessage.trim() && !file) return;

    // 1. Optimistic UI Update
    const userMsg = { role: "user", content: inputMessage, attachment_name: file?.name };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 2. Ensure Session Exists (Create if new)
      let currentSession = sessionId;
      if (!currentSession && user) {
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({ user_id: user.id, title: inputMessage.slice(0, 30) + "..." })
          .select()
          .single();
        
        if (error) throw error;
        currentSession = data.id;
        setSessionId(data.id);
      }

      // 3. Save User Message to DB
      if (currentSession && user) {
        await supabase.from('chat_messages').insert({
          session_id: currentSession,
          role: 'user',
          content: inputMessage + (file ? ` [Attached: ${file.name}]` : '')
        });
      }

      // 4. Process File & AI
      let contextText = "";
      if (file) {
        contextText = file.type === "application/pdf" ? await extractTextFromPDF(file) : await file.text();
      }

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
      const prompt = `
        You are Lumina.
        CONTEXT: ${contextText ? `FILE CONTENT:\n${contextText.slice(0, 25000)}...` : "No file."}
        USER: "${inputMessage}"
        INSTRUCTIONS: Simplify complex topics. Use bullets. If asked for a quiz, provide 5 MCQs.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // 5. Update UI & Save Assistant Message
      setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);

      if (currentSession && user) {
        await supabase.from('chat_messages').insert({
          session_id: currentSession,
          role: 'assistant',
          content: responseText
        });
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to generate response.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-2rem)] bg-background">
        
        {/* Sidebar (Desktop) */}
        <div className="hidden md:block">
          <ChatSidebar 
            currentSessionId={sessionId} 
            onSelectSession={setSessionId} 
            onNewChat={() => setSessionId(null)} 
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header with Sidebar Toggle */}
          <div className="md:hidden p-4 border-b flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger>
              <SheetContent side="left" className="p-0">
                <ChatSidebar 
                   currentSessionId={sessionId} 
                   onSelectSession={(id) => setSessionId(id)} 
                   onNewChat={() => setSessionId(null)} 
                />
              </SheetContent>
            </Sheet>
            <span className="font-semibold">Lumina Tutor</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <StarterCards onCardClick={(text) => handleSendMessage(text)} />
            ) : (
              <ChatMessages messages={messages} isLoading={isLoading} />
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
