import { isToday, isYesterday, isWithinInterval, subDays } from "date-fns";
import { SquarePen, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Conversation, useDeleteConversation } from "@/hooks/useConversations";
import { useToast } from "@/hooks/use-toast";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

const groupConversationsByDate = (conversations: Conversation[]) => {
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const lastWeek: Conversation[] = [];
  const older: Conversation[] = [];
  
  const now = new Date();
  const weekAgo = subDays(now, 7);
  
  conversations.forEach((conv) => {
    const date = new Date(conv.updated_at);
    if (isToday(date)) {
      today.push(conv);
    } else if (isYesterday(date)) {
      yesterday.push(conv);
    } else if (isWithinInterval(date, { start: weekAgo, end: now })) {
      lastWeek.push(conv);
    } else {
      older.push(conv);
    }
  });
  
  return { today, yesterday, lastWeek, older };
};

const ChatSidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
}: ChatSidebarProps) => {
  const deleteConversation = useDeleteConversation();
  const { toast } = useToast();
  const grouped = groupConversationsByDate(conversations);
  
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop the click from opening the chat
    
    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        await deleteConversation.mutateAsync(id);
        toast({ title: "Deleted", description: "Conversation removed." });
      } catch (error) {
        toast({ title: "Error", description: "Could not delete chat.", variant: "destructive" });
      }
    }
  };
  
  const renderGroup = (title: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-4">
        <p className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <div className="space-y-1">
          {items.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "group relative flex items-center rounded-lg transition-colors pr-2",
                activeConversationId === conv.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <button
                onClick={() => onSelectConversation(conv.id)}
                className="flex-1 flex items-center gap-3 px-3 py-2 text-left text-sm truncate"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate">{conv.title}</span>
              </button>
              
              {/* Delete Button - Only visible on hover */}
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all"
                title="Delete Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col bg-slate-50 border-r border-border">
      <div className="p-3 border-b border-border">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onNewChat}
        >
          <SquarePen className="w-4 h-4" />
          New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1 px-2 py-3">
        {renderGroup("Today", grouped.today)}
        {renderGroup("Yesterday", grouped.yesterday)}
        {renderGroup("Previous 7 Days", grouped.lastWeek)}
        {renderGroup("Older", grouped.older)}
        
        {conversations.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No conversations yet
          </p>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
