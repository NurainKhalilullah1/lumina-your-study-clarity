import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePosts, useUserUpvotes, useToggleUpvote, useUserGroup } from "@/hooks/useCommunity";
import PostCard from "@/components/community/PostCard";
import CreatePostDialog from "@/components/community/CreatePostDialog";
import GroupInfo from "@/components/community/GroupInfo";
import { Loader2 } from "lucide-react";

const Community = () => {
  const { data: allPosts, isLoading: loadingAll } = usePosts();
  const { data: userGroup } = useUserGroup();
  const { data: groupPosts, isLoading: loadingGroup } = usePosts(userGroup?.id);
  const { data: upvotedIds } = useUserUpvotes();
  const toggleUpvote = useToggleUpvote();

  const renderPosts = (posts: typeof allPosts, loading: boolean) => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    if (!posts?.length) {
      return (
        <p className="text-center text-muted-foreground py-12">
          No posts yet. Be the first to share something!
        </p>
      );
    }
    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isUpvoted={upvotedIds?.includes(post.id) ?? false}
            onToggleUpvote={() =>
              toggleUpvote.mutate({
                postId: post.id,
                isUpvoted: upvotedIds?.includes(post.id) ?? false,
              })
            }
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Community</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ask questions, share tips, and connect with fellow students.
            </p>
          </div>
          <CreatePostDialog />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All Posts</TabsTrigger>
              <TabsTrigger value="group" className="flex-1">My Group</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderPosts(allPosts, loadingAll)}</TabsContent>
            <TabsContent value="group">
              {userGroup ? (
                renderPosts(groupPosts, loadingGroup)
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  Set your university and course in Settings to see your group's posts.
                </p>
              )}
            </TabsContent>
          </Tabs>

          <div className="hidden lg:block">
            <GroupInfo />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Community;
