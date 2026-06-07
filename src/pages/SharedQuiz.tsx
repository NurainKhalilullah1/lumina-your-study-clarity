import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QuizInterface } from "@/components/quiz/QuizInterface";
import { QuizResults } from "@/components/quiz/QuizResults";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  BookOpen, 
  Clock, 
  HelpCircle, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import type { QuizQuestion, QuizSession } from "@/hooks/useQuiz";

type QuizPhase = "landing" | "quiz" | "results";

export default function SharedQuiz() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phase, setPhase] = useState<QuizPhase>("landing");
  const [localQuestions, setLocalQuestions] = useState<QuizQuestion[]>([]);
  const [quizScore, setQuizScore] = useState({ score: 0, total: 0 });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeTaken, setTimeTaken] = useState<string>("");

  // 1. Fetch quiz session
  const { data: session, isLoading: isLoadingSession, error: sessionError } = useQuery({
    queryKey: ["shared-quiz-session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      
      if (error) {
        console.error("Error fetching session:", error);
        throw new Error("Quiz not found or has been deleted.");
      }
      return data as QuizSession;
    },
    enabled: !!sessionId,
    retry: false,
  });

  // 2. Fetch quiz questions
  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["shared-quiz-questions", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_session_id", sessionId)
        .order("question_number", { ascending: true });
      
      if (error) {
        console.error("Error fetching questions:", error);
        throw error;
      }
      
      return data.map((q) => ({
        ...q,
        options: q.options as string[],
        user_answer: null, // Clear any stored user answers for the shared recipient
      })) as QuizQuestion[];
    },
    enabled: !!sessionId && !!session,
    retry: false,
  });

  // Initialize local questions when fetched
  useEffect(() => {
    if (questions && questions.length > 0) {
      setLocalQuestions(questions);
    }
  }, [questions]);

  const handleStartQuiz = () => {
    setStartTime(new Date());
    setPhase("quiz");
    toast({
      title: "Quiz Started!",
      description: "Good luck! Your score will be calculated at the end.",
    });
  };

  const handleSaveAnswer = (questionId: string, answer: string) => {
    setLocalQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, user_answer: answer } : q
      )
    );
  };

  const handleToggleFlag = (questionId: string, isFlagged: boolean) => {
    setLocalQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, is_flagged: isFlagged } : q
      )
    );
  };

  const handleSubmitQuiz = () => {
    // Calculate score client-side for anonymous takers
    let correct = 0;
    localQuestions.forEach((q) => {
      const isMatch =
        q.user_answer?.trim().toLowerCase() === q.correct_answer?.trim().toLowerCase();
      if (isMatch) {
        correct++;
      }
    });

    if (startTime) {
      const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setTimeTaken(`${mins}:${secs.toString().padStart(2, "0")}`);
    }

    setQuizScore({ score: correct, total: localQuestions.length });
    setPhase("results");
  };

  const handleRetake = () => {
    setLocalQuestions((prev) =>
      prev.map((q) => ({ ...q, user_answer: null, is_flagged: false }))
    );
    setQuizScore({ score: 0, total: 0 });
    setStartTime(new Date());
    setPhase("quiz");
  };

  const isLoading = isLoadingSession || isLoadingQuestions;

  // Render Loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">
              Loading shared quiz...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Render Error
  if (sessionError || !session) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-destructive/20 shadow-lg">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">Quiz Not Found</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  This quiz may have been deleted by its owner or the link is invalid.
                </p>
              </div>
              <Button onClick={() => navigate("/")} className="w-full">
                Go to StudyFlow Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4">
        {/* Landing phase */}
        {phase === "landing" && (
          <div className="max-w-2xl mx-auto space-y-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Shared Quiz Challenge
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {session.document_name || "Study Quiz"}
              </h1>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
                A customized quiz generated on StudyFlow. Test your knowledge and see your score instantly!
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border border-border/50 shadow-xl overflow-hidden bg-card/60 backdrop-blur-md">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Info Grid */}
                  <div className="grid grid-cols-3 gap-4 border-b pb-6">
                    <div className="text-center space-y-1">
                      <HelpCircle className="w-5 h-5 text-primary mx-auto" />
                      <span className="block text-xl font-bold">{localQuestions.length}</span>
                      <span className="text-xs text-muted-foreground uppercase font-semibold">Questions</span>
                    </div>
                    <div className="text-center space-y-1 border-x">
                      <Clock className="w-5 h-5 text-primary mx-auto" />
                      <span className="block text-xl font-bold">{session.time_limit_minutes}m</span>
                      <span className="text-xs text-muted-foreground uppercase font-semibold">Time Limit</span>
                    </div>
                    <div className="text-center space-y-1">
                      <ShieldCheck className="w-5 h-5 text-primary mx-auto" />
                      <span className="block text-xl font-bold">Free</span>
                      <span className="text-xs text-muted-foreground uppercase font-semibold">Access</span>
                    </div>
                  </div>

                  {/* Start Button */}
                  <Button
                    onClick={handleStartQuiz}
                    size="lg"
                    className="w-full gradient-primary text-primary-foreground font-semibold text-base py-6 shadow-md hover:shadow-lg transition-all"
                  >
                    Start Quiz Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Quiz phase */}
        {phase === "quiz" && localQuestions.length > 0 && (
          <div className="py-4">
            <QuizInterface
              questions={localQuestions}
              timeLimitMinutes={session.time_limit_minutes}
              onSaveAnswer={handleSaveAnswer}
              onToggleFlag={handleToggleFlag}
              onSubmit={handleSubmitQuiz}
            />
          </div>
        )}

        {/* Results phase */}
        {phase === "results" && (
          <div className="space-y-8 py-4">
            <QuizResults
              score={quizScore.score}
              totalQuestions={quizScore.total}
              questions={localQuestions}
              timeTaken={timeTaken}
              onRetake={handleRetake}
              sessionId={sessionId}
              isSharedMode={true}
            />

            {/* Premium CTA Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/5 shadow-xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl -z-10" />
                
                <CardContent className="p-6 sm:p-8 text-center space-y-5">
                  <div className="inline-flex p-3 rounded-full bg-primary/20 text-primary">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="space-y-2 max-w-lg mx-auto">
                    <h3 className="text-xl sm:text-2xl font-bold">
                      Create Your Own AI Study Quizzes!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      StudyFlow helps you convert files, PDFs, or lecture notes into interactive quizzes, flashcards, study schedules, and summaries in seconds.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => navigate("/auth")}
                    className="gradient-primary text-primary-foreground font-semibold px-8"
                  >
                    Join StudyFlow for Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
