import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserPreferences {
  default_quiz_questions: number;
  pomodoro_duration: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  default_quiz_questions: 10,
  pomodoro_duration: 25,
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_preferences" as any)
          .select("default_quiz_questions, pomodoro_duration")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const loaded: UserPreferences = {
            default_quiz_questions: (data as any).default_quiz_questions,
            pomodoro_duration: (data as any).pomodoro_duration,
          };
          setPreferences(loaded);
          setOriginalPreferences(loaded);
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Track changes
  useEffect(() => {
    const changed =
      preferences.default_quiz_questions !== originalPreferences.default_quiz_questions ||
      preferences.pomodoro_duration !== originalPreferences.pomodoro_duration;
    setHasChanges(changed);
  }, [preferences, originalPreferences]);

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await (supabase as any)
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            default_quiz_questions: preferences.default_quiz_questions,
            pomodoro_duration: preferences.pomodoro_duration,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      setOriginalPreferences(preferences);
      setHasChanges(false);
      toast({
        title: "Preferences Saved",
        description: "Your study preferences have been updated.",
      });
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    loading,
    saving,
    hasChanges,
    updatePreference,
    savePreferences,
  };
};
