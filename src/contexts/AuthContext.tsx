import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialValidationDone = false;
    // Initialize Native Google Auth
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize();
    }

    // Validate session with server, not just local token
    supabase.auth.getUser().then(async ({ data: { user }, error }) => {
      if (error || !user) {
        // Token is invalid or user was deleted - clear local session
        // IMPORTANT: Never eagerly sign out if we're in the middle of an OAuth redirect (URL contains access_token)
        if (!window.location.hash.includes('access_token')) {
          setSession(null);
          setUser(null);
          await supabase.auth.signOut({ scope: "local" });
        }
      } else {
        // Valid user, now get the full session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      }
      initialValidationDone = true;
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Ignore INITIAL_SESSION during startup to prevent stale cached sessions
        if (event === "INITIAL_SESSION" && !initialValidationDone) {
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: Capacitor.isNativePlatform() ? 'app.lumina.studyflow://onboarding' : `${window.location.origin}/onboarding`,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      try {
        // 1. Get ID Token from Native Google Sign-In
        const googleUser = await GoogleAuth.signIn();
        
        if (!googleUser.authentication?.idToken) {
          throw new Error("No ID token returned from Google");
        }

        // 2. Pass ID Token to Supabase
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleUser.authentication.idToken,
        });
        
        return { error };
      } catch (error: any) {
        console.error("Native Google Sign-In Error:", error);
        return { error: new Error(error.message || "Native Google Sign-In failed") };
      }
    } else {
      // Web fallback
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) return { error };

      if (data?.url) {
        window.location.href = data.url;
      }
      return { error: null };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Capacitor.isNativePlatform() ? 'app.lumina.studyflow://auth' : `${window.location.origin}/auth`,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
