import { format } from "date-fns";
import { Clock, FileText, Trash2, Eye, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuizSession } from "@/hooks/useQuiz";

interface QuizHistoryCardProps {
  session: QuizSession;
  onReview: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onResume?: (sessionId: string) => void;
}

export const QuizHistoryCard = ({
  session,
  onReview,
  onDelete,
  onResume,
}: QuizHistoryCardProps) => {
  const isCompleted = !!session.completed_at;
  const percentage = session.score && session.total_questions
    ? Math.round((session.score / session.total_questions) * 100)
    : 0;

  const getScoreColor = () => {
    if (!isCompleted) return "bg-muted text-muted-foreground";
    if (percentage >= 70) return "bg-green-500/20 text-green-600 dark:text-green-400";
    if (percentage >= 50) return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
    return "bg-red-500/20 text-red-600 dark:text-red-400";
  };

  const getTimeTaken = () => {
    if (!session.started_at || !session.completed_at) return null;
    const start = new Date(session.started_at).getTime();
    const end = new Date(session.completed_at).getTime();
    const seconds = Math.floor((end - start) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const timeTaken = getTimeTaken();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">
                {session.document_name || "General Quiz"}
              </span>
            </div>
            <Badge className={getScoreColor()}>
              {isCompleted ? `${percentage}%` : "Incomplete"}
            </Badge>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {isCompleted && session.score !== null && session.total_questions && (
              <span>
                Score: {session.score}/{session.total_questions}
              </span>
            )}
            {timeTaken && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeTaken}
              </span>
            )}
            <span>
              {format(new Date(session.created_at), "MMM d, yyyy")}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {isCompleted ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReview(session.id)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Review
              </Button>
            ) : (
              onResume && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResume(session.id)}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Resume
                </Button>
              )
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(session.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
