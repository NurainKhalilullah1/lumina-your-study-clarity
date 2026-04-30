import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useMemo } from "react";

const Meteors = ({ number = 15 }: { number?: number }) => {
  const meteorStyles = useMemo(() => {
    return Array.from({ length: number }).map(() => ({
      top: -5,
      left: Math.floor(Math.random() * 100) + "vw",
      animationDelay: Math.random() * (2 - 0.2) + 0.2 + "s",
      animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + "s",
    }));
  }, [number]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {meteorStyles.map((style, idx) => (
        <span
          key={"meteor" + idx}
          className="animate-meteor"
          style={style}
        ></span>
      ))}
    </div>
  );
};

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-24 pb-16 hero-premium-bg flex items-center">
      {/* Background Effects */}
      <Meteors number={15} />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] z-[1] pointer-events-none" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6 backdrop-blur-sm shadow-glow-primary"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Student OS</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold font-heading text-foreground leading-[1.05] mb-6 text-balance tracking-tight">
              Bring{" "}
              <span className="gradient-text brightness-125 dark:brightness-110">Clarity</span>{" "}
              <br /> to Your Chaos.
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl">
              The student OS that organizes your deadlines, generates quizzes from your slides,
              and uses AI to explain anything you don't understand.{" "}
              <span className="font-medium text-foreground/90">Your entire academic life, in one place.</span>
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button variant="hero" size="xl" className="group cta-pulse shadow-glow-primary w-full sm:w-auto" asChild>
                  <Link to="/auth">
                    Try StudyFlow for Free
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                
                <Button variant="outline" size="xl" className="bg-background/20 dark:bg-white/5 backdrop-blur-md border-border/50 dark:border-white/10 text-foreground dark:text-white w-full sm:w-auto" asChild>
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
            className="relative lg:pl-8 hidden lg:block"
          >
            <div className="relative">
              {/* Main Dashboard Card */}
              <motion.div
                className="bg-card/80 dark:bg-[#0c0c14]/80 border border-border/50 dark:border-white/10 p-8 backdrop-blur-md relative overflow-hidden rounded-[32px] shadow-2xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 border border-primary/30">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground font-heading">StudyFlow Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Your academic command center</p>
                  </div>
                </div>

                {/* Due Soon Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 mb-4 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/40">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-destructive">Due Soon</span>
                        <span className="text-xs text-foreground/50">Tomorrow</span>
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
                  className="bg-card/50 dark:bg-[#151525]/80 border border-border/50 dark:border-white/10 rounded-2xl p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl gradient-primary shadow-glow-primary">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-primary-foreground brightness-125">AI Tutor</span>
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[10px] text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed italic">
                        "Here is the summary of the Kidney Metabolism PDF. The nephron filters blood through glomerular filtration..."
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Decorative Glows */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-[100px] opacity-20" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-accent/20 rounded-full blur-[120px] opacity-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
