import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, format } from 'date-fns';

export interface WeeklyGoal {
  id: string;
  user_id: string;
  week_start: string;
  quiz_target: number;
  flashcard_target: number;
  study_minutes_target: number;
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  quizzes: { current: number; target: number; percentage: number };
  flashcards: { current: number; target: number; percentage: number };
  studyMinutes: { current: number; target: number; percentage: number };
}

// Get the start of the current week (Monday)
export const getCurrentWeekStart = () => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  return format(weekStart, 'yyyy-MM-dd');
};

export const useCurrentWeekGoals = (userId: string | undefined) => {
  const weekStart = getCurrentWeekStart();
  
  return useQuery({
    queryKey: ['weekly-goals', userId, weekStart],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle();
      
      if (error) throw error;
      return data as WeeklyGoal | null;
    },
    enabled: !!userId,
  });
};

export const useUpsertWeeklyGoals = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      quizTarget,
      flashcardTarget,
      studyMinutesTarget,
    }: {
      userId: string;
      quizTarget: number;
      flashcardTarget: number;
      studyMinutesTarget: number;
    }) => {
      const weekStart = getCurrentWeekStart();
      
      const { data, error } = await supabase
        .from('weekly_goals')
        .upsert(
          {
            user_id: userId,
            week_start: weekStart,
            quiz_target: quizTarget,
            flashcard_target: flashcardTarget,
            study_minutes_target: studyMinutesTarget,
          },
          { onConflict: 'user_id,week_start' }
        )
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-progress'] });
    },
  });
};

export const useGoalProgress = (userId: string | undefined) => {
  const weekStart = getCurrentWeekStart();
  const weekStartDate = new Date(weekStart);
  const weekEnd = new Date(weekStartDate);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  return useQuery({
    queryKey: ['goal-progress', userId, weekStart],
    queryFn: async (): Promise<GoalProgress> => {
      if (!userId) {
        return {
          quizzes: { current: 0, target: 5, percentage: 0 },
          flashcards: { current: 0, target: 50, percentage: 0 },
          studyMinutes: { current: 0, target: 300, percentage: 0 },
        };
      }
      
      // Fetch current week's goals
      const { data: goals } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle();
      
      const quizTarget = goals?.quiz_target ?? 5;
      const flashcardTarget = goals?.flashcard_target ?? 50;
      const studyMinutesTarget = goals?.study_minutes_target ?? 300;
      
      // Count completed quizzes this week
      const { count: quizCount } = await supabase
        .from('quiz_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .gte('created_at', weekStartDate.toISOString())
        .lt('created_at', weekEnd.toISOString());
      
      // Count study events this week
      const { data: events } = await supabase
        .from('study_events')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', weekStartDate.toISOString())
        .lt('created_at', weekEnd.toISOString());
      
      let flashcardCount = 0;
      let studyMinutes = 0;
      
      events?.forEach(event => {
        if (event.event_type === 'flashcard_reviewed') {
          flashcardCount++;
        }
        if (event.event_type === 'pomodoro_completed') {
          studyMinutes += (event.metadata as any)?.duration || 25;
        }
      });
      
      return {
        quizzes: {
          current: quizCount || 0,
          target: quizTarget,
          percentage: Math.min(100, Math.round(((quizCount || 0) / quizTarget) * 100)),
        },
        flashcards: {
          current: flashcardCount,
          target: flashcardTarget,
          percentage: Math.min(100, Math.round((flashcardCount / flashcardTarget) * 100)),
        },
        studyMinutes: {
          current: studyMinutes,
          target: studyMinutesTarget,
          percentage: Math.min(100, Math.round((studyMinutes / studyMinutesTarget) * 100)),
        },
      };
    },
    enabled: !!userId,
  });
};
