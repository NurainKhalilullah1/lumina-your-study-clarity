import { motion } from "framer-motion";
import { FolderOpen, MessageCircle, Bell, ArrowRight } from "lucide-react";

const features = [
  {
    icon: FolderOpen,
    title: "The Vault",
    subtitle: "Centralized Materials",
    description: "Upload PDFs and organize courses in one clean view. No more hunting through folders.",
    color: "primary",
  },
  {
    icon: MessageCircle,
    title: "The AI Tutor",
    subtitle: "Instant Understanding",
    description: "Chat with your slides. Ask StudyFlow to 'Explain this page like I'm 5.'",
    color: "accent",
  },
  {
    icon: Bell,
    title: "The Guardian",
    subtitle: "Deadline Radar",
    description: "Get notified 48 hours before any assignment is due. Never miss a deadline again.",
    color: "primary",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
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
            The Solution
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How{" "}
            <span className="gradient-text">StudyFlow</span>{" "}
            Helps You
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three powerful tools to transform your academic life.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="flex flex-col h-full">
                <div className={`flex items-center justify-center w-14 h-14 rounded-2xl mb-6 ${
                  feature.color === "accent" 
                    ? "bg-accent/10 group-hover:bg-accent/20" 
                    : "bg-primary/10 group-hover:bg-primary/20"
                } transition-colors`}>
                  <feature.icon className={`w-7 h-7 ${
                    feature.color === "accent" ? "text-accent" : "text-primary"
                  }`} />
                </div>

                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${
                    feature.color === "accent" ? "text-accent" : "text-primary"
                  }`}>
                    {feature.title}
                  </p>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.subtitle}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                <div className="flex items-center text-sm font-medium text-primary group-hover:gap-2 gap-1 transition-all cursor-pointer">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
