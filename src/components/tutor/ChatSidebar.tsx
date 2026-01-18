import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  className?: string; // Support for mobile drawer
}

export const ChatSidebar = ({ currentSessionId, onSelectSession, onNewChat, className }: ChatSidebarProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setSessions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [currentSessionId]); // Refetch when session changes (e.g. title update)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent clicking the chat itself
    
    const { error } = await supabase.from('chat_sessions').delete().eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Could not delete chat.", variant: "destructive" });
    } else {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) onNewChat();
      toast({ title: "Deleted", description: "Chat history removed." });
    }
  };

  return (
    <div className={cn("flex flex-col h-full border-r bg-muted/10 w-64", className)}>
      <div className="p-4 border-b">
        <Button onClick={onNewChat} className="w-full gap-2" variant="default">
          <Plus className="w-4 h-4" /> New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin w-5 h-5 opacity-50"/></div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  "group flex items-center justify-between p-3 text-sm rounded-lg cursor-pointer transition-colors hover:bg-muted",
                  currentSessionId === session.id ? "bg-muted font-medium text-primary" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate">{session.title}</span>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                  onClick={(e) => handleDelete(e, session.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
