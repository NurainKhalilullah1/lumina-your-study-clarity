import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PartyPopper, Sparkles, Loader2, User } from "lucide-react"; // Changed icon to PartyPopper
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Onboarding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Check Auth & Pre-fill Name (if Google provided it)
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user, loading, navigate]);

  // 2. Create Profile in Database
  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);

    try {
      // Create/Update the profile row
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: fullName,
        username: user.email?.split("@")[0],
        avatar_url: user.user_metadata?.avatar_url || "",
      });

      if (error) throw error;

      toast({
        title: "All set!",
        description: "Welcome to your new dashboard.",
      });

      // Send to Dashboard
      navigate("/dashboard", { replace: true });

    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: "Could not set up profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          {/* Header - Friendly Welcome Message */}
          <div className="bg-primary/5 p-8 text-center border-b border-border/50">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to Lumina!</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Let's set up your profile so you can start planning your success.
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleCompleteSignup} className="space-y-6">
              
              {/* Email Display (Read-Only) */}
              <div className="p-3 bg-muted/50 rounded-lg border border-border flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border">
                    <User className="w-4 h-4 text-muted-foreground" />
                 </div>
                 <div className="overflow-hidden">
                   <p className="text-xs text-muted-foreground font-medium uppercase">Signed in as</p>
                   <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                 </div>
              </div>

              {/* Name Input - Crucial for Email Signups */}
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Alex Student"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 bg-background"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base" 
                disabled={isSubmitting || !fullName.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get Started
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
