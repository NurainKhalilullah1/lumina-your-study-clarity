import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StorageQuota {
  used: number;
  limit: number;
  percentage: number;
  remaining: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

export const useStorageQuota = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["storage-quota", userId],
    queryFn: async (): Promise<StorageQuota> => {
      if (!userId) {
        return {
          used: 0,
          limit: 52428800,
          percentage: 0,
          remaining: 52428800,
          isNearLimit: false,
          isAtLimit: false,
        };
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("storage_limit_bytes, storage_used_bytes")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching storage quota:", error);
        return {
          used: 0,
          limit: 52428800,
          percentage: 0,
          remaining: 52428800,
          isNearLimit: false,
          isAtLimit: false,
        };
      }

      const limit = data?.storage_limit_bytes ?? 52428800;
      const used = data?.storage_used_bytes ?? 0;
      const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
      const remaining = Math.max(0, limit - used);

      return {
        used,
        limit,
        percentage,
        remaining,
        isNearLimit: percentage >= 80,
        isAtLimit: percentage >= 95,
      };
    },
    enabled: !!userId,
  });
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
