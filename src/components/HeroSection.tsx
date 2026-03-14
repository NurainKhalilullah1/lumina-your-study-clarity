import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom"; // <--- Added Import

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-24 pb-16 overflow-hidden bg-glow">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Student OS</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-heading text-foreground leading-[1.1] mb-6 text-balance">
              Bring{" "}
              <span className="gradient-text">Clarity</span>{" "}
              <br /> to Your Chaos.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl">
              The student OS that organizes your deadlines, generates quizzes from your slides,
              and uses AI to explain anything you don't understand.{" "}
              <span className="font-medium text-foreground">Your entire academic life, in one place.</span>
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* FIXED BUTTON: Uses asChild and Link to work on mobile */}
                <Button variant="hero" size="xl" className="group cta-pulse shadow-glow-accent w-full sm:w-auto" asChild>
                  <Link to="/auth">
                    Try StudyFlow for Free
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                
                <Button variant="outline" size="xl" className="bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10 w-full sm:w-auto" asChild>
                  <Link to="/download">
                    Download Android App
                  </Link>
                </Button>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Mock Dashboard UI */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative lg:pl-8"
          >
            <div className="relative">
              {/* Main Dashboard Card */}
              <motion.div
                className="bento-card p-8 backdrop-blur-md relative overflow-hidden"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground font-heading">Lumina Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Your academic command center</p>
                  </div>
                </div>

                {/* Due Soon Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/20">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-destructive">Due Soon</span>
                        <span className="text-xs text-destructive/70">Tomorrow</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">Physiology Assignment</p>
                      <p className="text-xs text-muted-foreground mt-1">Chapter 5: Kidney Metabolism</p>
                    </div>
                  </div>
                </motion.div>

                {/* AI Chat Bubble */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-primary/5 border border-primary/20 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-primary">
                      <MessageSquare className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-primary">AI Tutor</span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-xs text-accent">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                          Active
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        "Here is the summary of the Kidney Metabolism PDF. The nephron filters blood through glomerular filtration..."
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
