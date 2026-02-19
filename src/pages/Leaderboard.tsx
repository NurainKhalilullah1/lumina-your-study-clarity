import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getLevelFromXP } from "@/lib/gamification";

interface LeaderboardEntry {
  user_id: string;
  name: string;
  total_xp: number;
  level: number;
  avatar_url: string | null;
}

const Leaderboard = () => {
  const { user } = useAuth();

  const { data: entries, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leaderboard_view" as any)
        .select("*")
        .order("total_xp", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as LeaderboardEntry[];
    },
    staleTime: 30_000,
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-primary" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-accent" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-primary/5 border-primary/20";
    if (rank <= 3) return "bg-accent/5 border-accent/20";
    return "bg-card border-border";
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <Trophy className="w-7 h-7 text-primary" />
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">See how you rank against other StudyFlow learners.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-[3rem_1fr_5rem_5rem] sm:grid-cols-[3rem_1fr_6rem_6rem] items-center px-4 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>#</span>
            <span>Student</span>
            <span className="text-center">Level</span>
            <span className="text-right">XP</span>
          </div>

          {/* Rows */}
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[3rem_1fr_5rem_5rem] sm:grid-cols-[3rem_1fr_6rem_6rem] items-center px-4 py-3 border-b border-border">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-8 mx-auto" />
                  <Skeleton className="h-4 w-12 ml-auto" />
                </div>
              ))}
            </div>
          ) : entries && entries.length > 0 ? (
            <div>
              {entries.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.user_id === user?.id;
                const levelInfo = getLevelFromXP(entry.total_xp);

                return (
                  <div
                    key={entry.user_id}
                    className={`
                      grid grid-cols-[3rem_1fr_5rem_5rem] sm:grid-cols-[3rem_1fr_6rem_6rem] items-center px-4 py-3 border-b border-border transition-colors
                      ${getRankBg(rank, isCurrentUser)}
                      ${isCurrentUser ? 'font-semibold' : ''}
                    `}
                  >
                    <div className="flex items-center">{getRankIcon(rank)}</div>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm text-foreground">
                        {entry.name}
                        {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Lv.{entry.level}
                      </span>
                    </div>
                    <div className="text-right text-sm font-bold text-foreground">
                      {entry.total_xp.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No learners on the board yet. Be the first!</p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
