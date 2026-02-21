import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  category: string;
  group_id: string | null;
  upvote_count: number;
  comment_count: number;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    university: string | null;
  };
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const usePosts = (groupId?: string | null) => {
  return useQuery({
    queryKey: ["community-posts", groupId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("community_posts")
        .select("*, profiles(full_name, avatar_url, university)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (groupId) {
        query = query.eq("group_id", groupId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown) as CommunityPost[];
    },
  });
};

export const useComments = (postId: string) => {
  return useQuery({
    queryKey: ["community-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_comments")
        .select("*, profiles(full_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as unknown) as CommunityComment[];
    },
    enabled: !!postId,
  });
};

export const useUserUpvotes = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["community-upvotes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("community_upvotes")
        .select("post_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((u) => u.post_id);
    },
    enabled: !!user,
  });
};

export const useUserGroup = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-group", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("study_group_members")
        .select("group_id, study_groups(id, university, course_of_study, member_count)")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.study_groups ?? null;
    },
    enabled: !!user,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      content,
      category,
      groupId,
    }: {
      content: string;
      category: string;
      groupId?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        content,
        category,
        group_id: groupId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("community_comments").insert({
        post_id: postId,
        user_id: user.id,
        content,
      });
      if (error) throw error;

      // Increment comment_count manually
      const { data: postData } = await supabase
        .from("community_posts")
        .select("comment_count")
        .eq("id", postId)
        .single();
      if (postData) {
        await supabase
          .from("community_posts")
          .update({ comment_count: (postData.comment_count || 0) + 1 })
          .eq("id", postId);
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["community-comments", vars.postId] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
};

export const useToggleUpvote = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isUpvoted }: { postId: string; isUpvoted: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      if (isUpvoted) {
        await supabase
          .from("community_upvotes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        // Decrement
        const { data } = await supabase
          .from("community_posts")
          .select("upvote_count")
          .eq("id", postId)
          .single();
        if (data) {
          await supabase
            .from("community_posts")
            .update({ upvote_count: Math.max((data.upvote_count || 0) - 1, 0) })
            .eq("id", postId);
        }
      } else {
        await supabase.from("community_upvotes").insert({
          post_id: postId,
          user_id: user.id,
        });

        const { data } = await supabase
          .from("community_posts")
          .select("upvote_count")
          .eq("id", postId)
          .single();
        if (data) {
          await supabase
            .from("community_posts")
            .update({ upvote_count: (data.upvote_count || 0) + 1 })
            .eq("id", postId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      queryClient.invalidateQueries({ queryKey: ["community-upvotes"] });
    },
  });
};
