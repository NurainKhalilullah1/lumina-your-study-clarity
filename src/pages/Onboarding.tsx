import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, createProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, UserPlus } from "lucide-react";
import { motion } from "framer-motion";

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading, refetch } = useProfile(user?.id);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Redirect if profile already exists
  useEffect(() => {
    if (!profileLoading && profile) {
      navigate("/dashboard", { replace: true });
    }
  }, [profileLoading, profile, navigate]);

  const handleCompleteSignup = async () => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      await createProfile(
        user.id,
        user.email,
        user.user_metadata?.full_name || user.user_metadata?.name,
        user.user_metadata?.avatar_url
      );
      
      toast({
        title: "Welcome to StudyFlow!",
        description: "Your account has been created successfully.",
      });
      
      await refetch();
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Error creating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Show loading while checking auth or profile
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Complete Your Signup
            </h1>
            <p className="text-muted-foreground">
              We couldn't find an existing StudyFlow account for this login. 
              Click below to create your account and get started.
            </p>
          </div>

          {user && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Signing up as</p>
              <p className="font-medium text-foreground">{user.email}</p>
            </div>
          )}

          <Button
            onClick={handleCompleteSignup}
            disabled={isCreating}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Complete Signup
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
