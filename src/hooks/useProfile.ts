import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  storage_limit_bytes: number;
  storage_used_bytes: number;
  university: string | null;
  course_of_study: string | null;
  level: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!userId,
  });
};

export const createProfile = async (
  userId: string,
  email?: string,
  fullName?: string,
  avatarUrl?: string,
  university?: string,
  courseOfStudy?: string,
  level?: string
) => {
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: email || null,
      full_name: fullName || null,
      avatar_url: avatarUrl || null,
      university: university || null,
      course_of_study: courseOfStudy || null,
      level: level || null,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
