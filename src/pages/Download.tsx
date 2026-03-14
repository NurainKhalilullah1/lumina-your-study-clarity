import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudyFlowLogo } from "@/components/StudyFlowLogo";
import { motion } from "framer-motion";

const DownloadPage = () => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestVersion = async () => {
      try {
        const { data, error } = await supabase
          .from("app_versions")
          .select("*")
          .order("version_code", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          throw error;
        }

        if (data && data.download_url) {
          setDownloadUrl(data.download_url);
          // Automatically trigger download after a short delay
          setTimeout(() => {
            window.location.href = data.download_url;
          }, 1500);
        } else {
          setError("No app releases found.");
        }
      } catch (err: any) {
        console.error("Error fetching app version:", err);
        setError("Failed to locate the latest app version.");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestVersion();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 flex flex-col items-center text-center"
      >
        <a href="/" className="mb-12 inline-flex">
          <StudyFlowLogo size="lg" variant="purple" />
        </a>

        <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
          
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Downloading StudyFlow API...
          </h1>

          {loading ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Locating the latest version...</p>
            </div>
          ) : error ? (
            <div className="py-6">
              <p className="text-destructive mb-6">{error}</p>
              <Button variant="outline" asChild>
                <a href="/">Return to Home</a>
              </Button>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-8">
                Your download should start automatically in a few seconds. If it doesn't, click the button below.
              </p>
              
              <Button asChild size="lg" className="w-full mb-4">
                <a href={downloadUrl || "#"} download>
                  Download APK Manually
                </a>
              </Button>
            </div>
          )}
        </div>

        <a href="/" className="mt-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to website
        </a>
      </motion.div>
    </div>
  );
};

export default DownloadPage;
