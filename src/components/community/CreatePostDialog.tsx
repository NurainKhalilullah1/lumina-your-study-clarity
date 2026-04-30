import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreatePost, useUserGroup } from "@/hooks/useCommunity";
import { useToast } from "@/hooks/use-toast";

const CreatePostDialog = () => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("discussion");
  const [postToGroup, setPostToGroup] = useState(false);
  const createPost = useCreatePost();
  const { data: userGroup } = useUserGroup();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!content.trim()) return;
    createPost.mutate(
      {
        content: content.trim(),
        category,
        groupId: postToGroup && userGroup ? userGroup.id : null,
      },
      {
        onSuccess: () => {
          toast({ title: "Post created!" });
          setContent("");
          setCategory("discussion");
          setPostToGroup(false);
          setOpen(false);
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="tip">Tip</SelectItem>
                <SelectItem value="discussion">Discussion</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Content</Label>
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>

          {userGroup && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Post to My Group</p>
                <p className="text-xs text-muted-foreground">
                  {userGroup.university} — {userGroup.course_of_study}
                </p>
              </div>
              <Switch checked={postToGroup} onCheckedChange={setPostToGroup} />
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!content.trim() || createPost.isPending}
          >
            {createPost.isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
