import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User, FileText } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { StudyFlowLogo } from "@/components/StudyFlowLogo";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachment_name?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
}

export const ChatMessages = ({ messages, isLoading }: ChatMessagesProps) => {
  return (
    <div className="space-y-6 pb-4 max-w-4xl mx-auto">
      {messages.map((msg, idx) => (
        <div 
          key={idx} 
          className={cn(
            "flex gap-4 animate-fade-in",
            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
          )}
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          {/* Avatar */}
          <Avatar className={cn(
            "w-9 h-9 shrink-0 border-2 shadow-sm",
            msg.role === 'assistant' 
              ? "border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10" 
              : "border-border"
          )}>
            <AvatarFallback className={cn(
              msg.role === 'assistant' && "bg-transparent"
            )}>
              {msg.role === 'assistant' 
                ? <StudyFlowLogo size="sm" /> 
                : <User className="w-4 h-4 text-muted-foreground" />
              }
            </AvatarFallback>
          </Avatar>

          {/* Message content */}
          <div className={cn(
            "flex flex-col max-w-[80%]",
            msg.role === 'user' ? "items-end" : "items-start"
          )}>
            {/* Attachment badge */}
            {msg.attachment_name && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 bg-muted/50 px-3 py-1.5 rounded-full border">
                <FileText className="w-3.5 h-3.5" /> 
                <span className="truncate max-w-[150px]">{msg.attachment_name}</span>
              </div>
            )}
            
            {/* Message bubble */}
            <div className={cn(
              "px-4 py-3 rounded-2xl text-sm leading-relaxed",
              msg.role === 'user' 
                ? "gradient-primary text-primary-foreground rounded-br-md shadow-lg" 
                : "bg-muted/50 text-foreground rounded-bl-md border border-border/50"
            )}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex gap-4 flex-row animate-fade-in">
          <Avatar className="w-9 h-9 shrink-0 border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10">
            <AvatarFallback className="bg-transparent">
              <StudyFlowLogo size="sm" className="animate-pulse" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-2xl rounded-bl-md border border-border/50">
              <span className="text-sm text-muted-foreground">StudyFlow is thinking</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
