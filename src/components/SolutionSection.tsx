import { motion } from "framer-motion";
import { FolderOpen, MessageCircle, Bell, ArrowRight, HelpCircle, Layers, Timer } from "lucide-react";

const features = [
  {
    icon: FolderOpen,
    title: "Document Library",
    subtitle: "Your Study Vault",
    description: "Upload PDFs, text files, and notes once. Access them anywhere—in the AI Tutor, Quiz Generator, or Flashcard Creator.",
    color: "primary",
  },
  {
    icon: MessageCircle,
    title: "AI Tutor",
    subtitle: "Chat With Your Materials",
    description: "Upload a lecture slide and ask 'Explain this like I'm 5.' Get instant, contextual answers powered by AI.",
    color: "accent",
  },
  {
    icon: HelpCircle,
    title: "CBT Quiz Generator",
    subtitle: "Test Yourself Instantly",
    description: "Generate timed multiple-choice quizzes from your documents. Track performance and review mistakes.",
    color: "primary",
  },
  {
    icon: Layers,
    title: "Flashcard Studio",
    subtitle: "Learn Through Repetition",
    description: "Create AI-generated flashcards from any document. Flip, review, and master your material.",
    color: "accent",
  },
  {
    icon: Timer,
    title: "Focus Mode",
    subtitle: "Built-in Pomodoro Timer",
    description: "Stay focused with timed study sessions. Track your productivity and build consistent study habits.",
    color: "primary",
  },
  {
    icon: Bell,
    title: "Assignment Tracker",
    subtitle: "Never Miss a Deadline",
    description: "Add your assignments and get timely reminders. See what's due at a glance from your dashboard.",
    color: "accent",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export const SolutionSection = () => {
  return (
    <section className="py-24 bg-muted/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Your Complete Study Toolkit
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Six powerful tools designed to transform how you study, learn, and stay organized.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group relative bg-card rounded-2xl p-6 lg:p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="flex flex-col h-full">
                <div className={`flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-2xl mb-5 ${
                  feature.color === "accent" 
                    ? "bg-accent/10 group-hover:bg-accent/20" 
                    : "bg-primary/10 group-hover:bg-primary/20"
                } transition-colors`}>
                  <feature.icon className={`w-6 h-6 lg:w-7 lg:h-7 ${
                    feature.color === "accent" ? "text-accent" : "text-primary"
                  }`} />
                </div>

                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${
                    feature.color === "accent" ? "text-accent" : "text-primary"
                  }`}>
                    {feature.title}
                  </p>
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground mb-3">
                    {feature.subtitle}
                  </h3>
                  <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Gradient overlay */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                feature.color === "accent"
                  ? "bg-gradient-to-b from-accent/5 to-transparent"
                  : "bg-gradient-to-b from-primary/5 to-transparent"
              }`} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
