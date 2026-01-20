import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, X, FileText, Loader2, Image as ImageIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const ChatInput = ({ onSendMessage, isLoading, value, onValueChange }: ChatInputProps) => {
  const [message, setMessage] = useState(value || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with external value when it changes
  useEffect(() => {
    if (value !== undefined && value !== message) {
      setMessage(value);
    }
  }, [value]);

  const handleMessageChange = (newValue: string) => {
    setMessage(newValue);
    onValueChange?.(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedFile) && !isLoading) {
      onSendMessage(message, selectedFile || undefined);
      handleMessageChange("");
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setImagePreview(url);
      } else {
        setImagePreview(null);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const canSubmit = (message.trim() || selectedFile) && !isLoading;
  const isImage = selectedFile?.type.startsWith('image/');

  return (
    <div className="p-4 border-t bg-gradient-to-t from-background via-background to-transparent">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* File Preview Badge */}
        {selectedFile && (
          <div className="mb-3 animate-fade-in">
            {imagePreview ? (
              <div className="inline-flex items-center gap-3 bg-primary/10 px-3 py-2 rounded-xl border border-primary/20">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button 
                  type="button" 
                  onClick={clearFile} 
                  className="p-1.5 rounded-full hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm border border-primary/20">
                <FileText className="w-4 h-4 text-primary" />
                <span className="max-w-[200px] truncate text-foreground font-medium">{selectedFile.name}</span>
                <button 
                  type="button" 
                  onClick={clearFile} 
                  className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input Container - Glassmorphism style */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-card/80 backdrop-blur-sm border shadow-lg">
          {/* Hidden file input */}
          <Input
            type="file"
            accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
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
            title="Upload PDF, text file, or image"
          >
            {isImage ? (
              <ImageIcon className="h-5 w-5" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </Button>

          {/* Text input */}
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              selectedFile 
                ? isImage 
                  ? "Ask about this image..." 
                  : "Ask about this document..."
                : "Ask StudyFlow anything..."
            }
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
          StudyFlow can analyze images, PDFs, and text files. It may make mistakes.
        </p>
      </form>
    </div>
  );
};
