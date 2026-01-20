import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, X, FileText, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading: boolean;
}

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedFile) && !isLoading) {
      onSendMessage(message, selectedFile || undefined);
      setMessage("");
      setSelectedFile(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const canSubmit = (message.trim() || selectedFile) && !isLoading;

  return (
    <div className="p-4 border-t bg-gradient-to-t from-background via-background to-transparent">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* File Preview Badge */}
        {selectedFile && (
          <div className="mb-3 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm border border-primary/20">
              <FileText className="w-4 h-4 text-primary" />
              <span className="max-w-[200px] truncate text-foreground font-medium">{selectedFile.name}</span>
              <button 
                type="button" 
                onClick={() => setSelectedFile(null)} 
                className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          </div>
        )}

        {/* Input Container - Glassmorphism style */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-card/80 backdrop-blur-sm border shadow-lg">
          {/* Hidden file input */}
          <Input
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          
          {/* Attach button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            title="Upload PDF or text file"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Text input */}
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={selectedFile ? "Ask about this document..." : "Ask StudyFlow anything..."}
            disabled={isLoading}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60"
          />
          
          {/* Send button */}
          <Button 
            type="submit" 
            disabled={!canSubmit}
            size="icon"
            className={cn(
              "shrink-0 h-10 w-10 rounded-xl transition-all duration-300",
              canSubmit 
                ? "gradient-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Helper text */}
        <p className="text-[11px] text-muted-foreground/50 text-center mt-2">
          StudyFlow can make mistakes. Verify important information.
        </p>
      </form>
    </div>
  );
};
