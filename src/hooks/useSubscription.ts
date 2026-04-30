import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionTier = "free" | "pro" | "premium";

export interface UpgradeRequest {
  id: string;
  user_id: string;
  requested_tier: string;
  amount: number;
  payment_reference: string | null;
  receipt_url: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const TIER_CONFIG = {
  free: {
    name: "Free",
    price: 0,
    storage: 50 * 1024 * 1024, // 50MB
    quizQuestions: 10,
    features: [
      "50MB document storage",
      "10 quiz questions per session",
      "Basic AI tutor",
      "Community access",
      "Pomodoro timer",
    ],
  },
  pro: {
    name: "Pro",
    price: 2000,
    storage: 200 * 1024 * 1024, // 200MB
    quizQuestions: 20,
    features: [
      "200MB document storage",
      "20 quiz questions per session",
      "Priority AI tutor",
      "Unlimited flashcards",
      "Advanced quiz analytics",
      "Everything in Free",
    ],
  },
  premium: {
    name: "Premium",
    price: 5000,
    storage: 300 * 1024 * 1024, // 300MB
    quizQuestions: 100,
    features: [
      "300MB document storage",
      "Unlimited quiz questions",
      "Advanced AI tutor",
      "All features unlocked",
      "Priority support",
      "Everything in Pro",
    ],
  },
} as const;

export const useSubscription = () => {
  const { user } = useAuth();

  const tierQuery = useQuery({
    queryKey: ["subscription-tier", user?.id],
    queryFn: async (): Promise<SubscriptionTier> => {
      if (!user?.id) return "free";
      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .maybeSingle();
      if (error || !data) return "free";
      return (data as any).subscription_tier as SubscriptionTier;
    },
    enabled: !!user?.id,
  });

  const requestsQuery = useQuery({
    queryKey: ["upgrade-requests", user?.id],
    queryFn: async (): Promise<UpgradeRequest[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("upgrade_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) return [];
      return (data as any[]) || [];
    },
    enabled: !!user?.id,
  });

  return {
    tier: tierQuery.data || "free",
    tierLoading: tierQuery.isLoading,
    requests: requestsQuery.data || [],
    requestsLoading: requestsQuery.isLoading,
    refetchTier: tierQuery.refetch,
    refetchRequests: requestsQuery.refetch,
  };
};

export const useIsAdmin = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async (): Promise<boolean> => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      } as any);
      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id,
  });
};
