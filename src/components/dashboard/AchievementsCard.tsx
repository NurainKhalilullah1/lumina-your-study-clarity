import { ACHIEVEMENTS } from "@/lib/gamification";
import { useGamification } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy } from "lucide-react";

export const AchievementsCard = () => {
  const { earnedAchievementIds, isLoading } = useGamification();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const earnedSet = new Set(earnedAchievementIds);
  const unlockedCount = earnedAchievementIds.length;

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Achievements</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {unlockedCount}/{ACHIEVEMENTS.length} unlocked
        </span>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-3">
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = earnedSet.has(achievement.id);
          return (
            <Tooltip key={achievement.id}>
              <TooltipTrigger asChild>
                <div
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-lg text-xl cursor-default transition-all
                    ${isUnlocked
                      ? 'bg-primary/10 border border-primary/20 shadow-sm'
                      : 'bg-muted/50 border border-border grayscale opacity-40'
                    }
                  `}
                >
                  {achievement.icon}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="font-semibold">{achievement.name}</p>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
                <p className="text-xs text-primary mt-1">+{achievement.bonusXP} XP</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
