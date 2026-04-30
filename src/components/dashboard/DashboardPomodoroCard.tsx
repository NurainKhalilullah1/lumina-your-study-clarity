import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, SkipForward, Coffee, BookOpen, Timer } from "lucide-react";
import { usePomodoro, TimerMode } from "@/contexts/PomodoroContext";
import { cn } from "@/lib/utils";

const modeConfig: Record<TimerMode, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  work: { label: 'Focus', icon: BookOpen, color: 'text-primary', bgColor: 'bg-primary' },
  shortBreak: { label: 'Short Break', icon: Coffee, color: 'text-green-500', bgColor: 'bg-green-500' },
  longBreak: { label: 'Long Break', icon: Coffee, color: 'text-blue-500', bgColor: 'bg-blue-500' },
};

export const DashboardPomodoroCard = () => {
  const timer = usePomodoro();
  const currentModeConfig = modeConfig[timer.mode];
  const ModeIcon = currentModeConfig.icon;

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Focus Timer</h2>
      </div>

      <div className="flex flex-col items-center space-y-4">
        {/* Mode indicator */}
        <div className="flex items-center gap-2">
          <ModeIcon className={cn("h-4 w-4", currentModeConfig.color)} />
          <span className={cn("font-medium text-sm", currentModeConfig.color)}>
            {currentModeConfig.label}
          </span>
        </div>

        {/* Timer display with progress ring */}
        <div className="relative flex items-center justify-center">
          <svg className="w-28 h-28 -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-muted/30"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={2 * Math.PI * 48 * (1 - timer.progress)}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000",
                timer.mode === 'work' ? "text-primary" : 
                timer.mode === 'shortBreak' ? "text-green-500" : "text-blue-500"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn(
              "text-2xl font-bold font-mono",
              timer.isRunning && "animate-pulse"
            )}>
              {timer.formattedTime}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={timer.reset}
            className="h-9 w-9"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            size="icon"
            onClick={timer.isRunning ? timer.pause : timer.start}
            className={cn(
              "h-11 w-11 rounded-full",
              timer.mode === 'work' ? "bg-primary hover:bg-primary/90" : 
              timer.mode === 'shortBreak' ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
            )}
          >
            {timer.isRunning ? (
              <Pause className="h-5 w-5 text-primary-foreground" />
            ) : (
              <Play className="h-5 w-5 ml-0.5 text-primary-foreground" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={timer.skip}
            className="h-9 w-9"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Session counter */}
        <div className="text-center text-xs text-muted-foreground">
          Session {timer.completedSessions + 1} • {timer.completedSessions} completed
        </div>
      </div>
    </div>
  );
};
