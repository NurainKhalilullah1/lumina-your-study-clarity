import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Bot, User, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachment_name?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean; // Added this prop
}

export const ChatMessages = ({ messages, isLoading }: ChatMessagesProps) => {
  return (
    <div className="space-y-4 pb-4">
      {messages.map((msg, idx) => (
        <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
          <Avatar className="w-8 h-8 border">
            <AvatarFallback className={msg.role === 'assistant' ? "bg-primary/10" : ""}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>

          <div className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? "items-end" : "items-start")}>
            {msg.attachment_name && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 bg-muted px-2 py-1 rounded-md w-fit">
                <FileText className="w-3 h-3" /> {msg.attachment_name}
              </div>
            )}
            
            <Card className={cn("p-3 text-sm", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted/50")}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </Card>
          </div>
        </div>
      ))}

      {/* === THE AI INDICATOR === */}
      {isLoading && (
        <div className="flex gap-3 flex-row animate-pulse">
          <Avatar className="w-8 h-8 border">
            <AvatarFallback className="bg-primary/10"><Bot className="w-4 h-4 text-primary" /></AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1 bg-muted/50 px-4 py-3 rounded-lg">
            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></span>
          </div>
        </div>
      )}
    </div>
  );
};
