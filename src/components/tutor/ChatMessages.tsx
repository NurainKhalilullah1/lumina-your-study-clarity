import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessagesProps {
  messages: Message[];
  isThinking: boolean;
}

const TypingIndicator = () => (
  <div className="flex items-start gap-3 py-4">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <Sparkles className="w-4 h-4 text-primary" />
    </div>
    <div className="flex items-center gap-1 pt-2">
      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  </div>
);

const ChatMessages = ({ messages, isThinking }: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);
  
  return (
    <ScrollArea className="flex-1 px-4" ref={scrollRef}>
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-3">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
            )}
            
            <div
              className={cn(
                "max-w-[80%] px-4 py-3",
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                  : "bg-transparent text-foreground"
              )}
            >
              {message.role === "assistant" ? (
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        
        {isThinking && <TypingIndicator />}
        
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};

export default ChatMessages;
