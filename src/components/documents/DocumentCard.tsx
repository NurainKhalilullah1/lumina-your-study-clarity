import { FileText, FileType, Trash2, Eye, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface UserFile {
  id: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  extraction_status: string | null;
  created_at: string;
}

interface DocumentCardProps {
  file: UserFile;
  onPreview: () => void;
  onDelete: () => void;
}

export function DocumentCard({ file, onPreview, onDelete }: DocumentCardProps) {
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    if (file.mime_type?.includes("pdf")) {
      return <FileType className="h-8 w-8 text-red-500" />;
    }
    return <FileText className="h-8 w-8 text-primary" />;
  };

  const getStatusIcon = () => {
    switch (file.extraction_status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (file.extraction_status) {
      case "completed":
        return "Ready";
      case "failed":
        return "Failed";
      default:
        return "Processing";
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow overflow-hidden max-w-full">
      <CardContent className="p-4 min-w-0">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden">
            <div className="shrink-0 p-2 bg-muted rounded-lg">
              {getFileIcon()}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="font-medium text-foreground truncate" title={file.file_name}>
                {file.file_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.file_size)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </Badge>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPreview}
              disabled={file.extraction_status !== "completed"}
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
