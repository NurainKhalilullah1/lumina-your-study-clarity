import { motion } from "framer-motion";
import { FileWarning, BrainCircuit, CalendarX } from "lucide-react";

const problems = [
  {
    icon: FileWarning,
    title: "Files Lost",
    description: "Materials scattered across WhatsApp, Google Drive, and random email attachments.",
  },
  {
    icon: BrainCircuit,
    title: "Cognitive Overload",
    description: "100-page lecture slides with no summary. Your brain can only take so much.",
  },
  {
    icon: CalendarX,
    title: "Missed Deadlines",
    description: "Forgot to check the portal. Again. That assignment was due yesterday.",
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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export const ProblemSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 font-heading tracking-tight">
            Why is university so{" "}
            <span className="gradient-text">hard</span>{" "}
            right now?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You're not lazy. The system just wasn't built for modern students.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="bento-card p-10 group relative"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 mb-6 group-hover:bg-destructive/20 transition-colors">
                  <problem.icon className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 font-heading">
                  {problem.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {problem.description}
                </p>
              </div>

              {/* Subtle glow on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
