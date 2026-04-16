import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { ChatMessages } from "@/components/tutor/ChatMessages";
import { ChatInput } from "@/components/tutor/ChatInput";
import { StarterCards } from "@/components/tutor/StarterCards";
import { ChatSidebar } from "@/components/tutor/ChatSidebar";
import { ExportButton } from "@/components/tutor/ExportButton";
import { PomodoroTimer } from "@/components/tutor/PomodoroTimer";
import { FlashcardGenerator } from "@/components/tutor/FlashcardGenerator";
import { DocumentSelector, type UserFile } from "@/components/documents/DocumentSelector";
import { useToast } from "@/hooks/use-toast";
import { extractTextFromPDF } from "@/utils/pdfUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTrackStudyEvent } from "@/hooks/useStudyStats";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, FileText, X, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudyFlowLogo } from "@/components/StudyFlowLogo";
import { Capacitor } from '@capacitor/core';

// No more direct genAI initialization here

export default function Tutor() {
  const [messages, setMessages] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDocument, setActiveDocument] = useState<string>("");
  const [activeDocumentName, setActiveDocumentName] = useState<string>("");
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [pendingInput, setPendingInput] = useState("");
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [triggerFlashcards, setTriggerFlashcards] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const trackEvent = useTrackStudyEvent();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    const loadHistory = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    loadHistory();
  }, [sessionId]);

  const handleClearContext = () => {
    setActiveDocument("");
    setActiveDocumentName("");
    toast({ title: "Context cleared", description: "Document context removed." });
  };

  const handleSelectDocument = (documents: UserFile[]) => {
    if (documents.length > 0) {
      const doc = documents[0];
      setActiveDocument(doc.text_content || "");
      setActiveDocumentName(doc.file_name);
      toast({
        title: "Document loaded",
        description: `"${doc.file_name}" is now your active context.`,
      });
    }
  };

  // Convert file to base64 for image uploads
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleSendMessage = async (inputMessage: string, file?: File) => {
    if (!inputMessage.trim() && !file) return;

    // Check for quiz-related keywords
    const quizKeywords = ["quiz me", "test me", "generate quiz", "i want a quiz", "create a quiz"];
    const isQuizRequest = quizKeywords.some((kw) => inputMessage.toLowerCase().includes(kw));

    if (isQuizRequest && (activeDocument || file)) {
      toast({ title: "Quiz Mode", description: "Starting quiz setup..." });
      navigate("/quiz", {
        state: {
          documentContent: activeDocument,
          documentName: activeDocumentName,
        },
      });
      return;
    }

    const isImage = file?.type.startsWith("image/");
    const imageUrl = file && isImage ? URL.createObjectURL(file) : undefined;

    const userMsg = {
      role: "user",
      content: inputMessage,
      attachment_name: file?.name,
      image_url: imageUrl,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let currentSession = sessionId;
      let isNewSession = false;

      if (!currentSession && user) {
        isNewSession = true;
        const tempTitle = file ? file.name : inputMessage.slice(0, 30);

        const { data, error } = await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id, title: tempTitle })
          .select()
          .single();
        if (error) throw error;
        currentSession = data.id;
        setSessionId(data.id);
      }

      if (currentSession && user) {
        await supabase.from("chat_messages").insert({
          session_id: currentSession,
          role: "user",
          content: inputMessage + (file ? ` [Attached: ${file.name}]` : ""),
        });
      }

      let contextText = activeDocument;
      let imagePart: { inlineData: { data: string; mimeType: string } } | null = null;

      if (file) {
        // Track document analysis
        if (user) {
          trackEvent.mutate({
            userId: user.id,
            eventType: "document_analyzed",
            metadata: {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
            },
          });
        }

        if (isImage) {
          // Handle image upload for vision
          const base64 = await fileToBase64(file);
          imagePart = {
            inlineData: {
              data: base64,
              mimeType: file.type,
            },
          };
          setActiveDocumentName(file.name);
        } else if (file.type === "application/pdf") {
          const extracted = await extractTextFromPDF(file);
          contextText = extracted;
          setActiveDocument(extracted);
          setActiveDocumentName(file.name);
        } else {
          const text = await file.text();
          contextText = text;
          setActiveDocument(text);
          setActiveDocumentName(file.name);
        }
      }

      const historyContents = messages
        .slice(-6)
        .map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }));

      let currentContents = [...historyContents];
      
      if (imagePart) {
        const promptText = `You are StudyFlow, a friendly and knowledgeable AI tutor. 
A student has shared an image with you. Please analyze it and help them understand it.
${inputMessage ? `Their question: "${inputMessage}"` : "Please describe and explain what you see in this image."}
INSTRUCTIONS: Be helpful, use clear formatting with headers and bullet points when appropriate. Keep responses concise but comprehensive.`;
        
        currentContents.push({
          role: "user",
          parts: [
            { text: promptText },
            { 
              inline_data: { 
                mime_type: imagePart.inlineData.mimeType, 
                data: imagePart.inlineData.data 
              } 
            } as any
          ]
        });
      } else {
        const promptText = `
          You are StudyFlow, a friendly and knowledgeable AI tutor.
          ACTIVE DOCUMENT: ${contextText ? contextText.slice(0, 25000) : "None"}
          USER: "${inputMessage}"
          INSTRUCTIONS: Be helpful, use clear formatting with headers and bullet points when appropriate. Keep responses concise but comprehensive.
        `;
        currentContents.push({
          role: "user",
          parts: [{ text: promptText }]
        });
      }

      let fullResponseText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // Call via Supabase Edge Function
      const { data: aiData, error: aiError } = await supabase.functions.invoke("gemini-chat", {
        body: { contents: currentContents as any },
      });

      if (aiError) {
        console.error("Supabase function error:", aiError);
        throw new Error(`AI service error: ${aiError.message || "Unknown error"}`);
      }

      if (aiData?.error) {
        console.error("Gemini API error:", aiData.error);
        throw new Error(`AI error: ${aiData.error}`);
      }

      if (!aiData?.text) {
        throw new Error("No response received from AI service");
      }

      fullResponseText = aiData.text;
      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], content: fullResponseText };
        return newMsgs;
      });

      const responseText = fullResponseText;

      if (currentSession && user) {
        await supabase.from("chat_messages").insert({
          session_id: currentSession,
          role: "assistant",
          content: responseText,
        });

        if (isNewSession) {
          // Auto-rename: generate a smart 4-6 word title in the background
          const sessionToRename = currentSession;
          const firstUserMsg = inputMessage;
          const firstAiMsg = responseText.slice(0, 200);
          (async () => {
            try {
              const renamePrompt = `Generate a short, descriptive title (4-6 words max) for a study chat that started with:
User: "${firstUserMsg.slice(0, 150)}"
AI: "${firstAiMsg}"
Reply with ONLY the title, no quotes, no punctuation at the end.`;
              const { data: titleData } = await supabase.functions.invoke("gemini-chat", {
                body: { contents: [{ role: "user", parts: [{ text: renamePrompt }] }] },
              });
              const generatedTitle = titleData?.text?.trim().replace(/^["']|["']$/g, "").slice(0, 60);
              const finalTitle = generatedTitle || firstUserMsg.slice(0, 50).trim() || (file ? file.name : "New Chat");
              await supabase.from("chat_sessions").update({ title: finalTitle }).eq("id", sessionToRename);
              setSidebarRefresh((prev) => prev + 1);
            } catch {
              // Fallback to truncated first message
              const fallback = firstUserMsg.slice(0, 50).trim() || (file ? file.name : "New Chat");
              await supabase.from("chat_sessions").update({ title: fallback }).eq("id", sessionToRename);
              setSidebarRefresh((prev) => prev + 1);
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

  // Get all content for flashcard generation
  const getAllContent = () => {
    const chatContent = messages
      .filter((m) => m.role === "assistant")
      .map((m) => m.content)
      .join("\n\n");
    return activeDocument ? `${activeDocument}\n\n${chatContent}` : chatContent;
  };

  return (
    <DashboardLayout hideMobileHeader>
      <div className="flex flex-1 bg-background min-h-0">
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
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
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
                  <StudyFlowLogo size="md" variant="purple" />
                </div>
                <span className="font-semibold text-lg hidden sm:inline">StudyFlow</span>
              </div>
            </div>

            {/* Center: Document context indicator */}
            <div className="flex items-center gap-2 min-w-0 overflow-hidden max-w-[140px] sm:max-w-[220px] md:max-w-xs">
              {activeDocumentName ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20 text-sm min-w-0 overflow-hidden w-full">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-foreground font-medium truncate min-w-0 flex-1">
                    {activeDocumentName}
                  </span>
                  <button
                    onClick={handleClearContext}
                    className="p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocumentSelector(true)}
                  className="gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Select Document</span>
                </Button>
              )}
            </div>

            {/* Right: Tools */}
            <div className="flex items-center gap-1">
              <FlashcardGenerator
                content={getAllContent()}
                sessionId={sessionId || undefined}
                deckName={activeDocumentName || "Chat Session"}
                triggerGenerate={triggerFlashcards}
                onTriggerHandled={() => setTriggerFlashcards(false)}
              />
              <ExportButton messages={messages} title={activeDocumentName || "StudyFlow Chat"} />
              <PomodoroTimer />
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-glow">
            {messages.length === 0 ? (
              <StarterCards
                onSetInputText={setPendingInput}
                onGenerateFlashcards={() => setTriggerFlashcards(true)}
                documentContext={activeDocument}
                documentName={activeDocumentName}
              />
            ) : (
              <ChatMessages messages={messages} isLoading={isLoading} />
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            value={pendingInput}
            onValueChange={setPendingInput}
          />
        </div>
      </div>

      {/* Document Selector Modal */}
      <DocumentSelector
        mode="single"
        open={showDocumentSelector}
        onOpenChange={setShowDocumentSelector}
        onSelect={handleSelectDocument}
      />
    </DashboardLayout>
  );
}
