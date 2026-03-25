import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const location = useLocation();
  const { toast } = useToast();
  const [hasShownToast, setHasShownToast] = useState(false);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while checking profile
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Authenticated but no profile - redirect to onboarding
  if (!profile) {
    return <Navigate to="/onboarding" replace />;
  }

  const isMissingInfo = !profile.university || !profile.course_of_study || !profile.level;

  if (isMissingInfo && location.pathname !== "/settings" && location.pathname !== "/onboarding") {
    // We use a timeout to avoid setting state during render
    setTimeout(() => {
      if (!hasShownToast) {
        toast({
          title: "Profile Incomplete",
          description: "Please update your University, Course, and Level to continue.",
          variant: "destructive",
          duration: 5000,
        });
        setHasShownToast(true);
      }
    }, 0);
    return <Navigate to="/settings" replace state={{ fromMissingProfile: true }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
