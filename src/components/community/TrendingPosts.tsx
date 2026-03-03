import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import type { CommunityPost } from "@/hooks/useCommunity";

interface TrendingPostsProps {
  posts: CommunityPost[] | undefined;
}

const TrendingPosts = ({ posts }: TrendingPostsProps) => {
  const trending = useMemo(() => {
    if (!posts?.length) return [];
    return [...posts]
      .sort((a, b) => b.upvote_count - a.upvote_count)
      .slice(0, 3)
      .filter((p) => p.upvote_count > 0);
  }, [posts]);

  if (!trending.length) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Trending</h3>
      </div>
      <div className="space-y-3">
        {trending.map((post, i) => (
          <div key={post.id} className="flex gap-2">
            <span className="text-xs font-bold text-muted-foreground mt-0.5">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-xs text-foreground line-clamp-2 leading-snug">
                {post.content.split("\n")[0].slice(0, 80)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {post.upvote_count} upvote{post.upvote_count !== 1 ? "s" : ""} · {post.profiles?.full_name || "Anonymous"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingPosts;
