import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Clock, 
  CheckCircle,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizQuestion } from "@/hooks/useQuiz";

interface QuizInterfaceProps {
  questions: QuizQuestion[];
  timeLimitMinutes: number;
  onSaveAnswer: (questionId: string, answer: string) => void;
  onToggleFlag: (questionId: string, isFlagged: boolean) => void;
  onSubmit: () => void;
}

export const QuizInterface = ({
  questions,
  timeLimitMinutes,
  onSaveAnswer,
  onToggleFlag,
  onSubmit
}: QuizInterfaceProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes * 60);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      setShowTimeUpDialog(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: answer }));
    if (currentQuestion?.id) {
      onSaveAnswer(currentQuestion.id, answer);
    }
  };

  const handleToggleFlag = () => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentIndex)) {
      newFlagged.delete(currentIndex);
    } else {
      newFlagged.add(currentIndex);
    }
    setFlagged(newFlagged);
    if (currentQuestion?.id) {
      onToggleFlag(currentQuestion.id, newFlagged.has(currentIndex));
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, questions.length - 1)));
  };

  const handleSubmit = useCallback(() => {
    setShowSubmitDialog(false);
    setShowTimeUpDialog(false);
    onSubmit();
  }, [onSubmit]);

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (timeRemaining <= 60) return "text-destructive";
    if (timeRemaining <= 300) return "text-amber-500";
    return "text-foreground";
  };

  if (!currentQuestion) {
    return <div className="text-center p-8">Loading questions...</div>;
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      {/* Header with timer and progress */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Timer */}
          <div className={cn("flex items-center gap-2 font-mono text-xl font-bold", getTimerColor())}>
            <Clock className="w-5 h-5" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {/* Progress */}
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{answeredCount}/{questions.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Flag button */}
          <Button
            variant={flagged.has(currentIndex) ? "destructive" : "outline"}
            size="icon"
            onClick={handleToggleFlag}
            title="Flag for review"
          >
            <Flag className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Question */}
      <Card className="flex-1 p-6 mb-4 overflow-auto">
        <div className="space-y-6">
          {/* Question number and text */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Question {currentIndex + 1} of {questions.length}
              </span>
              {flagged.has(currentIndex) && (
                <span className="px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs">
                  Flagged
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <RadioGroup
            value={answers[currentIndex] || ""}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, idx) => {
              const optionLetter = option.charAt(0);
              const isSelected = answers[currentIndex] === optionLetter;
              
              return (
                <Label
                  key={idx}
                  className={cn(
                    "flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  )}
                >
                  <RadioGroupItem
                    value={optionLetter}
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mr-4 font-semibold text-sm",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {optionLetter}
                  </div>
                  <span className="flex-1">{option.slice(3)}</span>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </Label>
              );
            })}
          </RadioGroup>
        </div>
      </Card>

      {/* Question navigation grid */}
      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToQuestion(idx)}
              className={cn(
                "w-8 h-8 rounded-lg text-sm font-medium transition-all",
                idx === currentIndex && "ring-2 ring-primary ring-offset-2",
                answers[idx]
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
                flagged.has(idx) && "ring-2 ring-destructive"
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => goToQuestion(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentIndex === questions.length - 1 ? (
          <Button
            className="gradient-primary text-primary-foreground"
            onClick={() => setShowSubmitDialog(true)}
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Quiz
          </Button>
        ) : (
          <Button
            onClick={() => goToQuestion(currentIndex + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Submit confirmation dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  {questions.length - answeredCount} questions are still unanswered.
                </span>
              )}
              {flagged.size > 0 && (
                <span className="block mt-1 text-destructive">
                  {flagged.size} questions are flagged for review.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Submit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time's up dialog */}
      <AlertDialog open={showTimeUpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⏰ Time's Up!</AlertDialogTitle>
            <AlertDialogDescription>
              Your quiz time has ended. Your answers will be submitted automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSubmit}>
              View Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
