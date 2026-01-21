import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserFiles, useDeleteFile } from "@/hooks/useFileUpload";
import DashboardLayout from "@/components/DashboardLayout";
import { DocumentUploadZone } from "@/components/documents/DocumentUploadZone";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";
import { Input } from "@/components/ui/input";
import { Search, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const deleteFile = useDeleteFile();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<UserFile | null>(null);

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
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Documents</h1>
            <p className="text-muted-foreground">
              Upload documents once, use them across Tutor and Quiz
            </p>
          </div>
        </div>

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
