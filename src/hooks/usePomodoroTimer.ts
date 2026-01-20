import { useState, useEffect, useCallback, useRef } from 'react';

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

interface PomodoroState {
  timeRemaining: number; // in seconds
  isRunning: boolean;
  mode: TimerMode;
  completedSessions: number;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

export interface PomodoroCallbacks {
  onSessionComplete?: (duration: number) => void;
}

export const usePomodoroTimer = (settings: Partial<PomodoroSettings> = {}, callbacks?: PomodoroCallbacks) => {
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  
  const [state, setState] = useState<PomodoroState>(() => ({
    timeRemaining: mergedSettings.workDuration * 60,
    isRunning: false,
    mode: 'work',
    completedSessions: 0,
  }));

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1sbJu6xbe0qrS+09jU1tjg5u7x7fD0+P38+fr5+fn5+fv6+vr7+/v8/Pz8/f39/f39/f7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/f39/f39/f38/Pz8+/v7+/r6+vr5+fn5+Pj4+Pf39/f29vb19fX09PTz8/Py8vLx8fHw8PDv7+/u7u7t7e3s7Ozr6+vq6urp6eno6Ojn5+fm5ubl5eXk5OTj4+Pi4uLh4eHg4ODf39/e3t7d3d3c3Nzb29va2trZ2dnY2NjX19fW1tbV1dXU1NTT09PS0tLR0dHQ0NDPz8/Ozs7Nzc3MzMzLy8vKysrJycnIyMjHx8fGxsbFxcXExMTDw8PCwsLBwcHAwMC/v7++vr69vb28vLy7u7u6urq5ubm4uLi3t7e2tra1tbW0tLSzs7OysrKxsbGwsLCvr6+urq6tra2srKyrq6uqqqqpqamoqKinp6empqalpaWkpKSjo6OioqKhoaGgoKCfn5+enp6dnZ2cnJybm5uampqZmZmYmJiXl5eWlpaVlZWUlJSTk5OSkpKRkZGQkJCPj4+Ojo6NjY2MjIyLi4uKioqJiYmIiIiHh4eGhoaFhYWEhISCgoKBgYGAgIB/f39+fn59fX18fHx7e3t6enp5eXl4eHh3d3d2dnZ1dXV0dHRzc3NycnJxcXFwcHBvb29ubm5tbW1sbGxra2tqamppaWloaGhnZ2dmZmZlZWVkZGRjY2NiYmJhYWFgYGBfX19eXl5dXV1cXFxbW1taWlpZWVlYWFhXV1dWVlZVVVVUVFRTU1NSUlJRUVFQUFBPT09OTk5NTU1MTExLS0tKSkpJSUlISEhHR0dGRkZFRUVERERDQ0NCQkJBQUFAQEA/Pz8+Pj49PT08PDw7Ozs6Ojo5OTk4ODg3Nzc2NjY1NTU0NDQzMzMyMjIxMTEwMDAvLy8uLi4tLS0sLCwrKysqKioo');
  }, []);

  const getDurationForMode = useCallback((mode: TimerMode) => {
    switch (mode) {
      case 'work':
        return mergedSettings.workDuration * 60;
      case 'shortBreak':
        return mergedSettings.shortBreakDuration * 60;
      case 'longBreak':
        return mergedSettings.longBreakDuration * 60;
    }
  }, [mergedSettings]);

  const playNotification = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = state.mode === 'work' ? '⏰ Break Time!' : '📚 Time to Study!';
      const body = state.mode === 'work' 
        ? 'Great work! Take a well-deserved break.' 
        : 'Break is over. Let\'s get back to studying!';
      new Notification(title, { body, icon: '/favicon.png' });
    }
  }, [state.mode]);

  const start = useCallback(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setState(prev => ({ ...prev, isRunning: true }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      timeRemaining: getDurationForMode(prev.mode),
      isRunning: false,
    }));
  }, [getDurationForMode]);

  const skip = useCallback(() => {
    setState(prev => {
      let newMode: TimerMode;
      let newCompletedSessions = prev.completedSessions;

      if (prev.mode === 'work') {
        newCompletedSessions += 1;
        newMode = newCompletedSessions % mergedSettings.sessionsBeforeLongBreak === 0 
          ? 'longBreak' 
          : 'shortBreak';
      } else {
        newMode = 'work';
      }

      return {
        mode: newMode,
        timeRemaining: getDurationForMode(newMode),
        isRunning: false,
        completedSessions: newCompletedSessions,
      };
    });
  }, [getDurationForMode, mergedSettings.sessionsBeforeLongBreak]);

  // Timer countdown
  useEffect(() => {
    if (!state.isRunning) return;

    const interval = setInterval(() => {
      setState(prev => {
        if (prev.timeRemaining <= 1) {
          playNotification();
          
          let newMode: TimerMode;
          let newCompletedSessions = prev.completedSessions;

          if (prev.mode === 'work') {
            newCompletedSessions += 1;
            // Trigger callback when work session completes
            callbacks?.onSessionComplete?.(mergedSettings.workDuration);
            newMode = newCompletedSessions % mergedSettings.sessionsBeforeLongBreak === 0 
              ? 'longBreak' 
              : 'shortBreak';
          } else {
            newMode = 'work';
          }

          return {
            mode: newMode,
            timeRemaining: getDurationForMode(newMode),
            isRunning: false,
            completedSessions: newCompletedSessions,
          };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isRunning, getDurationForMode, mergedSettings.sessionsBeforeLongBreak, mergedSettings.workDuration, playNotification, callbacks]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - (state.timeRemaining / getDurationForMode(state.mode));

  return {
    ...state,
    formattedTime: formatTime(state.timeRemaining),
    progress,
    start,
    pause,
    reset,
    skip,
  };
};
