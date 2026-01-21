import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUploadFile } from "@/hooks/useFileUpload";
import { useStorageQuota, formatBytes } from "@/hooks/useStorageQuota";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".md"];

interface UploadingFile {
  name: string;
  progress: number;
}

export function DocumentUploadZone() {
  const { user } = useAuth();
  const uploadFile = useUploadFile();
  const { data: quota } = useStorageQuota(user?.id);
  const { toast } = useToast();
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const validateFile = (file: File): string | null => {
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    const isValidType = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension);
    
    if (!isValidType) {
      return `${file.name}: Only PDF, TXT, and MD files are supported`;
    }
    
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `${file.name}: File exceeds ${MAX_FILE_SIZE_MB}MB limit`;
    }
    
    return null;
  };

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    if (!user || !quota) return;

    const fileArray = Array.from(files);
    const errors: string[] = [];
    const validFiles: File[] = [];

    // Calculate total size of files to be uploaded
    let totalUploadSize = 0;

    // Validate all files
    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        // Check if this file would exceed storage quota
        if (quota.remaining < file.size + totalUploadSize) {
          errors.push(`${file.name}: Not enough storage space (${formatBytes(quota.remaining)} remaining)`);
        } else {
          totalUploadSize += file.size;
          validFiles.push(file);
        }
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      toast({
        title: "Some files couldn't be uploaded",
        description: errors.join("\n"),
        variant: "destructive",
      });
    }

    // Upload valid files
    for (const file of validFiles) {
      setUploadingFiles((prev) => [...prev, { name: file.name, progress: 0 }]);
      
      try {
        // Simulate progress (actual upload doesn't provide progress)
        const progressInterval = setInterval(() => {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, progress: Math.min(f.progress + 10, 90) }
                : f
            )
          );
        }, 100);

        await uploadFile.mutateAsync({ userId: user.id, file });
        
        clearInterval(progressInterval);
        setUploadingFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, progress: 100 } : f))
        );

        // Remove from uploading list after brief delay
        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
        }, 500);

        toast({
          title: "Document uploaded",
          description: `${file.name} is now available in your library.`,
        });
      } catch (error) {
        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}. Please try again.`,
          variant: "destructive",
        });
      }
    }
  }, [user, quota, uploadFile, toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(e.target.files);
      e.target.value = "";
    }
  };

  const isStorageFull = quota?.isAtLimit ?? false;

  return (
    <div className="space-y-4">
      {/* Storage Warning */}
      {quota?.isNearLimit && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${quota.isAtLimit ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p className="text-sm">
            {quota.isAtLimit
              ? `Storage full. Delete some files to upload more.`
              : `Running low on space. ${formatBytes(quota.remaining)} remaining.`}
          </p>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isStorageFull
            ? "border-muted bg-muted/50 cursor-not-allowed"
            : isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }
        `}
      >
        {!isStorageFull && (
          <input
            type="file"
            accept=".pdf,.txt,.md"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        )}
        
        <div className="flex flex-col items-center gap-3">
          <div className={`p-3 rounded-full ${isStorageFull ? 'bg-muted' : 'bg-primary/10'}`}>
            <Upload className={`h-6 w-6 ${isStorageFull ? 'text-muted-foreground' : 'text-primary'}`} />
          </div>
          <div>
            <p className={`font-medium ${isStorageFull ? 'text-muted-foreground' : 'text-foreground'}`}>
              {isStorageFull ? "Storage full" : "Drop files here or click to upload"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF, TXT, MD files up to {MAX_FILE_SIZE_MB}MB each
            </p>
            {quota && !isStorageFull && (
              <p className="text-xs text-muted-foreground mt-2">
                {formatBytes(quota.remaining)} available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-3 p-3 bg-muted rounded-lg"
            >
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <Progress value={file.progress} className="h-1 mt-1" />
              </div>
              {file.progress < 100 && (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
