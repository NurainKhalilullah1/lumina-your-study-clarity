import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, FileType } from "lucide-react";

interface UserFile {
  id: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  text_content: string | null;
  extraction_status: string | null;
  created_at: string;
}

interface DocumentPreviewModalProps {
  file: UserFile | null;
  open: boolean;
  onClose: () => void;
}

export function DocumentPreviewModal({ file, open, onClose }: DocumentPreviewModalProps) {
  if (!file) return null;

  const getFileIcon = () => {
    if (file.mime_type?.includes("pdf")) {
      return <FileType className="h-5 w-5 text-red-500 shrink-0" />;
    }
    return <FileText className="h-5 w-5 text-primary shrink-0" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="min-w-0 overflow-hidden">
          <DialogTitle className="flex items-center gap-2 min-w-0 overflow-hidden">
            {getFileIcon()}
            <span className="truncate flex-1 min-w-0" title={file.file_name}>
              {file.file_name}
            </span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">
            {formatFileSize(file.file_size)} • {file.text_content?.length.toLocaleString() || 0} characters
          </p>
        </DialogHeader>
        
        <ScrollArea className="h-[50vh] mt-4">
          {file.text_content ? (
            <pre className="text-sm whitespace-pre-wrap break-words font-sans text-foreground leading-relaxed max-w-full overflow-hidden">
              {file.text_content}
            </pre>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No content available for preview
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
