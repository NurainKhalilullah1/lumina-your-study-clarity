import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Bot, User, FileText } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachment_name?: string;
}

interface ChatMessagesProps {
  messages: Message[];
}

// Named export to match Tutor.tsx import { ChatMessages }
export const ChatMessages = ({ messages }: ChatMessagesProps) => {
  return (
    <div className="space-y-4">
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
                // Use ReactMarkdown to render the AI's bullet points nicely
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
    </div>
  );
};
