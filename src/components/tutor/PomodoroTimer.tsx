import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Timer, Play, Pause, RotateCcw, SkipForward, Coffee, BookOpen } from "lucide-react";
import { usePomodoroTimer, TimerMode } from "@/hooks/usePomodoroTimer";
import { cn } from "@/lib/utils";

const modeConfig: Record<TimerMode, { label: string; icon: React.ElementType; color: string }> = {
  work: { label: 'Focus', icon: BookOpen, color: 'text-primary' },
  shortBreak: { label: 'Short Break', icon: Coffee, color: 'text-green-500' },
  longBreak: { label: 'Long Break', icon: Coffee, color: 'text-blue-500' },
};

export const PomodoroTimer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const timer = usePomodoroTimer();
  
  const currentModeConfig = modeConfig[timer.mode];
  const ModeIcon = currentModeConfig.icon;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "gap-2 font-mono text-sm",
            timer.isRunning && "animate-pulse"
          )}
        >
          <Timer className={cn("h-4 w-4", timer.isRunning && currentModeConfig.color)} />
          <span className={cn(timer.isRunning && currentModeConfig.color)}>
            {timer.formattedTime}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          {/* Mode indicator */}
          <div className="flex items-center justify-center gap-2">
            <ModeIcon className={cn("h-5 w-5", currentModeConfig.color)} />
            <span className={cn("font-medium", currentModeConfig.color)}>
              {currentModeConfig.label}
            </span>
          </div>

          {/* Timer display */}
          <div className="relative flex items-center justify-center">
            {/* Progress ring */}
            <svg className="w-32 h-32 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={2 * Math.PI * 56}
                strokeDashoffset={2 * Math.PI * 56 * (1 - timer.progress)}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-1000",
                  timer.mode === 'work' ? "text-primary" : 
                  timer.mode === 'shortBreak' ? "text-green-500" : "text-blue-500"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold font-mono">
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
              className="h-10 w-10"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              size="icon"
              onClick={timer.isRunning ? timer.pause : timer.start}
              className={cn(
                "h-12 w-12 rounded-full",
                timer.mode === 'work' ? "gradient-primary" : 
                timer.mode === 'shortBreak' ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
              )}
            >
              {timer.isRunning ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={timer.skip}
              className="h-10 w-10"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Session counter */}
          <div className="text-center text-sm text-muted-foreground">
            Session {timer.completedSessions + 1} • {timer.completedSessions} completed
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span>🍅 25 min focus</span>
            <span>☕ 5 min break</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
