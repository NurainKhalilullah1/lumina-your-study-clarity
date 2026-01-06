import { useState, useEffect } from "react";
import { Menu, ChevronDown, FileText, X, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";
import ChatSidebar from "@/components/tutor/ChatSidebar";
import ChatMessages from "@/components/tutor/ChatMessages";
import ChatInput from "@/components/tutor/ChatInput";
import StarterCards from "@/components/tutor/StarterCards";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  useConversations,
  useMessages,
  useCreateConversation,
  useSendMessage,
  useUpdateConversationTitle,
} from "@/hooks/useConversations";
import { useUserFiles, useUploadFile, UserFile } from "@/hooks/useFileUpload";

// --- IMPORTS FOR AI & PDF ---
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjsLib from "pdfjs-dist";

// --- PDF WORKER CONFIGURATION ---
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- PDF EXTRACTION FUNCTION ---
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += `Page ${i}: ${pageText}\n\n`;
    }
    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

// --- INITIALIZE GOOGLE GEMINI (DEBUG MODE) ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// 🔍 DEBUG LOG: Check the browser console (F12) to see this message
console.log("Gemini Key Status:", API_KEY ? "Present (Starts with " + API_KEY.substring(0, 4) + ")" : "MISSING");

if (!API_KEY) {
  console.error("CRITICAL: VITE_GEMINI_API_KEY is missing. Please check Vercel Settings.");
}

// Initialize with the key (or a dummy string to prevent crash on load)
const genAI = new GoogleGenerativeAI(API_KEY || "missing_key");

const Tutor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contextFile, setContextFile] = useState<UserFile | null>(null);
  
  const [extractedContext, setExtractedContext] = useState<string>("");
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  
  const { data: conversations = [] } = useConversations(user?.id);
  const { data: messages = [] } = useMessages(activeConversationId ?? undefined);
  const { data: userFiles = [] } = useUserFiles(user?.id);
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
  const updateTitle = useUpdateConversationTitle();
  const uploadFile = useUploadFile();
  
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);
  
  const handleNewChat = async () => {
    if (!user) return;
    try {
      const newConv = await createConversation.mutateAsync({ userId: user.id });
      setActiveConversationId(newConv.id);
      setContextFile(null);
      setExtractedContext(""); 
      setChatSidebarOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create new chat", variant: "destructive" });
    }
  };
  
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setChatSidebarOpen(false);
  };
  
  // --- REAL AI SEND HANDLER ---
  const handleSend = async (content: string) => {
    if (!user) return;
    
    // Check key before sending
    if (!API_KEY) {
        toast({ title: "Configuration Error", description: "API Key is missing in Vercel settings.", variant: "destructive" });
        return;
    }

    let conversationId = activeConversationId;
    
    if (!conversationId) {
      try {
        const newConv = await createConversation.mutateAsync({ 
          userId: user.id,
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        });
        conversationId = newConv.id;
        setActiveConversationId(newConv.id);
      } catch (error) {
        toast({ title: "Error", description: "Failed to create conversation", variant: "destructive" });
        return;
      }
    }
    
    if (messages.length === 0) {
      updateTitle.mutate({
        id: conversationId,
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
      });
    }
    
    try {
      await sendMessage.mutateAsync({ conversationId, role: "user", content });
      setIsThinking(true);

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      let finalPrompt = content;
      if (extractedContext) {
        finalPrompt = `You are an expert academic tutor. 
        I have uploaded a document. Here is the content:
        --- START DOCUMENT ---
        ${extractedContext.slice(0, 30000)} 
        --- END DOCUMENT ---
        User Question: ${content}
        Answer based on the document provided.`;
      }

      const result = await model.generateContent(finalPrompt);
      const responseText = result.response.text();
      
      await sendMessage.mutateAsync({ conversationId, role: "assistant", content: responseText });
      setIsThinking(false);
    } catch (error) {
      setIsThinking(false);
      console.error("AI Error:", error);
      toast({
        title: "AI Error",
        description: "Gemini failed to respond. Check console for details.",
        variant: "destructive",
      });
    }
  };
  
  const handleFileSelect = async (file: File) => {
    if (!user) return;
    setSelectedFile(file);
    setIsThinking(true);
    
    try {
      toast({ title: "Reading PDF...", description: "Extracting text for the AI." });
      const text = await extractTextFromPDF(file);
      setExtractedContext(text);
      
      const uploadedFile = await uploadFile.mutateAsync({ userId: user.id, file });
      setContextFile(uploadedFile);
      
      setSelectedFile(null);
      toast({ title: "Ready!", description: `${file.name} has been read.` });
    } catch (error) {
      setSelectedFile(null);
      console.error(error);
      toast({ title: "Error", description: "Could not read the PDF text.", variant: "destructive" });
    } finally {
      setIsThinking(false);
    }
  };
  
  const handleStarterSelect = (prompt: string) => {
    handleSend(prompt);
  };
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col">
          {/* Mobile Header */}
          <header className="flex items-center gap-2 h-14 px-4 border-b border-border bg-card md:hidden">
            <SidebarTrigger className="-ml-1"><Menu className="w-5 h-5" /></SidebarTrigger>
            <span className="text-lg font-bold text-foreground flex-1">AI Tutor</span>
            <Sheet open={chatSidebarOpen} onOpenChange={setChatSidebarOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="sm">History</Button></SheetTrigger>
              <SheetContent side="right" className="p-0 w-72">
                <ChatSidebar conversations={conversations} activeConversationId={activeConversationId} onSelectConversation={handleSelectConversation} onNewChat={handleNewChat} />
              </SheetContent>
            </Sheet>
          </header>
          
          {/* Desktop Header */}
          <div className="hidden md:flex items-center h-14 px-4 border-b border-border bg-card"><SidebarTrigger /></div>
          
          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            <div className="hidden lg:block w-64 shrink-0">
              <ChatSidebar conversations={conversations} activeConversationId={activeConversationId} onSelectConversation={handleSelectConversation} onNewChat={handleNewChat} />
            </div>
            
            <div className="flex-1 flex flex-col bg-background min-w-0">
              {/* Context Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 text-sm">
                      <FileText className="w-4 h-4" />
                      {contextFile ? contextFile.file_name : "General Knowledge"}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => { setContextFile(null); setExtractedContext(""); }}>General Knowledge</DropdownMenuItem>
                    {userFiles.map((file) => (
                      <DropdownMenuItem key={file.id} onClick={() => { setContextFile(file); toast({ title: "Note", description: "Selected old file. Re-upload to refresh context." }); }}>
                        {file.file_name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {contextFile && (
                  <Button variant="ghost" size="sm" onClick={() => { setContextFile(null); setExtractedContext(""); }} className="gap-1 text-muted-foreground">
                    <X className="w-3 h-3" /> Clear
                  </Button>
                )}
              </div>
              
              {/* Chat View */}
              {messages.length === 0 && !isThinking ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><Sparkles className="w-8 h-8 text-primary" /></div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">How can I help you today?</h2>
                    <p className="text-muted-foreground max-w-md">Upload course materials and ask me anything.</p>
                  </motion.div>
                  <StarterCards onSelect={handleStarterSelect} />
                </div>
              ) : (
                <ChatMessages messages={messages} isThinking={isThinking} />
              )}
              
              <ChatInput onSend={handleSend} onFileSelect={handleFileSelect} isLoading={isThinking} isUploading={uploadFile.isPending} selectedFile={selectedFile} onClearFile={() => setSelectedFile(null)} />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Tutor;
