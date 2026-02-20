import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type StudyEventType = 'pomodoro_completed' | 'flashcard_reviewed' | 'document_analyzed';

export interface StudyEvent {
  id: string;
  user_id: string;
  event_type: StudyEventType;
  metadata: Record<string, any>;
  created_at: string;
}

export interface StudyStats {
  pomodoroCompleted: number;
  flashcardsReviewed: number;
  documentsAnalyzed: number;
  totalStudyMinutes: number;
  streakDays: number;
  todayEvents: number;
  weeklyEvents: StudyEvent[];
}

export const useStudyEvents = (userId: string | undefined, days: number = 7) => {
  return useQuery({
    queryKey: ['study-events', userId, days],
    queryFn: async () => {
      if (!userId) return [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('study_events')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StudyEvent[];
    },
    enabled: !!userId,
  });
};

export const useStudyStats = (userId: string | undefined) => {
  const { data: events, isLoading } = useStudyEvents(userId, 30);
  
  const stats: StudyStats = {
    pomodoroCompleted: 0,
    flashcardsReviewed: 0,
    documentsAnalyzed: 0,
    totalStudyMinutes: 0,
    streakDays: 0,
    todayEvents: 0,
    weeklyEvents: [],
  };

  if (!events) return { stats, isLoading };

  const today = new Date().toDateString();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  events.forEach(event => {
    const eventDate = new Date(event.created_at);
    
    // Count by type
    switch (event.event_type) {
      case 'pomodoro_completed':
        stats.pomodoroCompleted++;
        stats.totalStudyMinutes += (event.metadata?.duration || 25);
        break;
      case 'flashcard_reviewed':
        stats.flashcardsReviewed++;
        break;
      case 'document_analyzed':
        stats.documentsAnalyzed++;
        break;
    }

    // Today's events
    if (eventDate.toDateString() === today) {
      stats.todayEvents++;
    }

    // Weekly events
    if (eventDate >= weekAgo) {
      stats.weeklyEvents.push(event);
    }
  });

  // Calculate streak (consecutive days with activity)
  const uniqueDays = new Set(
    events.map(e => new Date(e.created_at).toDateString())
  );
  
  let streak = 0;
  const checkDate = new Date();
  while (uniqueDays.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  stats.streakDays = streak;

  return { stats, isLoading };
};

export const useTrackStudyEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      eventType, 
      metadata = {} 
    }: { 
      userId: string; 
      eventType: StudyEventType; 
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('study_events')
        .insert({
          user_id: userId,
          event_type: eventType,
          metadata,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-events'] });
      queryClient.invalidateQueries({ queryKey: ['goal-progress'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-events'] });
    },
  });
};
