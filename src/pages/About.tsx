import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GraduationCap, Heart, Target, Users } from "lucide-react";

const values = [
  {
    icon: GraduationCap,
    title: "Student-First",
    description:
      "Every feature is designed with the Nigerian university student in mind — from the courses you take to the way you study.",
  },
  {
    icon: Target,
    title: "Built for Results",
    description:
      "We don't just help you study longer — we help you study smarter. AI-powered tools focus your effort where it matters most.",
  },
  {
    icon: Heart,
    title: "Accessible to All",
    description:
      "StudyFlow is free to use with generous limits. We believe every student deserves access to powerful study tools, regardless of budget.",
  },
  {
    icon: Users,
    title: "Community-Driven",
    description:
      "Our leaderboard and gamification features create healthy competition and motivation. Learning is better when you're not alone.",
  },
];

const About = () => {
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
            About <span className="text-primary">StudyFlow</span>
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            We're on a mission to make studying less stressful and more effective for every university student in Nigeria and beyond.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            className="rounded-2xl border border-border bg-card p-8 sm:p-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                StudyFlow was born from a simple observation: Nigerian university students are some of the most hardworking and ambitious learners in the world, yet they often lack access to the modern study tools that students in other countries take for granted.
              </p>
              <p>
                We saw students juggling thick textbooks, scattered notes, and endless past questions — all while trying to keep track of assignments across multiple courses. The tools available were either too expensive, too generic, or simply not designed for the way Nigerian students actually study.
              </p>
              <p>
                So we built StudyFlow — an AI-powered study companion that understands your documents, generates quizzes from your actual course materials, creates flashcards on demand, and keeps you motivated with gamification. All for free, all in one place.
              </p>
              <p>
                Whether you're preparing for your OAU mid-semester tests, UNILAG final exams, or just trying to stay on top of your coursework at any institution, StudyFlow is built to help you study smarter, not harder.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-10">What We Stand For</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="rounded-2xl border border-border bg-card p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-border/50">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Join the StudyFlow Community
          </h2>
          <p className="text-muted-foreground mb-8">
            Thousands of Nigerian students are already studying smarter with StudyFlow. Start your journey today.
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

export default About;
