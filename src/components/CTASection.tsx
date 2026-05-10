import { motion } from "framer-motion";
import { Rocket, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const highlights = [
  "No credit card required",
  "Free plan forever",
  "Works on Android & Web",
];

export const CTASection = () => {
  return (
    <section className="py-28 relative overflow-hidden bg-background">
      {/* Theme-aware radial glow behind the card */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,_hsl(var(--primary)/0.12)_0%,_transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl border border-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden p-10 sm:p-16 text-center max-w-4xl mx-auto shadow-xl shadow-primary/5"
        >
          {/* Inner gradient accent — top edge */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          {/* Inner gradient accent — bottom edge */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {/* Corner glow orbs */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Join 10,000+ Nigerian Students</span>
            </motion.div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance font-heading tracking-tight leading-[1.08]">
              Your academic weapon{" "}
              <span className="gradient-text">is ready.</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Stop drowning in notes. Start studying smarter with AI that actually understands your course materials.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="xl" variant="glow" className="group font-bold px-10" asChild>
                <Link to="/auth">
                  <Rocket className="w-5 h-5 mr-2 transition-transform group-hover:-translate-y-0.5" />
                  Start for Free
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button size="xl" variant="outline" className="font-semibold" asChild>
                <Link to="/download">Download Android App</Link>
              </Button>
            </motion.div>

            {/* Reassurance chips */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-4 mt-8"
            >
              {highlights.map((h) => (
                <span key={h} className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  {h}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
