import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ClipboardList, TrendingUp, Award, BookOpen, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuizHistory, useQuizQuestions, useDeleteQuizSession, type QuizSession } from "@/hooks/useQuiz";
import { QuizHistoryCard } from "@/components/quiz/QuizHistoryCard";
import { QuizReviewModal } from "@/components/quiz/QuizReviewModal";

export default function QuizHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuizHistory(user?.id || null);
  const { data: reviewQuestions = [] } = useQuizQuestions(reviewSessionId);
  const deleteSession = useDeleteQuizSession();

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    if (filter === "completed") return !!session.completed_at;
    if (filter === "incomplete") return !session.completed_at;
    return true;
  });

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (sortBy === "score") {
      const scoreA = a.score && a.total_questions ? (a.score / a.total_questions) : 0;
      const scoreB = b.score && b.total_questions ? (b.score / b.total_questions) : 0;
      return scoreB - scoreA;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Stats
  const completedSessions = sessions.filter(s => s.completed_at);
  const totalQuizzes = completedSessions.length;
  const averageScore = totalQuizzes > 0
    ? Math.round(
        completedSessions.reduce((acc, s) => {
          const pct = s.score && s.total_questions ? (s.score / s.total_questions) * 100 : 0;
          return acc + pct;
        }, 0) / totalQuizzes
      )
    : 0;
  const bestScore = totalQuizzes > 0
    ? Math.round(
        Math.max(
          ...completedSessions.map(s => 
            s.score && s.total_questions ? (s.score / s.total_questions) * 100 : 0
          )
        )
      )
    : 0;

  const reviewSession = reviewSessionId 
    ? sessions.find(s => s.id === reviewSessionId) || null 
    : null;

  const handleReview = (sessionId: string) => {
    setReviewSessionId(sessionId);
  };

  const handleDelete = async () => {
    if (!deleteSessionId) return;
    
    try {
      await deleteSession.mutateAsync(deleteSessionId);
      toast({
        title: "Quiz deleted",
        description: "The quiz session has been removed.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete quiz session.",
        variant: "destructive",
      });
    } finally {
      setDeleteSessionId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-primary" />
              Quiz History
            </h1>
            <p className="text-muted-foreground mt-1">
              Review your past quizzes and track your progress
            </p>
          </div>
          <Button onClick={() => navigate("/tutor")}>
            <BookOpen className="w-4 h-4 mr-2" />
            Take New Quiz
          </Button>
        </motion.div>

        {/* Stats Cards */}
        {totalQuizzes > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalQuizzes}</p>
                  <p className="text-sm text-muted-foreground">Quizzes Taken</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{averageScore}%</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Award className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bestScore}%</p>
                  <p className="text-sm text-muted-foreground">Best Score</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Newest First</SelectItem>
              <SelectItem value="score">Highest Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quiz List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedSessions.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center space-y-4">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No quiz history yet</h3>
                <p className="text-muted-foreground mt-1">
                  Take your first quiz to see your progress here
                </p>
              </div>
              <Button onClick={() => navigate("/tutor")}>
                Start a Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSessions.map((session) => (
              <QuizHistoryCard
                key={session.id}
                session={session}
                onReview={handleReview}
                onDelete={setDeleteSessionId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <QuizReviewModal
        session={reviewSession}
        questions={reviewQuestions}
        isOpen={!!reviewSessionId}
        onClose={() => setReviewSessionId(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this quiz session and all its questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
