import { motion } from "framer-motion";
import { BookOpen, Users, Star, Zap } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "50+",
    label: "Active Students",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: BookOpen,
    value: "70Mins +",
    label: "Study Sessions",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Zap,
    value: "5K+",
    label: "AI Answers Given",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Star,
    value: "4.3 / 5",
    label: "Student Rating",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

export const StatsSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.04)_0%,_transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
            Trusted by Nigerian Students
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground font-heading tracking-tight mb-4">
            Numbers that{" "}
            <span className="gradient-text">speak for themselves</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            StudyFlow is the go-to study companion for students across Nigeria's top universities.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bento-card p-8 flex flex-col items-center text-center group"
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${stat.bg} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className={`text-3xl font-bold font-heading ${stat.color} mb-1`}>
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
