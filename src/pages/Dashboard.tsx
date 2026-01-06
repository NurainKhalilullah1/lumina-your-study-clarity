import { motion } from "framer-motion";
import { Sparkles, FolderOpen, MessageCircle, Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center gap-2 group">
              <Sparkles className="w-6 h-6 text-primary transition-transform group-hover:scale-110" />
              <span className="text-lg font-bold text-foreground">Lumina</span>
            </a>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Student</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/auth")}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Lumina 👋</h1>
          <p className="text-muted-foreground mb-8">Your academic command center awaits.</p>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">The Vault</h3>
              <p className="text-sm text-muted-foreground">Upload and organize your course materials.</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card rounded-2xl p-6 border border-border hover:border-accent/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mb-4 group-hover:bg-accent/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Tutor</h3>
              <p className="text-sm text-muted-foreground">Ask questions about your lecture slides.</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Deadline Radar</h3>
              <p className="text-sm text-muted-foreground">Track and manage your upcoming assignments.</p>
            </motion.div>
          </div>

          {/* Placeholder Content */}
          <div className="bg-muted/50 rounded-2xl p-12 border border-dashed border-border text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Your Dashboard is Ready</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enable Lovable Cloud to unlock full authentication and start building your personalized academic workspace.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
