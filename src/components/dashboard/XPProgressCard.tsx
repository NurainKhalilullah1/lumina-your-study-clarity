import { motion } from "framer-motion";
import { Star, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useGamification } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";

export const XPProgressCard = () => {
  const { levelInfo, xpBreakdown, streakDays, isLoading } = useGamification();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-5 shadow-sm border border-border h-full">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border h-full relative overflow-hidden">
      {/* Subtle gradient glow */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 blur-2xl" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Star className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Level {levelInfo.level}</span>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {levelInfo.title}
        </span>
      </div>

      <motion.p
        className="text-3xl font-bold text-foreground mb-1"
        key={xpBreakdown.totalXP}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {xpBreakdown.totalXP.toLocaleString()} <span className="text-lg font-medium text-muted-foreground">XP</span>
      </motion.p>

      <div className="mb-2">
        <Progress value={levelInfo.progress} className="h-2.5" />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{levelInfo.xpForNextLevel - levelInfo.currentXP} XP to Level {levelInfo.level + 1}</span>
        {streakDays > 0 && (
          <span className="flex items-center gap-1 text-primary font-medium">
            <Zap className="w-3 h-3" /> {streakDays} day streak
          </span>
        )}
      </div>
    </div>
  );
};
