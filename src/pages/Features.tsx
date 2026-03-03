import { useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Brain,
  FileText,
  Timer,
  Trophy,
  Layers,
  MessageSquare,
  ClipboardList,
  BookOpen,
  Zap,
  Shield,
  Smartphone,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Tutor",
    description:
      "Chat with an intelligent AI tutor that understands your uploaded documents. Ask questions, get explanations, and deepen your understanding of any topic.",
    highlight: true,
    gradient: "from-primary/80 to-accent/60",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: FileText,
    title: "Smart Quiz Generation",
    description:
      "Automatically generate multiple-choice quizzes from your study materials. Set questions and time limits, then review with detailed explanations.",
    gradient: "from-accent/80 to-primary/60",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    icon: Layers,
    title: "Flashcard Engine",
    description:
      "Create flashcards manually or let the AI generate them from your documents. Flip through cards to reinforce key concepts.",
    gradient: "from-primary/70 to-blue-500/60",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: Timer,
    title: "Pomodoro Timer",
    description:
      "Stay focused with a built-in Pomodoro timer. Customize session lengths, track study minutes, and build consistent study habits.",
    gradient: "from-accent/70 to-purple-500/60",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    icon: Trophy,
    title: "Gamification & XP",
    description:
      "Earn XP for every study activity — completing quizzes, reviewing flashcards, finishing Pomodoro sessions. Level up and climb the leaderboard.",
    gradient: "from-blue-500/70 to-primary/60",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: BarChart3,
    title: "Weekly Goals & Analytics",
    description:
      "Set weekly targets for study minutes, quizzes, and flashcards. Track your progress with visual analytics and stay accountable.",
    gradient: "from-purple-500/70 to-accent/60",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    icon: ClipboardList,
    title: "Assignment Tracker",
    description:
      "Keep all your assignments organized. Track due dates, priorities, and completion status. Never miss a deadline again.",
    gradient: "from-primary/80 to-accent/60",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: BookOpen,
    title: "Course Management",
    description:
      "Organize study materials by course. Color-code courses and link assignments, documents, and study sessions to specific subjects.",
    gradient: "from-accent/80 to-primary/60",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    icon: MessageSquare,
    title: "Conversation History",
    description:
      "All AI tutor conversations are saved. Revisit past discussions, continue where you left off, and build a searchable knowledge base.",
    gradient: "from-primary/70 to-blue-500/60",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: Shield,
    title: "Secure Document Storage",
    description:
      "Upload PDFs, notes, and study materials to private storage. Documents are encrypted and accessible only by you.",
    gradient: "from-accent/70 to-purple-500/60",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description:
      "Study on your phone, tablet, or desktop with a responsive interface that adapts beautifully to your screen.",
    gradient: "from-blue-500/70 to-primary/60",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    icon: Zap,
    title: "Streaks & Achievements",
    description:
      "Build daily study streaks and unlock achievements as you hit milestones. Every accomplishment is celebrated.",
    gradient: "from-purple-500/70 to-accent/60",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
];

const Features = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -340 : 340,
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Everything You Need to{" "}
            <span className="text-primary">Study Smarter</span>
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            StudyFlow combines AI tutoring, quizzes, flashcards, and gamification into one powerful study companion built for Nigerian university students.
          </motion.p>
        </div>
      </section>

      {/* Feature Carousel */}
      <section className="pb-20 px-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto relative z-10">
          {/* Scroll navigation */}
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

          {/* Scrollable cards */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className="snap-start shrink-0 w-[300px] sm:w-[320px]"
              >
                <div className="group relative h-full rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1">
                  {/* Top gradient bar */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${feature.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

                  {feature.highlight && (
                    <span className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}

                  <div className="p-6 lg:p-7 flex flex-col h-full">
                    {/* Icon */}
                    <motion.div
                      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      className={`flex items-center justify-center w-14 h-14 rounded-2xl mb-5 ${feature.iconBg} transition-colors duration-300`}
                    >
                      <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {feature.description}
                    </p>

                    {/* Bottom shine */}
                    <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Hover glow */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${feature.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Scroll dots */}
          <div className="flex justify-center gap-1.5 mt-2">
            {features.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/20" />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-border/50">
        <div className="container mx-auto text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Study Routine?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of students already using StudyFlow to ace their exams.
            </p>
            <Button variant="glow" size="lg" asChild>
              <Link to="/auth">Get Started — It's Free</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Features;
