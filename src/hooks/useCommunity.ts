import { useEffect } from "react";
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

export const useCommunityRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const postsChannel = supabase
      .channel('public:community_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      })
      .subscribe();

    const commentsChannel = supabase
      .channel('public:community_comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments' }, () => {
        queryClient.invalidateQueries({ queryKey: ["community-comments"] });
      })
      .subscribe();

    const upvotesChannel = supabase
      .channel('public:community_upvotes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_upvotes' }, () => {
        queryClient.invalidateQueries({ queryKey: ["community-posts"] });
        queryClient.invalidateQueries({ queryKey: ["community-upvotes"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(upvotesChannel);
    };
  }, [queryClient]);
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
        const { data: deletedRows, error: deleteErr } = await supabase
          .from("community_upvotes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .select("post_id");

        if (deleteErr) throw deleteErr;

        // Decrement only if we successfully removed a row
        if (deletedRows && deletedRows.length > 0) {
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
        }
      } else {
        const { error } = await supabase.from("community_upvotes").insert({
          post_id: postId,
          user_id: user.id,
        });

        // Postgres constraint violation: 23505 (unique_violation). 
        // This signifies the user already upvoted this post, safely ignore the constraint error so we don't spam 409s.
        if (error && error.code !== '23505') {
          throw error;
        }

        // Only increment the vote counter if the insert definitively succeeded without conflicts
        if (!error) {
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      queryClient.invalidateQueries({ queryKey: ["community-upvotes"] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Manually cascade delete related rows in case constraints are missing
      await supabase.from("community_upvotes").delete().eq("post_id", postId);
      await supabase.from("community_comments").delete().eq("post_id", postId);

      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
};
