import { format } from "date-fns";
import { X, CheckCircle2, XCircle, MinusCircle, Clock, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { QuizSession, QuizQuestion } from "@/hooks/useQuiz";

interface QuizReviewModalProps {
  session: QuizSession | null;
  questions: QuizQuestion[];
  isOpen: boolean;
  onClose: () => void;
}

export const QuizReviewModal = ({
  session,
  questions,
  isOpen,
  onClose,
}: QuizReviewModalProps) => {
  if (!session) return null;

  const percentage = session.score && session.total_questions
    ? Math.round((session.score / session.total_questions) * 100)
    : 0;

  const getTimeTaken = () => {
    if (!session.started_at || !session.completed_at) return null;
    const start = new Date(session.started_at).getTime();
    const end = new Date(session.completed_at).getTime();
    const seconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getPerformanceColor = () => {
    if (percentage >= 70) return "text-green-600 dark:text-green-400";
    if (percentage >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getQuestionStatus = (question: QuizQuestion) => {
    if (!question.user_answer) return "skipped";
    return question.user_answer === question.correct_answer ? "correct" : "wrong";
  };

  const correctCount = questions.filter(q => q.user_answer === q.correct_answer).length;
  const wrongCount = questions.filter(q => q.user_answer && q.user_answer !== q.correct_answer).length;
  const skippedCount = questions.filter(q => !q.user_answer).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5" />
                {session.document_name || "Quiz Review"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {format(new Date(session.created_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className={`text-2xl font-bold ${getPerformanceColor()}`}>
                {percentage}%
              </div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {correctCount}
              </div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/10">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {wrongCount}
              </div>
              <div className="text-xs text-muted-foreground">Wrong</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-muted-foreground">
                {skippedCount}
              </div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
          </div>

          {getTimeTaken() && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
              <Clock className="w-4 h-4" />
              Time taken: {getTimeTaken()}
            </div>
          )}

          <Progress value={percentage} className="mt-3 h-2" />
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {questions.map((question, index) => {
              const status = getQuestionStatus(question);
              return (
                <div
                  key={question.id || index}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">
                      {status === "correct" && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {status === "wrong" && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      {status === "skipped" && (
                        <MinusCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          Q{question.question_number}
                        </Badge>
                        {question.is_flagged && (
                          <Badge variant="secondary" className="text-xs">
                            Flagged
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">{question.question}</p>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 ml-8">
                    {question.options.map((option, optIndex) => {
                      const optionLetter = option.charAt(0);
                      const isCorrect = optionLetter === question.correct_answer;
                      const isUserAnswer = optionLetter === question.user_answer;
                      const isWrongUserAnswer = isUserAnswer && !isCorrect;

                      let optionClass = "p-3 rounded-md border text-sm";
                      if (isCorrect) {
                        optionClass += " bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300";
                      } else if (isWrongUserAnswer) {
                        optionClass += " bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300";
                      } else {
                        optionClass += " bg-muted/30 border-border";
                      }

                      return (
                        <div key={optIndex} className={optionClass}>
                          <div className="flex items-center gap-2">
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            )}
                            {isWrongUserAnswer && (
                              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                            )}
                            <span>{option}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Button onClick={onClose} className="w-full">
            Close Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
