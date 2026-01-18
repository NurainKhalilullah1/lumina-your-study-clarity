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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export default function Tutor() {
  const [messages, setMessages] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // === NEW: MEMORY STATE ===
  // This keeps the PDF text alive even after the first message
  const [activeDocument, setActiveDocument] = useState<string>(""); 

  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isLoading]);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      // Optional: Clear active document when switching chats? 
      // setActiveDocument(""); 
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

    const userMsg = { role: "user", content: inputMessage, attachment_name: file?.name };
    
    // Optimistically update UI
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
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

      if (currentSession && user) {
        await supabase.from('chat_messages').insert({
          session_id: currentSession,
          role: 'user',
          content: inputMessage + (file ? ` [Attached: ${file.name}]` : '')
        });
      }

      // === 1. HANDLE FILE MEMORY ===
      let contextText = activeDocument; // Start with what we already know
      
      if (file) {
        // If new file, extract and overwrite memory
        if (file.type === "application/pdf") {
            const extracted = await extractTextFromPDF(file);
            contextText = extracted;
            setActiveDocument(extracted); // Save to state
        } else {
            const text = await file.text();
            contextText = text;
            setActiveDocument(text); // Save to state
        }
      }

      // === 2. BUILD CONVERSATION HISTORY ===
      // We grab the last few messages so AI knows the context (e.g., "Change IT to bullets")
      const historyContext = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`
      ).join('\n');

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `
        You are Lumina, a persistent study tutor.
        
        === ACTIVE DOCUMENT ===
        (The student is currently looking at this content. specific questions refer to this.)
        ${contextText ? contextText.slice(0, 30000) : "No document active."}
        =======================

        === RECENT CHAT HISTORY ===
        ${historyContext}
        Student: ${inputMessage}
        ===========================

        INSTRUCTIONS:
        1. Answer the student's LAST question based on the Document and History.
        2. If they ask to "summarize" or "explain", refer to the ACTIVE DOCUMENT.
        3. Use Bullet Points for clarity.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

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
      toast({ title: "Error", description: "Connection interrupted.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-2rem)] bg-background">
        <div className="hidden md:block">
          <ChatSidebar 
            currentSessionId={sessionId} 
            onSelectSession={setSessionId} 
            onNewChat={() => {
                setSessionId(null);
                setActiveDocument(""); // Optional: Reset doc on new chat
            }} 
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="md:hidden p-4 border-b flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger>
              <SheetContent side="left" className="p-0">
                <ChatSidebar 
                   currentSessionId={sessionId} 
                   onSelectSession={(id) => setSessionId(id)} 
                   onNewChat={() => {
                       setSessionId(null);
                       setActiveDocument("");
                   }} 
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
