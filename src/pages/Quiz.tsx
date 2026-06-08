import { useState, useEffect, useRef } from "react";
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

const QUIZ_SESSION_KEY = "quiz_active_session";

interface PersistedQuizSession {
  sessionId: string;
  phase: "quiz";
  quizTimeLimit: number;
  startTime: string; // ISO timestamp when quiz started
  currentQuestionIndex: number;
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
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(25);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // Stores the calculated remaining time when recovering a session (seconds)
  const [recoveredTimeRemaining, setRecoveredTimeRemaining] = useState<number | undefined>(undefined);

  const createSession = useCreateQuizSession();
  const generateQuestions = useGenerateQuizQuestions();
  const { data: questions, refetch: refetchQuestions } = useQuizQuestions(sessionId);
  const saveAnswer = useSaveQuizAnswer();
  const submitQuiz = useSubmitQuiz();

  // ─── Restore persisted session on mount ────────────────────────────────────
  const recoveryAttempted = useRef(false);
  useEffect(() => {
    if (recoveryAttempted.current) return;
    recoveryAttempted.current = true;

    try {
      const raw = localStorage.getItem(QUIZ_SESSION_KEY);
      if (!raw) return;

      const saved: PersistedQuizSession = JSON.parse(raw);
      if (!saved.sessionId) return;

      // Compute remaining seconds based on elapsed wall-clock time
      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(saved.startTime).getTime()) / 1000
      );
      const totalSeconds = saved.quizTimeLimit * 60;
      const remaining = Math.max(0, totalSeconds - elapsedSeconds);

      if (remaining === 0) {
        // Time already ran out while app was closed – clear and stay on setup
        localStorage.removeItem(QUIZ_SESSION_KEY);
        toast({
          title: "Quiz time expired",
          description: "Your previous quiz session timed out while the app was closed.",
          variant: "destructive",
        });
        return;
      }

      // Restore state
      setSessionId(saved.sessionId);
      setQuizTimeLimit(saved.quizTimeLimit);
      setStartTime(new Date(saved.startTime));
      setCurrentQuestionIndex(saved.currentQuestionIndex);
      setRecoveredTimeRemaining(remaining);
      setPhase("quiz");

      toast({
        title: "Quiz resumed ✅",
        description: `Picking up where you left off — ${Math.floor(remaining / 60)}m ${remaining % 60}s remaining.`,
      });
    } catch {
      // Corrupt data – silently remove it
      localStorage.removeItem(QUIZ_SESSION_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Update local questions when fetched from DB ────────────────────────────
  useEffect(() => {
    if (questions && questions.length > 0) {
      setLocalQuestions(questions);
    }
  }, [questions]);

  // ─── Persist session snapshot while quiz is active ─────────────────────────
  useEffect(() => {
    if (phase === "quiz" && sessionId && startTime) {
      const snapshot: PersistedQuizSession = {
        sessionId,
        phase: "quiz",
        quizTimeLimit,
        startTime: startTime.toISOString(),
        currentQuestionIndex,
      };
      localStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(snapshot));
    } else if (phase !== "quiz") {
      localStorage.removeItem(QUIZ_SESSION_KEY);
    }
  }, [phase, sessionId, startTime, quizTimeLimit, currentQuestionIndex]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleStartQuiz = async (settings: {
    documentName: string;
    documentContent: string;
    numQuestions: number;
    timeLimitMinutes: number;
    questionType: string;
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
      setQuizTimeLimit(settings.timeLimitMinutes);

      // Generate questions
      toast({
        title: "Generating questions...",
        description: `Creating ${settings.numQuestions} questions from your document.`
      });

      await generateQuestions.mutateAsync({
        sessionId: session.id,
        documentContent: settings.documentContent,
        numQuestions: settings.numQuestions,
        questionType: settings.questionType,
      });

      // Refetch questions and start quiz
      await refetchQuestions();
      const now = new Date();
      setStartTime(now);
      setCurrentQuestionIndex(0);
      setRecoveredTimeRemaining(undefined); // fresh quiz, no recovery
      setPhase("quiz");

      toast({
        title: "Quiz ready!",
        description: "Good luck! 🍀"
      });

    } catch (error: any) {
      console.error("Failed to start quiz:", error);
      toast({
        title: "Failed to create quiz",
        description: error.message || "There was an error setting up the quiz. Please try again.",
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
      // Clearing localStorage happens via the phase useEffect below
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
    setQuizTimeLimit(25);
    setCurrentQuestionIndex(0);
    setRecoveredTimeRemaining(undefined);
  };

  return (
    <DashboardLayout hideMobileHeader={phase === "quiz"} hideNav={phase === "quiz"}>
      {/* Setup phase */}
      {phase === "setup" && (
        <div className="flex flex-col min-h-full">
          <header className="flex items-center gap-4 px-4 py-3 border-b shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/quiz-history')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quiz Hub
            </Button>
          </header>
          <div className="flex-1 overflow-auto">
            <QuizSetup
              initialDocumentName={state?.documentName}
              initialDocumentContent={state?.documentContent}
              onStartQuiz={handleStartQuiz}
              isLoading={createSession.isPending || generateQuestions.isPending}
            />
          </div>
        </div>
      )}

      {/* Active quiz phase – fills the screen with no page scroll */}
      {phase === "quiz" && localQuestions.length > 0 && (
        <div className="flex-1 flex flex-col min-h-0">
          <QuizInterface
            questions={localQuestions}
            timeLimitMinutes={quizTimeLimit}
            onSaveAnswer={handleSaveAnswer}
            onToggleFlag={handleToggleFlag}
            onSubmit={handleSubmitQuiz}
            initialTimeRemaining={recoveredTimeRemaining}
            initialQuestionIndex={currentQuestionIndex}
            onQuestionChange={setCurrentQuestionIndex}
          />
        </div>
      )}

      {/* Results phase */}
      {phase === "results" && (
        <div className="overflow-auto p-4 sm:p-6 pb-20 md:pb-6">
          <QuizResults
            score={quizScore.score}
            totalQuestions={quizScore.total}
            questions={localQuestions}
            timeTaken={timeTaken}
            onRetake={handleRetake}
            sessionId={sessionId}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
