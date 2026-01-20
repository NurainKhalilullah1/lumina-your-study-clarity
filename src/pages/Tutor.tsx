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
import { Menu, Sparkles, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export default function Tutor() {
  const [messages, setMessages] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDocument, setActiveDocument] = useState<string>("");
  const [activeDocumentName, setActiveDocumentName] = useState<string>("");
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

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

  const handleClearContext = () => {
    setActiveDocument("");
    setActiveDocumentName("");
    toast({ title: "Context cleared", description: "Document context removed." });
  };

  const handleSendMessage = async (inputMessage: string, file?: File) => {
    if (!inputMessage.trim() && !file) return;

    const userMsg = { role: "user", content: inputMessage, attachment_name: file?.name };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let currentSession = sessionId;
      let isNewSession = false;

      if (!currentSession && user) {
        isNewSession = true;
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
        setActiveDocumentName(file.name);
      }

      const historyContext = messages.slice(-6).map(m => 
        `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`
      ).join('\n');

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
        You are StudyFlow, a friendly and knowledgeable AI tutor.
        ACTIVE DOCUMENT: ${contextText ? contextText.slice(0, 25000) : "None"}
        HISTORY: ${historyContext}
        USER: "${inputMessage}"
        INSTRUCTIONS: Be helpful, use clear formatting with headers and bullet points when appropriate. Keep responses concise but comprehensive.
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

        if (isNewSession) {
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
                setSidebarRefresh(prev => prev + 1);
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

  const handleNewChat = () => {
    setSessionId(null);
    setActiveDocument("");
    setActiveDocumentName("");
    setMobileSheetOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setSessionId(id);
    setMobileSheetOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-2rem)] bg-background overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <ChatSidebar 
            currentSessionId={sessionId} 
            onSelectSession={handleSelectSession} 
            onNewChat={handleNewChat}
            refreshTrigger={sidebarRefresh}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              {/* Mobile menu */}
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <ChatSidebar 
                    currentSessionId={sessionId} 
                    onSelectSession={handleSelectSession} 
                    onNewChat={handleNewChat}
                    refreshTrigger={sidebarRefresh}
                  />
                </SheetContent>
              </Sheet>

              {/* Branding */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-lg hidden sm:inline">StudyFlow</span>
              </div>
            </div>

            {/* Document context indicator */}
            {activeDocumentName && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-sm">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-foreground font-medium max-w-[120px] sm:max-w-[200px] truncate">
                  {activeDocumentName}
                </span>
                <button 
                  onClick={handleClearContext}
                  className="p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            )}
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-glow">
            {messages.length === 0 ? (
              <StarterCards onCardClick={(text) => handleSendMessage(text)} />
            ) : (
              <ChatMessages messages={messages} isLoading={isLoading} />
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </DashboardLayout>
  );
}
