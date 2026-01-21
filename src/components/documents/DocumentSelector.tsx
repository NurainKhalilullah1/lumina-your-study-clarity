import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserFiles } from "@/hooks/useFileUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, FileType, CheckCircle } from "lucide-react";

export interface UserFile {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  text_content: string | null;
  extraction_status: string | null;
  created_at: string;
}

interface DocumentSelectorProps {
  mode: "single" | "multi";
  maxSelections?: number;
  onSelect: (documents: UserFile[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds?: string[];
}

export function DocumentSelector({
  mode,
  maxSelections = 3,
  onSelect,
  open,
  onOpenChange,
  selectedIds = [],
}: DocumentSelectorProps) {
  const { user } = useAuth();
  const { data: files = [], isLoading } = useUserFiles(user?.id);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));

  // Filter only files with completed extraction
  const availableFiles = files.filter(
    (file) =>
      file.extraction_status === "completed" &&
      file.text_content &&
      file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleToggle = (fileId: string) => {
    const newSelected = new Set(selected);
    
    if (mode === "single") {
      newSelected.clear();
      newSelected.add(fileId);
    } else {
      if (newSelected.has(fileId)) {
        newSelected.delete(fileId);
      } else if (newSelected.size < maxSelections) {
        newSelected.add(fileId);
      }
    }
    
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    const selectedFiles = files.filter((file) => selected.has(file.id));
    onSelect(selectedFiles);
    onOpenChange(false);
  };

  const getFileIcon = (mimeType: string | null) => {
    if (mimeType?.includes("pdf")) {
      return <FileType className="h-5 w-5 text-red-500" />;
    }
    return <FileText className="h-5 w-5 text-primary" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select from Library</DialogTitle>
          {mode === "multi" && (
            <p className="text-sm text-muted-foreground">
              Select up to {maxSelections} documents ({selected.size}/{maxSelections})
            </p>
          )}
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* File List */}
        <ScrollArea className="h-[300px] -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : availableFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? "No documents match your search"
                : "No documents available. Upload some first!"}
            </div>
          ) : (
            <div className="space-y-2">
              {availableFiles.map((file) => {
                const isSelected = selected.has(file.id);
                const isDisabled =
                  mode === "multi" && !isSelected && selected.size >= maxSelections;

                return (
                  <button
                    key={file.id}
                    onClick={() => !isDisabled && handleToggle(file.id)}
                    disabled={isDisabled}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                      ${isSelected
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted/50 hover:bg-muted border border-transparent"
                      }
                      ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    {mode === "multi" ? (
                      <Checkbox checked={isSelected} disabled={isDisabled} />
                    ) : (
                      isSelected && <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                    
                    <div className="shrink-0">
                      {getFileIcon(file.mime_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {file.file_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {file.text_content?.length.toLocaleString()} chars
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            Select {selected.size > 0 && `(${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
