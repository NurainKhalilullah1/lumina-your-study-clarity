import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Paperclip, ArrowUp, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  isUploading: boolean;
  selectedFile: File | null;
  onClearFile: () => void;
}

const ChatInput = ({
  onSend,
  onFileSelect,
  isLoading,
  isUploading,
  selectedFile,
  onClearFile,
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);
  
  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage("");
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      onFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };
  
  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-3xl mx-auto">
        {/* Selected File Preview */}
        {selectedFile && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-muted rounded-lg">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm truncate flex-1">{selectedFile.name}</span>
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <button
                onClick={onClearFile}
                className="p-1 hover:bg-background rounded"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
        
        {/* Input Container */}
        <div className="relative flex items-end gap-2 bg-muted rounded-2xl p-2">
          {/* Attachment Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 rounded-xl"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          
          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Lumina anything..."
            className="min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5"
            rows={1}
          />
          
          {/* Send Button */}
          <Button
            size="icon"
            className={cn(
              "shrink-0 h-9 w-9 rounded-xl transition-opacity",
              !message.trim() && "opacity-50"
            )}
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Footer Text */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          Lumina can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};

export default ChatInput;
