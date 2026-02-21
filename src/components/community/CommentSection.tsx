import { useState } from "react";
import { useComments, useCreateComment } from "@/hooks/useCommunity";
import { User, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const CommentSection = ({ postId }: { postId: string }) => {
  const { data: comments, isLoading } = useComments(postId);
  const createComment = useCreateComment();
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    createComment.mutate({ postId, content: text.trim() });
    setText("");
  };

  return (
    <div className="border-t border-border pt-3 space-y-3">
      {isLoading && <p className="text-xs text-muted-foreground">Loading comments...</p>}

      {comments?.map((c) => (
        <div key={c.id} className="flex gap-2">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {c.profiles?.avatar_url ? (
              <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs">
              <span className="font-medium text-foreground">{c.profiles?.full_name || "Anonymous"}</span>
              <span className="text-muted-foreground ml-2">
                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
              </span>
            </p>
            <p className="text-sm text-foreground">{c.content}</p>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="text-sm"
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!text.trim() || createComment.isPending}
        >
          {createComment.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;
