import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Trash2, Loader2, LogOut, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  className?: string;
  refreshTrigger?: number;
}

export const ChatSidebar = ({ currentSessionId, onSelectSession, onNewChat, className, refreshTrigger = 0 }: ChatSidebarProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const { signOut } = useAuth();

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

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;
    const id = chatToDelete;

    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) onNewChat();
    setChatToDelete(null);

    const { error } = await supabase.from('chat_sessions').delete().eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Could not delete chat.", variant: "destructive" });
      fetchSessions();
    } else {
      toast({ title: "Deleted", description: "Chat removed." });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;
      await signOut();
      toast({ title: "Account Deleted", description: "Your data has been wiped." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className={cn("flex flex-col h-full border-r bg-muted/10 w-64", className)}>
      <div className="p-4 border-b space-y-2">
        <Button onClick={onNewChat} className="w-full gap-2 shadow-sm" variant="default">
          <Plus className="w-4 h-4" /> New Chat
        </Button>
      </div>

      <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        History
      </div>

      <ScrollArea className="flex-1 px-3">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin w-5 h-5 opacity-50"/></div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  // FLEX LAYOUT: Ensures items sit side-by-side
                  "flex items-center justify-between p-2 text-sm rounded-md cursor-pointer transition-all border border-transparent hover:bg-white hover:shadow-sm",
                  currentSessionId === session.id ? "bg-white shadow-sm border-border font-medium text-primary" : "text-muted-foreground"
                )}
              >
                {/* 1. TEXT CONTAINER: min-w-0 allows it to shrink below its content size */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="truncate">{session.title}</span>
                </div>
                
                {/* 2. DELETE BUTTON: shrink-0 prevents it from disappearing */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50 shrink-0 ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatToDelete(session.id);
                  }}
                  title="Delete Chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            {sessions.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8">
                No chats yet.
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-background/50 space-y-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2">
              <UserX className="w-4 h-4 mr-2" /> Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account and all chat history. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-500 hover:bg-red-600">
                Delete My Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="ghost" className="w-full justify-start text-muted-foreground h-8 px-2" onClick={() => signOut()}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      <AlertDialog open={!!chatToDelete} onOpenChange={() => setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This conversation will be removed from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChat} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
