import { useState, useEffect } from "react";
import { Menu, ChevronDown, FileText, X, Sparkles } from "lucide-react";
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

const Tutor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contextFile, setContextFile] = useState<UserFile | null>(null);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  
  const { data: conversations = [] } = useConversations(user?.id);
  const { data: messages = [] } = useMessages(activeConversationId ?? undefined);
  const { data: userFiles = [] } = useUserFiles(user?.id);
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
  const updateTitle = useUpdateConversationTitle();
  const uploadFile = useUploadFile();
  
  // Select first conversation on load
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
      setChatSidebarOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  };
  
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setChatSidebarOpen(false);
  };
  
  const handleSend = async (content: string) => {
    if (!user) return;
    
    let conversationId = activeConversationId;
    
    // Create conversation if none exists
    if (!conversationId) {
      try {
        const newConv = await createConversation.mutateAsync({ 
          userId: user.id,
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        });
        conversationId = newConv.id;
        setActiveConversationId(newConv.id);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Update title if this is the first message
    if (messages.length === 0) {
      updateTitle.mutate({
        id: conversationId,
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
      });
    }
    
    // Send user message
    try {
      await sendMessage.mutateAsync({
        conversationId,
        role: "user",
        content,
      });
      
      // Simulate AI thinking
      setIsThinking(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Mock AI response
      const aiResponse = generateMockResponse(content, contextFile?.file_name);
      await sendMessage.mutateAsync({
        conversationId,
        role: "assistant",
        content: aiResponse,
      });
      
      setIsThinking(false);
    } catch (error) {
      setIsThinking(false);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };
  
  const handleFileSelect = async (file: File) => {
    if (!user) return;
    setSelectedFile(file);
    
    try {
      const uploadedFile = await uploadFile.mutateAsync({ userId: user.id, file });
      setContextFile(uploadedFile);
      setSelectedFile(null);
      toast({
        title: "File uploaded",
        description: `${file.name} is ready to use as context.`,
      });
    } catch (error) {
      setSelectedFile(null);
      toast({
        title: "Upload failed",
        description: "Could not upload the file. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleStarterSelect = (prompt: string) => {
    handleSend(prompt);
  };
  
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col">
          {/* Mobile Header */}
          <header className="flex items-center gap-2 h-14 px-4 border-b border-border bg-card md:hidden">
            <SidebarTrigger className="-ml-1">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <span className="text-lg font-bold text-foreground flex-1">AI Tutor</span>
            <Sheet open={chatSidebarOpen} onOpenChange={setChatSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  History
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-72">
                <ChatSidebar
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={handleSelectConversation}
                  onNewChat={handleNewChat}
                />
              </SheetContent>
            </Sheet>
          </header>
          
          {/* Desktop Header */}
          <div className="hidden md:flex items-center h-14 px-4 border-b border-border bg-card">
            <SidebarTrigger />
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat History Sidebar (Desktop) */}
            <div className="hidden lg:block w-64 shrink-0">
              <ChatSidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewChat={handleNewChat}
              />
            </div>
            
            {/* Chat Area */}
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
                    <DropdownMenuItem onClick={() => setContextFile(null)}>
                      General Knowledge
                    </DropdownMenuItem>
                    {userFiles.map((file) => (
                      <DropdownMenuItem
                        key={file.id}
                        onClick={() => setContextFile(file)}
                      >
                        {file.file_name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {contextFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setContextFile(null)}
                    className="gap-1 text-muted-foreground"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Messages or Empty State */}
              {messages.length === 0 && !isThinking ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-8"
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      How can I help you today?
                    </h2>
                    <p className="text-muted-foreground max-w-md">
                      Upload your course materials and ask me anything. I can explain concepts, summarize chapters, and help you study.
                    </p>
                  </motion.div>
                  <StarterCards onSelect={handleStarterSelect} />
                </div>
              ) : (
                <ChatMessages messages={messages} isThinking={isThinking} />
              )}
              
              {/* Input Area */}
              <ChatInput
                onSend={handleSend}
                onFileSelect={handleFileSelect}
                isLoading={isThinking}
                isUploading={uploadFile.isPending}
                selectedFile={selectedFile}
                onClearFile={() => setSelectedFile(null)}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

// Mock response generator
const generateMockResponse = (query: string, fileName?: string): string => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes("summarize") || lowerQuery.includes("summary")) {
    return `## Summary${fileName ? ` of ${fileName}` : ""}

Here are the key points I found:

1. **Main Concept**: The document discusses fundamental principles that form the basis of the subject matter.

2. **Key Findings**: Several important observations were noted throughout the material.

3. **Conclusions**: The author presents compelling arguments supported by evidence.

Would you like me to elaborate on any of these points?`;
  }
  
  if (lowerQuery.includes("quiz") || lowerQuery.includes("test")) {
    return `## Practice Quiz

Here are some questions to test your understanding:

**Question 1:** What is the primary purpose of the concept discussed in the material?
- A) To simplify complex processes
- B) To introduce new methodologies
- C) To challenge existing theories
- D) All of the above

**Question 2:** True or False: The principles outlined can be applied across multiple domains.

**Question 3:** Explain in your own words the main takeaway from this topic.

Would you like me to provide the answers or create more questions?`;
  }
  
  if (lowerQuery.includes("explain") || lowerQuery.includes("what is")) {
    return `## Explanation

Let me break this down for you:

**In simple terms:** Think of this concept like a building block. Just as you need a strong foundation to build a house, this principle serves as the foundation for understanding more complex ideas.

**Example:** Imagine you're learning to cook. You start with basic techniques like chopping and sautéing before moving to complex recipes. Similarly, this concept is one of those fundamental techniques.

**Why it matters:** Understanding this helps you grasp more advanced topics and apply knowledge in practical situations.

Does this explanation help? Would you like me to provide more examples?`;
  }
  
  return `I understand you're asking about "${query.slice(0, 50)}${query.length > 50 ? "..." : ""}". 

Based on my analysis, here are some insights:

1. This is an interesting topic that connects to several key concepts.
2. There are multiple perspectives to consider when approaching this question.
3. I'd recommend reviewing the relevant sections of your materials for more context.

Would you like me to:
- **Elaborate** on any specific aspect?
- **Create practice questions** to test your understanding?
- **Summarize** related concepts?

Just let me know how I can help further! 📚`;
};

export default Tutor;
