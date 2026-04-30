import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FolderOpen, MessageCircle, Bell, HelpCircle, Layers, Timer, ChevronLeft, ChevronRight } from "lucide-react";

const features = [
  {
    icon: FolderOpen,
    title: "Document Library",
    subtitle: "Your Study Vault",
    description: "Upload PDFs, text files, and notes once. Access them anywhere—in the AI Tutor, Quiz Generator, or Flashcard Creator.",
    gradient: "from-primary/80 to-accent/60",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: MessageCircle,
    title: "AI Tutor",
    subtitle: "Chat With Your Materials",
    description: "Upload a lecture slide and ask 'Explain this like I'm 5.' Get instant, contextual answers powered by AI.",
    gradient: "from-accent/80 to-primary/60",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    icon: HelpCircle,
    title: "CBT Quiz Generator",
    subtitle: "Test Yourself Instantly",
    description: "Generate timed multiple-choice quizzes from your documents. Track performance and review mistakes.",
    gradient: "from-primary/70 to-blue-500/60",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: Layers,
    title: "Flashcard Studio",
    subtitle: "Learn Through Repetition",
    description: "Create AI-generated flashcards from any document. Flip, review, and master your material.",
    gradient: "from-accent/70 to-purple-500/60",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    icon: Timer,
    title: "Focus Mode",
    subtitle: "Built-in Pomodoro Timer",
    description: "Stay focused with timed study sessions. Track your productivity and build consistent study habits.",
    gradient: "from-blue-500/70 to-primary/60",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: Bell,
    title: "Assignment Tracker",
    subtitle: "Never Miss a Deadline",
    description: "Add your assignments and get timely reminders. See what's due at a glance from your dashboard.",
    gradient: "from-purple-500/70 to-accent/60",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
];

export const SolutionSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 340;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Your Complete Study Toolkit
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 font-heading tracking-tight">
            Everything You Need to{" "}
            <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Six powerful tools designed to transform how you study, learn, and stay organized.
          </p>
        </motion.div>

        {/* Scroll navigation buttons */}
        <div className="flex justify-end gap-2 mb-4 pr-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full border border-border bg-card/80 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full border border-border bg-card/80 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Scrollable cards container */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="snap-start shrink-0 w-[300px] sm:w-[320px]"
            >
              <div className="group relative h-full rounded-[24px] border border-border/50 bg-card overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1">
                {/* Top gradient bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${feature.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="p-6 lg:p-7 flex flex-col h-full">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    className={`flex items-center justify-center w-14 h-14 rounded-2xl mb-5 ${feature.iconBg} transition-colors duration-300`}
                  >
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} aria-hidden="true" />
                  </motion.div>

                  {/* Content */}
                  <p className={`text-sm font-semibold mb-1 ${feature.iconColor}`}>
                    {feature.title}
                  </p>
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300 font-heading">
                    {feature.subtitle}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                    {feature.description}
                  </p>

                  {/* Bottom shine effect on hover */}
                  <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Hover glow overlay */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${feature.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Scroll indicator dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          {features.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/20"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
