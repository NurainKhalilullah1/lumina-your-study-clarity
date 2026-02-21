import { useState } from "react";
import { ThumbsUp, MessageCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { CommunityPost } from "@/hooks/useCommunity";
import CommentSection from "./CommentSection";

const categoryColors: Record<string, string> = {
  question: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  tip: "bg-green-500/10 text-green-500 border-green-500/20",
  discussion: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  achievement: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

interface PostCardProps {
  post: CommunityPost;
  isUpvoted: boolean;
  onToggleUpvote: () => void;
}

const PostCard = ({ post, isUpvoted, onToggleUpvote }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Author row */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {post.profiles?.full_name || "Anonymous"}
          </p>
          <p className="text-xs text-muted-foreground">
            {post.profiles?.university && <span>{post.profiles.university} · </span>}
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        <Badge variant="outline" className={categoryColors[post.category] || ""}>
          {post.category}
        </Badge>
      </div>

      {/* Content */}
      <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleUpvote}
          className={isUpvoted ? "text-primary" : "text-muted-foreground"}
        >
          <ThumbsUp className={`w-4 h-4 mr-1 ${isUpvoted ? "fill-primary" : ""}`} />
          {post.upvote_count}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          {post.comment_count}
        </Button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </div>
  );
};

export default PostCard;
