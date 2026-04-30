import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserFiles, useDeleteFile } from "@/hooks/useFileUpload";
import { useStorageQuota, formatBytes } from "@/hooks/useStorageQuota";
import DashboardLayout from "@/components/DashboardLayout";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, FileText, HardDrive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { detectHorizontalOverflow } from "@/lib/detectHorizontalOverflow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export default function Documents() {
  const { user } = useAuth();
  const { data: files = [], isLoading } = useUserFiles(user?.id);
  const { data: quota } = useStorageQuota(user?.id);
  const deleteFile = useDeleteFile();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<UserFile | null>(null);

  // DEV-ONLY: Horizontal overflow detector.
  // Enable via DevTools console: localStorage.setItem('sf_debug_overflow','1'); then refresh.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (localStorage.getItem("sf_debug_overflow") !== "1") return;

    const run = (reason: string) => {
      // Two RAFs to let layout settle after React + browser paint.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          detectHorizontalOverflow({ reason, maxOffenders: 20 });
        });
      });
    };

    run("Documents mount");

    const onResize = () => run("window resize");
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (localStorage.getItem("sf_debug_overflow") !== "1") return;
    // When uploads finish, React Query refetches and files list changes.
    detectHorizontalOverflow({ reason: `files changed (${files.length})`, maxOffenders: 20 });
  }, [files.length]);

  const filteredFiles = files.filter((file) =>
    file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteConfirmFile || !user) return;
    
    try {
      await deleteFile.mutateAsync({
        userId: user.id,
        fileId: deleteConfirmFile.id,
        filePath: deleteConfirmFile.file_path,
      });
      toast({
        title: "Document deleted",
        description: `${deleteConfirmFile.file_name} has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmFile(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-full min-w-0">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">My Documents</h1>
            <p className="text-muted-foreground">
              Upload documents once, use them across Tutor and Quiz
            </p>
          </div>

          {/* Storage Summary Card */}
          {quota && (
            <div className="bg-card border rounded-lg p-4 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <HardDrive className="h-4 w-4" />
                <span>Storage</span>
              </div>
              <Progress
                value={quota.percentage}
                className="h-2 mb-2"
                indicatorClassName={
                  quota.isAtLimit
                    ? "bg-destructive"
                    : quota.isNearLimit
                      ? "bg-warning"
                      : "bg-primary"
                }
              />
              <p className="text-sm font-medium">
                {formatBytes(quota.used)} / {formatBytes(quota.limit)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(quota.remaining)} available
              </p>
            </div>
          )}
        </motion.div>

        {/* Upload Zone */}
        <DocumentUploadZone />

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              {searchQuery ? "No documents found" : "No documents yet"}
            </h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Upload your first document to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-hidden">
            {filteredFiles.map((file) => (
              <DocumentCard
                key={file.id}
                file={file}
                onPreview={() => setPreviewFile(file)}
                onDelete={() => setDeleteConfirmFile(file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <DocumentPreviewModal
        file={previewFile}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmFile}
        onOpenChange={() => setDeleteConfirmFile(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmFile?.file_name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
