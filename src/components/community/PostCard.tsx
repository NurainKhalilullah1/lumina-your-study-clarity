import { useState } from "react";
import { ThumbsUp, MessageCircle, User, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { CommunityPost, useDeletePost } from "@/hooks/useCommunity";
import CommentSection from "./CommentSection";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const deletePost = useDeletePost();

  const isAuthor = user?.id === post.user_id;

  // Extract optional title from first line
  const lines = post.content.split("\n");
  const hasTitle = lines.length > 1 && lines[0].length <= 80 && !lines[0].startsWith("#");
  const title = hasTitle ? lines[0] : null;
  const body = hasTitle ? lines.slice(1).join("\n").trim() : post.content;
  
  const isLong = body.length > 250 || body.split("\n").length > 4;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/20"
    >
      {/* Author row */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
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
      <div className="space-y-2 mt-2">
        {title && (
          <p className="font-semibold text-foreground text-lg mb-1">{title}</p>
        )}
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 text-foreground/90 leading-relaxed overflow-wrap-anywhere break-words">
          <ReactMarkdown>
            {isLong && !isExpanded ? body.slice(0, 250) + "..." : body}
          </ReactMarkdown>
        </div>
        {isLong && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-sm text-primary font-medium hover:underline focus:outline-none"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-border/50">
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleUpvote}
            className={isUpvoted ? "text-primary" : "text-muted-foreground hover:text-primary transition-colors"}
          >
            <ThumbsUp className={`w-4 h-4 mr-1.5 ${isUpvoted ? "fill-primary" : ""}`} />
            <span className="font-medium">{post.upvote_count}</span>
          </Button>
        </motion.div>
        
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            <span className="font-medium">{post.comment_count}</span>
          </Button>
        </motion.div>

        {isAuthor && (
          <motion.div whileTap={{ scale: 0.9 }} className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deletePost.mutate(post.id)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              disabled={deletePost.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <CommentSection postId={post.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostCard;
