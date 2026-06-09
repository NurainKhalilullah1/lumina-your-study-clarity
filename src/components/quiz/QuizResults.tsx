import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  SkipForward, 
  Clock, 
  BookOpen,
  RotateCcw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Share2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizQuestion } from "@/hooks/useQuiz";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShareModal } from "./ShareModal";

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  timeTaken?: string;
  onRetake: () => void;
  sessionId?: string | null;
  isSharedMode?: boolean;
}

export const QuizResults = ({
  score,
  totalQuestions,
  questions,
  timeTaken,
  onRetake,
  sessionId,
  isSharedMode = false
}: QuizResultsProps) => {
  const [showReview, setShowReview] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const percentage = Math.round((score / totalQuestions) * 100);
  const unanswered = questions.filter(q => !q.user_answer).length;
  const wrong = totalQuestions - score - unanswered;

  const appBaseUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  const handleShare = async () => {
    if (!sessionId) return;
    const url = `${appBaseUrl}/shared-quiz/${sessionId}`;
    try {
      const { error } = await supabase
        .from("quiz_sessions")
        .update({ is_shared: true })
        .eq("id", sessionId);
      if (error) throw error;
      setShareUrl(url);
      setShareModalOpen(true);
    } catch (err: any) {
      console.error("Failed to share:", err);
      toast({
        title: "Failed to share",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Determine performance level
  const getPerformanceLevel = () => {
    if (percentage >= 90) return { label: "Excellent!", color: "text-green-500", emoji: "🎉" };
    if (percentage >= 70) return { label: "Good Job!", color: "text-primary", emoji: "👍" };
    if (percentage >= 50) return { label: "Keep Practicing", color: "text-amber-500", emoji: "💪" };
    return { label: "Needs Improvement", color: "text-destructive", emoji: "📚" };
  };

  const performance = getPerformanceLevel();

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Score Card */}
      <Card className="p-8 text-center space-y-6">
        {/* Trophy icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto">
          <Trophy className={cn("w-10 h-10", performance.color)} />
        </div>

        {/* Score display */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">
            {score}/{totalQuestions}
          </h1>
          <div className="text-6xl font-bold gradient-text">
            {percentage}%
          </div>
          <p className={cn("text-xl font-semibold", performance.color)}>
            {performance.emoji} {performance.label}
          </p>
        </div>

        {/* Progress bar */}
        <Progress value={percentage} className="h-3 max-w-md mx-auto" />

        {/* Stats breakdown */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-500">{score}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 text-center">
            <XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-lg font-bold text-destructive">{wrong}</p>
            <p className="text-xs text-muted-foreground">Wrong</p>
          </div>
          <div className="p-3 rounded-lg bg-muted text-center">
            <SkipForward className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold">{unanswered}</p>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </div>
        </div>

        {timeTaken && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Time taken: {timeTaken}</span>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setShowReview(!showReview)}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          {showReview ? "Hide Review" : "Review Answers"}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={onRetake}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake Quiz
        </Button>
        {sessionId && !isSharedMode && (
          <Button
            variant="outline"
            className="flex-1 border-primary/30 text-primary hover:bg-primary/5"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Quiz
          </Button>
        )}
        {isSharedMode ? (
          <Button
            className="flex-1 gradient-primary text-primary-foreground"
            onClick={() => navigate('/auth')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Join StudyFlow
          </Button>
        ) : (
          <Button
            className="flex-1 gradient-primary text-primary-foreground"
            onClick={() => navigate('/tutor')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tutor
          </Button>
        )}
      </div>

      {/* Review Section */}
      {showReview && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Question Review</h3>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const isCorrect = q.user_answer?.trim().toLowerCase() === q.correct_answer?.trim().toLowerCase();
                const isUnanswered = !q.user_answer;
                const isExpanded = expandedQuestion === idx;

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "border rounded-lg overflow-hidden transition-all",
                      isCorrect ? "border-green-500/40" : 
                      isUnanswered ? "border-muted" : "border-destructive/40"
                    )}
                  >
                    {/* Question header */}
                    <button
                      className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        isCorrect ? "bg-green-500/20" :
                        isUnanswered ? "bg-muted" : "bg-destructive/20"
                      )}>
                        {isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : isUnanswered ? (
                          <SkipForward className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                      <span className="flex-1 text-left text-sm font-medium line-clamp-1">
                        {idx + 1}. {q.question}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t bg-muted/30">
                        <p className="pt-3 text-sm">{q.question}</p>
                        
                        <div className="space-y-2">
                          {q.options.length === 1 && (q.options[0] === "FILL_IN_THE_BLANK" || q.options[0] === "SHORT_ANSWER") ? (
                            <div className="p-3 bg-muted rounded-lg text-sm space-y-2">
                              <div>
                                <span className="font-semibold text-muted-foreground">Your Answer: </span>
                                <span className={cn(
                                  isCorrect ? "text-green-500 font-medium" : "text-destructive font-medium"
                                )}>
                                  {q.user_answer || "(No answer provided)"}
                                </span>
                              </div>
                              {!isCorrect && (
                                <div>
                                  <span className="font-semibold text-muted-foreground">Correct Answer: </span>
                                  <span className="text-green-500 font-medium">{q.correct_answer}</span>
                                </div>
                              )}
                            </div>
                          ) : q.options.length === 2 && q.options.includes("True") && q.options.includes("False") ? (
                            <>
                              {q.options.map((option, optIdx) => {
                                const norm = (x: string | null | undefined) => (x ?? "").trim().toLowerCase();
                                const isUserAnswer = norm(q.user_answer) === norm(option);
                                const isCorrectAnswer = norm(q.correct_answer) === norm(option);

                                return (
                                  <div
                                    key={optIdx}
                                    className={cn(
                                      "p-2 rounded-lg text-sm flex items-center gap-2",
                                      isCorrectAnswer && "bg-green-500/20 border border-green-500/40",
                                      isUserAnswer && !isCorrectAnswer && "bg-destructive/20 border border-destructive/40",
                                      !isCorrectAnswer && !isUserAnswer && "bg-muted"
                                    )}
                                  >
                                    <span className="font-medium">{option}</span>
                                    {isCorrectAnswer && (
                                      <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                      <XCircle className="w-4 h-4 text-destructive ml-auto" />
                                    )}
                                  </div>
                                );
                              })}
                              {!isCorrect && !isUnanswered && (
                                <div className="mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                                  <span className="font-semibold text-green-600 dark:text-green-400">✅ Correct Answer: </span>
                                  <span className="text-green-700 dark:text-green-300">{q.correct_answer}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {q.options.map((option, optIdx) => {
                                // Normalize for consistent comparison (matches outer isCorrect check)
                                const norm = (x: string | null | undefined) => (x ?? "").trim().toLowerCase();
                                const isUserAnswer = norm(q.user_answer) === norm(option);
                                const isCorrectAnswer = norm(q.correct_answer) === norm(option);

                                return (
                                  <div
                                    key={optIdx}
                                    className={cn(
                                      "p-2 rounded-lg text-sm flex items-center gap-2",
                                      isCorrectAnswer && "bg-green-500/20 border border-green-500/40",
                                      isUserAnswer && !isCorrectAnswer && "bg-destructive/20 border border-destructive/40",
                                      !isCorrectAnswer && !isUserAnswer && "bg-muted"
                                    )}
                                  >
                                    <span className="font-medium">{option}</span>
                                    {isCorrectAnswer && (
                                      <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                      <XCircle className="w-4 h-4 text-destructive ml-auto" />
                                    )}
                                  </div>
                                );
                              })}
                              {/* Correct answer callout for wrong MCQ answers */}
                              {!isCorrect && !isUnanswered && (
                                <div className="mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                                  <span className="font-semibold text-green-600 dark:text-green-400">✅ Correct Answer: </span>
                                  <span className="text-green-700 dark:text-green-300">{q.correct_answer}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>


                        {isUnanswered && (
                          <p className="text-sm text-muted-foreground italic">
                            You did not answer this question
                          </p>
                        )}
                        {/* Explanation */}
                        {q.explanation && (
                          <div className="mt-1 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                            <span className="font-semibold text-primary">💡 Explanation: </span>
                            <span className="text-foreground/80">{q.explanation}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      )}
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareUrl={shareUrl}
        text="I just completed a quiz on StudyFlow! Try it out:"
      />
    </div>
  );
};
