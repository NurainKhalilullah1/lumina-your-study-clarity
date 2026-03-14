import { useState, useEffect, ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudyFlowLogo } from "@/components/StudyFlowLogo";
import { Browser } from "@capacitor/browser";

interface AppUpdateGuardProps {
  children: ReactNode;
}

export const AppUpdateGuard = ({ children }: AppUpdateGuardProps) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isMandatory, setIsMandatory] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkForUpdates = async () => {
      if (!Capacitor.isNativePlatform()) {
        setChecking(false);
        return;
      }

      try {
        const appInfo = await CapacitorApp.getInfo();
        // Fallback to 1 if build is missing or non-numeric
        const currentVersionCode = parseInt(appInfo.build, 10) || 1;

        const { data, error } = await supabase
          .from("app_versions")
          .select("*")
          .order("version_code", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error("Error checking for updates:", error);
          setChecking(false);
          return;
        }

        if (data && data.version_code > currentVersionCode) {
          setUpdateAvailable(true);
          setIsMandatory(data.is_mandatory);
          setReleaseNotes(data.release_notes || "Bug fixes and improvements.");
          setDownloadUrl(data.download_url);
        }
      } catch (err) {
        console.error("Failed to check app version", err);
      } finally {
        setChecking(false);
      }
    };

    checkForUpdates();
  }, []);

  const handleUpdate = async () => {
    if (downloadUrl) {
      // Opening in an external browser is safest for downloading APKs on Android
      await Browser.open({ url: downloadUrl, windowName: "_system" });
    }
  };

  if (checking) {
    return <>{children}</>;
  }

  // Full screen blocking UI for mandatory update (or if we just want to force it to be full screen regardless based on UX rules)
  if (updateAvailable && isMandatory) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 text-center">
        <StudyFlowLogo size="xl" variant="purple" className="mb-8" />
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Download className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Update Required</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          A new version of StudyFlow is available. Please update to continue using the app.
        </p>
        <div className="bg-card border rounded-xl p-4 mb-8 w-full max-w-sm text-left shadow-sm">
          <h3 className="font-semibold text-sm mb-2 text-foreground">What's New:</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{releaseNotes}</p>
        </div>
        <Button size="lg" className="w-full max-w-sm" onClick={handleUpdate}>
          Download Update
        </Button>
      </div>
    );
  }

  return (
    <>
      {children}
      {/* Non-mandatory update popup bottom overlay */}
      {updateAvailable && !isMandatory && (
        <div className="fixed bottom-4 left-4 right-4 z-[99] bg-card border border-primary/20 rounded-2xl p-4 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex-shrink-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="font-semibold text-sm">Update Available</h4>
            <p className="text-xs text-muted-foreground truncate">{releaseNotes}</p>
          </div>
          <Button size="sm" onClick={handleUpdate}>
            Update
          </Button>
          <button 
            onClick={() => setUpdateAvailable(false)}
            className="text-muted-foreground hover:text-foreground p-2 -mr-2"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};
