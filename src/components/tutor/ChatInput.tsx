import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, X, FileText } from "lucide-react";
import { useState, useRef } from "react";

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

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
      {/* File Preview Badge */}
      {selectedFile && (
        <div className="mb-2 flex items-center gap-2 bg-accent/10 w-fit px-3 py-1 rounded-full text-xs text-accent-foreground border border-accent/20">
          <FileText className="w-3 h-3" />
          <span className="max-w-[200px] truncate">{selectedFile.name}</span>
          <button type="button" onClick={() => setSelectedFile(null)} className="hover:text-destructive">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          title="Upload Slides (PDF)"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={selectedFile ? "Ask about this document (e.g., 'Summarize', 'Quiz me')..." : "Ask a question..."}
          disabled={isLoading}
          className="flex-1"
        />
        
        <Button type="submit" disabled={isLoading || (!message.trim() && !selectedFile)}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
