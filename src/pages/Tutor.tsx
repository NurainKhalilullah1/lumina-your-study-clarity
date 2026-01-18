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
  const [activeDocument, setActiveDocument] = useState<string>(""); 
  const [sidebarRefresh, setSidebarRefresh] = useState(0); // <--- Signal to refresh sidebar

  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, isLoading]);

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

    const userMsg = { role: "user", content: inputMessage, attachment_name: file?.name };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 1. Create Session if needed
      let currentSession = sessionId;
      let isNewSession = false;

      if (!currentSession && user) {
        isNewSession = true;
        // Start with a temporary title
        const tempTitle = file ? file.name : inputMessage.slice(0, 30);
        
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({ user_id: user.id, title: tempTitle })
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

      // 2. Handle Document Context
      let contextText = activeDocument;
      if (file) {
        if (file.type === "application/pdf") {
            const extracted = await extractTextFromPDF(file);
            contextText = extracted;
            setActiveDocument(extracted);
        } else {
            const text = await file.text();
            contextText = text;
            setActiveDocument(text);
        }
      }

      // 3. Generate AI Response
      const historyContext = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`
      ).join('\n');

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        You are Lumina.
        ACTIVE DOCUMENT: ${contextText ? contextText.slice(0, 25000) : "None"}
        HISTORY: ${historyContext}
        USER: "${inputMessage}"
        INSTRUCTIONS: Simplify, use bullets, be concise.
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

        // 4. GENERATE SMART TITLE (If new session)
        if (isNewSession) {
          // Run in background - don't await blocking the UI
          (async () => {
            try {
              const titlePrompt = `
                Generate a very short, specific 3-5 word title for a chat about this.
                User asked: "${inputMessage}"
                Document context: "${contextText ? contextText.slice(0, 100) : "None"}"
                AI replied: "${responseText.slice(0, 100)}"
                Return ONLY the title. No quotes.
              `;
              const titleResult = await model.generateContent(titlePrompt);
              const newTitle = titleResult.response.text().trim().replace(/['"]/g, '');
              
              if (newTitle) {
                await supabase.from('chat_sessions').update({ title: newTitle }).eq('id', currentSession);
                setSidebarRefresh(prev => prev + 1); // Trigger sidebar update
              }
            } catch (e) {
              console.error("Title gen failed", e);
            }
          })();
        }
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
            onNewChat={() => { setSessionId(null); setActiveDocument(""); }}
            refreshTrigger={sidebarRefresh} // Pass the signal
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
                   onNewChat={() => { setSessionId(null); setActiveDocument(""); }}
                   refreshTrigger={sidebarRefresh}
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
