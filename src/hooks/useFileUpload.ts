import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { extractTextFromPDF } from "@/utils/pdfUtils";

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

export const useUserFiles = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-files", userId],
    queryFn: async (): Promise<UserFile[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("user_files")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const filePath = `${userId}/${Date.now()}-${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("course-materials")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Extract text content based on file type
      let textContent: string | null = null;
      let extractionStatus = "pending";
      
      try {
        if (file.type === "application/pdf") {
          textContent = await extractTextFromPDF(file);
        } else if (
          file.type === "text/plain" ||
          file.type === "text/markdown" ||
          file.name.endsWith(".txt") ||
          file.name.endsWith(".md")
        ) {
          textContent = await file.text();
        }
        
        if (textContent) {
          extractionStatus = "completed";
        } else {
          extractionStatus = "failed";
        }
      } catch (error) {
        console.error("Text extraction failed:", error);
        extractionStatus = "failed";
      }
      
      // Create file record with extracted content
      const { data, error: dbError } = await supabase
        .from("user_files")
        .insert({
          user_id: userId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          text_content: textContent,
          extraction_status: extractionStatus,
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-files", variables.userId] });
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, fileId, filePath }: { userId: string; fileId: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("course-materials")
        .remove([filePath]);
      
      if (storageError) throw storageError;
      
      // Delete record
      const { error: dbError } = await supabase
        .from("user_files")
        .delete()
        .eq("id", fileId);
      
      if (dbError) throw dbError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-files", variables.userId] });
    },
  });
};
