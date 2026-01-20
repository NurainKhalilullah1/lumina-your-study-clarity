import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface GroupedSessions {
  today: ChatSession[];
  yesterday: ChatSession[];
  previous: ChatSession[];
}

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  className?: string;
  refreshTrigger?: number;
}

const groupSessionsByDate = (sessions: ChatSession[]): GroupedSessions => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  return sessions.reduce<GroupedSessions>(
    (acc, session) => {
      const sessionDate = new Date(session.created_at);
      if (sessionDate >= today) {
        acc.today.push(session);
      } else if (sessionDate >= yesterday) {
        acc.yesterday.push(session);
      } else {
        acc.previous.push(session);
      }
      return acc;
    },
    { today: [], yesterday: [], previous: [] }
  );
};

export const ChatSidebar = ({ currentSessionId, onSelectSession, onNewChat, className, refreshTrigger = 0 }: ChatSidebarProps) => {
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
  }, [currentSessionId, refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) onNewChat();

    const { error } = await supabase.from('chat_sessions').delete().eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Could not delete chat.", variant: "destructive" });
      fetchSessions();
    } else {
      toast({ title: "Deleted", description: "Chat history removed." });
    }
  };

  const grouped = groupSessionsByDate(sessions);

  const SessionItem = ({ session }: { session: ChatSession }) => (
    <div
      onClick={() => onSelectSession(session.id)}
      className={cn(
        "group flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl cursor-pointer transition-all duration-200",
        "hover:bg-primary/5 hover:shadow-sm",
        currentSessionId === session.id 
          ? "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {/* Delete button at the front */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
          "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        )}
        onClick={(e) => handleDelete(e, session.id)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>

      <MessageSquare className="w-4 h-4 shrink-0 opacity-60" />
      
      <div className="flex-1 min-w-0">
        <span className="block truncate">{session.title}</span>
        <span className="block text-[10px] text-muted-foreground/60 mt-0.5">
          {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
      {children}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h4 className="font-semibold text-foreground mb-1">No conversations yet</h4>
      <p className="text-xs text-muted-foreground">Start a new chat to begin learning!</p>
    </div>
  );

  return (
    <div className={cn("flex flex-col h-full bg-card/50 backdrop-blur-sm w-72 border-r", className)}>
      {/* Header */}
      <div className="p-4 border-b bg-background/50">
        <Button 
          onClick={onNewChat} 
          className="w-full gap-2 gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 px-2 py-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin w-5 h-5 text-primary/50"/>
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-1">
            {grouped.today.length > 0 && (
              <div className="mb-3">
                <SectionLabel>Today</SectionLabel>
                {grouped.today.map((session) => (
                  <SessionItem key={session.id} session={session} />
                ))}
              </div>
            )}

            {grouped.yesterday.length > 0 && (
              <div className="mb-3">
                <SectionLabel>Yesterday</SectionLabel>
                {grouped.yesterday.map((session) => (
                  <SessionItem key={session.id} session={session} />
                ))}
              </div>
            )}

            {grouped.previous.length > 0 && (
              <div>
                <SectionLabel>Previous</SectionLabel>
                {grouped.previous.map((session) => (
                  <SessionItem key={session.id} session={session} />
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer branding */}
      <div className="p-4 border-t bg-background/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Powered by Lumina AI</span>
        </div>
      </div>
    </div>
  );
};
