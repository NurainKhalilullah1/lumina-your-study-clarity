import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { QuizSetup } from "@/components/quiz/QuizSetup";
import { QuizInterface } from "@/components/quiz/QuizInterface";
import { QuizResults } from "@/components/quiz/QuizResults";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateQuizSession,
  useGenerateQuizQuestions,
  useQuizQuestions,
  useSaveQuizAnswer,
  useSubmitQuiz,
  QuizQuestion
} from "@/hooks/useQuiz";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type QuizPhase = "setup" | "quiz" | "results";

interface LocationState {
  documentContent?: string;
  documentName?: string;
}

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const state = location.state as LocationState | null;

  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [localQuestions, setLocalQuestions] = useState<QuizQuestion[]>([]);
  const [quizScore, setQuizScore] = useState({ score: 0, total: 0 });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeTaken, setTimeTaken] = useState<string>("");

  const createSession = useCreateQuizSession();
  const generateQuestions = useGenerateQuizQuestions();
  const { data: questions, refetch: refetchQuestions } = useQuizQuestions(sessionId);
  const saveAnswer = useSaveQuizAnswer();
  const submitQuiz = useSubmitQuiz();

  // Update local questions when fetched from DB
  useEffect(() => {
    if (questions && questions.length > 0) {
      setLocalQuestions(questions);
    }
  }, [questions]);

  const handleStartQuiz = async (settings: {
    documentName: string;
    documentContent: string;
    numQuestions: number;
    timeLimitMinutes: number;
  }) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to take a quiz.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create quiz session
      const session = await createSession.mutateAsync({
        userId: user.id,
        documentName: settings.documentName,
        documentContent: settings.documentContent,
        numQuestions: settings.numQuestions,
        timeLimitMinutes: settings.timeLimitMinutes
      });

      setSessionId(session.id);

      // Generate questions
      toast({
        title: "Generating questions...",
        description: `Creating ${settings.numQuestions} questions from your document.`
      });

      await generateQuestions.mutateAsync({
        sessionId: session.id,
        documentContent: settings.documentContent,
        numQuestions: settings.numQuestions
      });

      // Refetch questions and start quiz
      await refetchQuestions();
      setStartTime(new Date());
      setPhase("quiz");

      toast({
        title: "Quiz ready!",
        description: "Good luck! 🍀"
      });

    } catch (error) {
      console.error("Failed to start quiz:", error);
      toast({
        title: "Failed to create quiz",
        description: "There was an error setting up the quiz. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveAnswer = (questionId: string, answer: string) => {
    // Update local state immediately for responsiveness
    setLocalQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, user_answer: answer } : q
      )
    );

    // Save to database
    saveAnswer.mutate({ questionId, answer });
  };

  const handleToggleFlag = (questionId: string, isFlagged: boolean) => {
    // Update local state immediately
    setLocalQuestions(prev =>
      prev.map(q =>
        q.id === questionId ? { ...q, is_flagged: isFlagged } : q
      )
    );

    // Save to database
    saveAnswer.mutate({ questionId, isFlagged });
  };

  const handleSubmitQuiz = async () => {
    if (!sessionId) return;

    try {
      const result = await submitQuiz.mutateAsync(sessionId);
      
      // Calculate time taken
      if (startTime) {
        const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        setTimeTaken(`${mins}:${secs.toString().padStart(2, '0')}`);
      }

      setQuizScore(result);
      setPhase("results");

      toast({
        title: "Quiz submitted!",
        description: `You scored ${result.score}/${result.total}`
      });

    } catch (error) {
      console.error("Failed to submit quiz:", error);
      toast({
        title: "Failed to submit",
        description: "There was an error submitting your quiz.",
        variant: "destructive"
      });
    }
  };

  const handleRetake = () => {
    setPhase("setup");
    setSessionId(null);
    setLocalQuestions([]);
    setQuizScore({ score: 0, total: 0 });
    setStartTime(null);
    setTimeTaken("");
  };

  // Get time limit from first question's session or default
  const getTimeLimit = () => {
    // Default to 45 minutes
    return 45;
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-2rem)] flex flex-col bg-background overflow-hidden">
        {/* Header */}
        {phase === "setup" && (
          <header className="flex items-center gap-4 px-4 py-3 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tutor')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tutor
            </Button>
          </header>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {phase === "setup" && (
            <QuizSetup
              initialDocumentName={state?.documentName}
              initialDocumentContent={state?.documentContent}
              onStartQuiz={handleStartQuiz}
              isLoading={createSession.isPending || generateQuestions.isPending}
            />
          )}

          {phase === "quiz" && localQuestions.length > 0 && (
            <QuizInterface
              questions={localQuestions}
              timeLimitMinutes={getTimeLimit()}
              onSaveAnswer={handleSaveAnswer}
              onToggleFlag={handleToggleFlag}
              onSubmit={handleSubmitQuiz}
            />
          )}

          {phase === "results" && (
            <QuizResults
              score={quizScore.score}
              totalQuestions={quizScore.total}
              questions={localQuestions}
              timeTaken={timeTaken}
              onRetake={handleRetake}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
