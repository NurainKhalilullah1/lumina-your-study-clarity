import { useState } from "react";
import { Target, Trophy, BookOpen, Clock, Settings2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentWeekGoals, useGoalProgress, useUpsertWeeklyGoals } from "@/hooks/useWeeklyGoals";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface GoalItemProps {
  icon: React.ElementType;
  label: string;
  current: number;
  target: number;
  percentage: number;
  unit?: string;
  color: string;
}

const GoalItem = ({ icon: Icon, label, current, target, percentage, unit = "", color }: GoalItemProps) => {
  const isComplete = percentage >= 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", color)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {current}{unit} / {target}{unit}
          </span>
          {isComplete && <Check className="w-4 h-4 text-emerald-500" />}
        </div>
      </div>
      <Progress 
        value={percentage} 
        className={cn("h-2", isComplete && "[&>div]:bg-emerald-500")}
      />
    </div>
  );
};

export const WeeklyGoals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: currentGoals, isLoading: goalsLoading } = useCurrentWeekGoals(user?.id);
  const { data: progress, isLoading: progressLoading } = useGoalProgress(user?.id);
  const upsertGoals = useUpsertWeeklyGoals();
  
  const [quizTarget, setQuizTarget] = useState(5);
  const [flashcardTarget, setFlashcardTarget] = useState(50);
  const [studyHoursTarget, setStudyHoursTarget] = useState(5);
  
  const isLoading = goalsLoading || progressLoading;
  
  // Sync form with current goals when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && currentGoals) {
      setQuizTarget(currentGoals.quiz_target);
      setFlashcardTarget(currentGoals.flashcard_target);
      setStudyHoursTarget(Math.round(currentGoals.study_minutes_target / 60));
    } else if (open) {
      // Default values
      setQuizTarget(5);
      setFlashcardTarget(50);
      setStudyHoursTarget(5);
    }
    setIsOpen(open);
  };
  
  const handleSaveGoals = async () => {
    if (!user) return;
    
    try {
      await upsertGoals.mutateAsync({
        userId: user.id,
        quizTarget,
        flashcardTarget,
        studyMinutesTarget: studyHoursTarget * 60,
      });
      
      toast({
        title: "Goals updated",
        description: "Your weekly targets have been saved.",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save goals. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Calculate overall progress
  const overallProgress = progress
    ? Math.round((progress.quizzes.percentage + progress.flashcards.percentage + progress.studyMinutes.percentage) / 3)
    : 0;
  
  const goalsCompleted = progress
    ? [progress.quizzes, progress.flashcards, progress.studyMinutes].filter(g => g.percentage >= 100).length
    : 0;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Weekly Goals</CardTitle>
          </div>
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Weekly Goals</DialogTitle>
                <DialogDescription>
                  Define your study targets for this week. Goals reset every Monday.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="quiz-target" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Quizzes to complete
                  </Label>
                  <Input
                    id="quiz-target"
                    type="number"
                    min={1}
                    max={50}
                    value={quizTarget}
                    onChange={(e) => setQuizTarget(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flashcard-target" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    Flashcards to review
                  </Label>
                  <Input
                    id="flashcard-target"
                    type="number"
                    min={1}
                    max={500}
                    value={flashcardTarget}
                    onChange={(e) => setFlashcardTarget(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="study-target" className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    Study hours (Pomodoro)
                  </Label>
                  <Input
                    id="study-target"
                    type="number"
                    min={1}
                    max={40}
                    value={studyHoursTarget}
                    onChange={(e) => setStudyHoursTarget(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGoals} disabled={upsertGoals.isPending}>
                  {upsertGoals.isPending ? "Saving..." : "Save Goals"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Overall progress summary */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex-1">
            <Progress value={overallProgress} className="h-2" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {goalsCompleted}/3 complete
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-4">
        {progress && (
          <>
            <GoalItem
              icon={Trophy}
              label="Quizzes"
              current={progress.quizzes.current}
              target={progress.quizzes.target}
              percentage={progress.quizzes.percentage}
              color="bg-amber-500/10 text-amber-500"
            />
            <GoalItem
              icon={BookOpen}
              label="Flashcards"
              current={progress.flashcards.current}
              target={progress.flashcards.target}
              percentage={progress.flashcards.percentage}
              color="bg-blue-500/10 text-blue-500"
            />
            <GoalItem
              icon={Clock}
              label="Study Time"
              current={progress.studyMinutes.current}
              target={progress.studyMinutes.target}
              percentage={progress.studyMinutes.percentage}
              unit=" min"
              color="bg-emerald-500/10 text-emerald-500"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};
