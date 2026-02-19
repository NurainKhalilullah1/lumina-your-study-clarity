import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useTrackStudyEvent } from '@/hooks/useStudyStats';
import { toast } from 'sonner';

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

interface PomodoroContextType {
  timeRemaining: number;
  isRunning: boolean;
  mode: TimerMode;
  completedSessions: number;
  formattedTime: string;
  progress: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const trackEvent = useTrackStudyEvent();
  
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_SETTINGS.workDuration * 60);
  // Timer must only start via manual user action - never auto-start
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1sbJu6xbe0qrS+09jU1tjg5u7x7fD0+P38+fr5+fn5+fv6+vr7+/v8/Pz8/f39/f39/f7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/f39/f39/f38/Pz8+/v7+/r6+vr5+fn5+Pj4+Pf39/f29vb19fX09PTz8/Py8vLx8fHw8PDv7+/u7u7t7e3s7Ozr6+vq6urp6eno6Ojn5+fm5ubl5eXk5OTj4+Pi4uLh4eHg4ODf39/e3t7d3d3c3Nzb29va2trZ2dnY2NjX19fW1tbV1dXU1NTT09PS0tLR0dHQ0NDPz8/Ozs7Nzc3MzMzLy8vKysrJycnIyMjHx8fGxsbFxcXExMTDw8PCwsLBwcHAwMC/v7++vr69vb28vLy7u7u6urq5ubm4uLi3t7e2tra1tbW0tLSzs7OysrKxsbGwsLCvr6+urq6tra2srKyrq6uqqqqpqamoqKinp6empqalpaWkpKSjo6OioqKhoaGgoKCfn5+enp6dnZ2cnJybm5uampqZmZmYmJiXl5eWlpaVlZWUlJSTk5OSkpKRkZGQkJCPj4+Ojo6NjY2MjIyLi4uKioqJiYmIiIiHh4eGhoaFhYWEhISCgoKBgYGAgIB/f39+fn59fX18fHx7e3t6enp5eXl4eHh3d3d2dnZ1dXV0dHRzc3NycnJxcXFwcHBvb29ubm5tbW1sbGxra2tqamppaWloaGhnZ2dmZmZlZWVkZGRjY2NiYmJhYWFgYGBfX19eXl5dXV1cXFxbW1taWlpZWVlYWFhXV1dWVlZVVVVUVFRTU1NSUlJRUVFQUFBPT09OTk5NTU1MTExLS0tKSkpJSUlISEhHR0dGRkZFRUVERERDQ0NCQkJBQUFAQEA/Pz8+Pj49PT08PDw7Ozs6Ojo5OTk4ODg3Nzc2NjY1NTU0NDQzMzMyMjIxMTEwMDAvLy8uLi4tLS0sLCwrKysqKioo');
  }, []);

  const getDurationForMode = useCallback((targetMode: TimerMode) => {
    switch (targetMode) {
      case 'work':
        return DEFAULT_SETTINGS.workDuration * 60;
      case 'shortBreak':
        return DEFAULT_SETTINGS.shortBreakDuration * 60;
      case 'longBreak':
        return DEFAULT_SETTINGS.longBreakDuration * 60;
    }
  }, []);

  const playNotification = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = mode === 'work' ? '⏰ Break Time!' : '📚 Time to Study!';
      const body = mode === 'work' 
        ? 'Great work! Take a well-deserved break.' 
        : 'Break is over. Let\'s get back to studying!';
      new Notification(title, { body, icon: '/favicon.png' });
    }
  }, [mode]);

  const start = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setTimeRemaining(getDurationForMode(mode));
    setIsRunning(false);
  }, [getDurationForMode, mode]);

  const skip = useCallback(() => {
    let newMode: TimerMode;
    let newCompletedSessions = completedSessions;

    if (mode === 'work') {
      newCompletedSessions += 1;
      newMode = newCompletedSessions % DEFAULT_SETTINGS.sessionsBeforeLongBreak === 0 
        ? 'longBreak' 
        : 'shortBreak';
    } else {
      newMode = 'work';
    }

    setMode(newMode);
    setTimeRemaining(getDurationForMode(newMode));
    setIsRunning(false);
    setCompletedSessions(newCompletedSessions);
  }, [completedSessions, getDurationForMode, mode]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          playNotification();
          
          let newMode: TimerMode;
          let newCompletedSessions = completedSessions;

          if (mode === 'work') {
            newCompletedSessions = completedSessions + 1;
            setCompletedSessions(newCompletedSessions);
            
            // Track study event
            if (user) {
              trackEvent.mutate({
                userId: user.id,
                eventType: 'pomodoro_completed',
                metadata: { duration: DEFAULT_SETTINGS.workDuration }
              });
              toast.success("Pomodoro session completed! 🍅");
            }
            
            newMode = newCompletedSessions % DEFAULT_SETTINGS.sessionsBeforeLongBreak === 0 
              ? 'longBreak' 
              : 'shortBreak';
          } else {
            newMode = 'work';
          }

          setMode(newMode);
          setIsRunning(false);
          return getDurationForMode(newMode);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, completedSessions, getDurationForMode, mode, playNotification, trackEvent, user]);

  // Reset on logout
  useEffect(() => {
    if (!user) {
      setIsRunning(false);
      setTimeRemaining(DEFAULT_SETTINGS.workDuration * 60);
      setMode('work');
      setCompletedSessions(0);
    }
  }, [user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - (timeRemaining / getDurationForMode(mode));

  const value: PomodoroContextType = {
    timeRemaining,
    isRunning,
    mode,
    completedSessions,
    formattedTime: formatTime(timeRemaining),
    progress,
    start,
    pause,
    reset,
    skip,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};
