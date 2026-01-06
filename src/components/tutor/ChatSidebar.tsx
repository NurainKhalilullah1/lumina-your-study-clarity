import { format, isToday, isYesterday, isWithinInterval, subDays } from "date-fns";
import { SquarePen, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Conversation, useDeleteConversation } from "@/hooks/useConversations";

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
  const grouped = groupConversationsByDate(conversations);
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation.mutate(id);
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
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors group",
                activeConversationId === conv.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </button>
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
