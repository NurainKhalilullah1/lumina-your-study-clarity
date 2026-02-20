import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  calculateXPFromEvents,
  checkAchievements,
  calculateStreakDays,
  getLevelFromXP,
  getCurrentWeekStart,
  ACHIEVEMENTS,
  type StudyEventData,
  type QuizSessionData,
  type QuizQuestionData,
  type LevelInfo,
  type XPBreakdown,
} from '@/lib/gamification';

interface StoredAchievement {
  id: string;
  unlockedAt: string;
}

interface UserXPRow {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  achievements: StoredAchievement[];
  display_name: string | null;
  last_calculated_at: string;
  current_league: number;
  weekly_xp: number;
  week_start: string;
}

export function useGamification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const previousLevelRef = useRef<number | null>(null);
  const previousAchievementsRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  // Fetch study events (90 days)
  const { data: studyEvents } = useQuery({
    queryKey: ['gamification-events', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      const { data, error } = await supabase
        .from('study_events')
        .select('event_type, created_at, metadata')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as StudyEventData[];
    },
    enabled: !!user,
    staleTime: 0,
  });

  // Fetch quiz sessions
  const { data: quizSessions } = useQuery({
    queryKey: ['gamification-quizzes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select('id, score, total_questions, completed_at, document_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as QuizSessionData[];
    },
    enabled: !!user,
    staleTime: 0,
  });

  // Fetch quiz questions for correct answer counting
  const { data: quizQuestions } = useQuery({
    queryKey: ['gamification-questions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('quiz_session_id, user_answer, correct_answer');
      if (error) throw error;
      return (data || []) as QuizQuestionData[];
    },
    enabled: !!user,
    staleTime: 0,
  });

  // Fetch stored user_xp
  const { data: storedXP, isLoading: isLoadingXP } = useQuery({
    queryKey: ['user-xp', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as UserXPRow | null;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Compute current state
  const events = studyEvents || [];
  const quizzes = quizSessions || [];
  const questions = quizQuestions || [];
  const streakDays = calculateStreakDays(events);
  const xpBreakdown = calculateXPFromEvents(events, quizzes, questions, streakDays);
  const levelInfo = getLevelFromXP(xpBreakdown.totalXP);
  const earnedAchievementIds = checkAchievements(events, quizzes, questions, streakDays);

  // Add scholar achievement if level >= 5
  if (levelInfo.level >= 5 && !earnedAchievementIds.includes('scholar')) {
    earnedAchievementIds.push('scholar');
  }

  // Compute weekly XP from events this week
  const weekStart = getCurrentWeekStart();
  const weeklyEvents = events.filter(e => new Date(e.created_at) >= weekStart);
  const weeklyQuizzes = quizzes.filter(q => q.completed_at && new Date(q.completed_at) >= weekStart);
  const weeklyXPBreakdown = calculateXPFromEvents(weeklyEvents, weeklyQuizzes, questions, 0);
  const weeklyXP = weeklyXPBreakdown.totalXP;

  // Current league from DB (default 2)
  const currentLeague = storedXP?.current_league ?? 2;

  // Check if DB week_start is stale
  const dbWeekStart = storedXP?.week_start ? new Date(storedXP.week_start) : null;
  const isStaleWeek = dbWeekStart ? dbWeekStart.getTime() < weekStart.getTime() : false;

  // Sync to database and show notifications
  useEffect(() => {
    if (!user || !studyEvents || !quizSessions) return;

    const syncXP = async () => {
      const storedAchievements: StoredAchievement[] = (storedXP?.achievements as StoredAchievement[]) || [];
      const storedAchievementIds = new Set(storedAchievements.map(a => a.id));

      // Detect new achievements
      const newAchievementIds = earnedAchievementIds.filter(id => !storedAchievementIds.has(id));

      // Only notify after first load
      if (hasInitializedRef.current) {
        if (previousLevelRef.current !== null && levelInfo.level > previousLevelRef.current) {
          toast({
            title: `🎉 Level Up! Level ${levelInfo.level}`,
            description: `You are now a ${levelInfo.title}!`,
          });
        }

        newAchievementIds.forEach(id => {
          const achievement = ACHIEVEMENTS.find(a => a.id === id);
          if (achievement) {
            toast({
              title: `🏆 Achievement Unlocked!`,
              description: `${achievement.icon} ${achievement.name} — +${achievement.bonusXP} XP`,
            });
          }
        });
      }

      previousLevelRef.current = levelInfo.level;
      previousAchievementsRef.current = new Set(earnedAchievementIds);
      hasInitializedRef.current = true;

      const weekStartStr = weekStart.toISOString().split('T')[0];

      const needsUpdate =
        !storedXP ||
        storedXP.total_xp !== xpBreakdown.totalXP ||
        storedXP.level !== levelInfo.level ||
        newAchievementIds.length > 0 ||
        (storedXP.weekly_xp ?? 0) !== weeklyXP ||
        isStaleWeek;

      if (!needsUpdate) return;

      const allAchievements: StoredAchievement[] = earnedAchievementIds.map(id => {
        const existing = storedAchievements.find(a => a.id === id);
        return existing || { id, unlockedAt: new Date().toISOString() };
      });

      const payload = {
        user_id: user.id,
        total_xp: xpBreakdown.totalXP,
        level: levelInfo.level,
        achievements: allAchievements as unknown as Record<string, unknown>[],
        last_calculated_at: new Date().toISOString(),
        weekly_xp: weeklyXP,
        week_start: weekStartStr,
      } as any;

      if (storedXP) {
        await supabase.from('user_xp').update(payload).eq('user_id', user.id);
      } else {
        payload.current_league = 2;
        await supabase.from('user_xp').insert(payload);
      }

      queryClient.invalidateQueries({ queryKey: ['user-xp'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    };

    syncXP();
  }, [user, studyEvents, quizSessions, xpBreakdown.totalXP, weeklyXP]);

  return {
    levelInfo,
    xpBreakdown,
    earnedAchievementIds,
    streakDays,
    weeklyXP,
    currentLeague,
    isLoading: isLoadingXP || !studyEvents || !quizSessions,
  };
}
