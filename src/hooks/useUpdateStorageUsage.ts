import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUpdateStorageUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Calculate total storage used from user_files
      const { data: files, error: filesError } = await supabase
        .from("user_files")
        .select("file_size")
        .eq("user_id", userId);

      if (filesError) throw filesError;

      const totalUsed = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) ?? 0;

      // Update the profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ storage_used_bytes: totalUsed })
        .eq("id", userId);

      if (updateError) throw updateError;

      return totalUsed;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["storage-quota", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
};
