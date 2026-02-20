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
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Tutor",
    description:
      "Chat with an intelligent AI tutor that understands your uploaded documents. Ask questions, get explanations, and deepen your understanding of any topic — all powered by context-aware AI.",
    highlight: true,
  },
  {
    icon: FileText,
    title: "Smart Quiz Generation",
    description:
      "Automatically generate multiple-choice quizzes from your study materials. Set the number of questions and time limits, then review your answers with detailed explanations.",
  },
  {
    icon: Layers,
    title: "Flashcard Engine",
    description:
      "Create flashcards manually or let the AI generate them from your documents. Flip through cards with a smooth, intuitive interface to reinforce key concepts.",
  },
  {
    icon: Timer,
    title: "Pomodoro Timer",
    description:
      "Stay focused with a built-in Pomodoro timer. Customize session lengths, track study minutes, and build consistent study habits with timed work-break cycles.",
  },
  {
    icon: Trophy,
    title: "Gamification & XP",
    description:
      "Earn XP for every study activity — completing quizzes, reviewing flashcards, finishing Pomodoro sessions, and maintaining streaks. Level up and climb the leaderboard.",
  },
  {
    icon: BarChart3,
    title: "Weekly Goals & Analytics",
    description:
      "Set weekly targets for study minutes, quizzes, and flashcards. Track your progress with visual analytics and stay accountable to your learning goals.",
  },
  {
    icon: ClipboardList,
    title: "Assignment Tracker",
    description:
      "Keep all your assignments organized in one place. Track due dates, priorities, and completion status. Never miss a deadline again.",
  },
  {
    icon: BookOpen,
    title: "Course Management",
    description:
      "Organize your study materials by course. Color-code your courses and link assignments, documents, and study sessions to specific subjects.",
  },
  {
    icon: MessageSquare,
    title: "Conversation History",
    description:
      "All your AI tutor conversations are saved and organized. Revisit past discussions, continue where you left off, and build a searchable knowledge base.",
  },
  {
    icon: Shield,
    title: "Secure Document Storage",
    description:
      "Upload PDFs, notes, and study materials to your private storage. Documents are encrypted and accessible only by you — never shared or used for training.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description:
      "StudyFlow is designed to work beautifully on any device. Study on your phone, tablet, or desktop with a responsive interface that adapts to your screen.",
  },
  {
    icon: Zap,
    title: "Streaks & Achievements",
    description:
      "Build daily study streaks and unlock achievements as you hit milestones. From your first quiz to a 30-day streak — every accomplishment is celebrated.",
  },
];

const Features = () => {
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

      {/* Feature Grid */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className={`relative rounded-2xl border p-6 transition-all hover:shadow-lg ${
                  feature.highlight
                    ? "border-primary/40 bg-primary/5 shadow-md"
                    : "border-border bg-card"
                }`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                {feature.highlight && (
                  <span className="absolute -top-3 left-6 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-border/50">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Study Routine?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of students already using StudyFlow to ace their exams.
          </p>
          <Button variant="glow" size="lg" asChild>
            <Link to="/auth">Get Started — It's Free</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Features;
