import { useMemo } from "react";
import { format, subDays, startOfDay } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Award, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuizHistory } from "@/hooks/useQuiz";

export const QuizAnalytics = () => {
  const { user } = useAuth();
  const { data: sessions = [], isLoading } = useQuizHistory(user?.id || null);

  const completedSessions = useMemo(() => 
    sessions.filter(s => s.completed_at && s.score !== null && s.total_questions),
    [sessions]
  );

  const analytics = useMemo(() => {
    if (completedSessions.length === 0) {
      return {
        trendData: [],
        subjectData: [],
        averageScore: 0,
        bestScore: 0,
        totalQuizzes: 0,
        recentTrend: 0,
        improvementRate: 0,
      };
    }

    // Calculate scores
    const scores = completedSessions.map(s => ({
      score: Math.round((s.score! / s.total_questions!) * 100),
      date: new Date(s.created_at),
      name: s.document_name || "General",
    }));

    const totalQuizzes = scores.length;
    const averageScore = Math.round(scores.reduce((acc, s) => acc + s.score, 0) / totalQuizzes);
    const bestScore = Math.max(...scores.map(s => s.score));

    // Trend data - last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 6 - i));
      const dayScores = scores.filter(s => 
        startOfDay(s.date).getTime() === date.getTime()
      );
      const avgScore = dayScores.length > 0
        ? Math.round(dayScores.reduce((acc, s) => acc + s.score, 0) / dayScores.length)
        : null;
      
      return {
        date: format(date, "EEE"),
        fullDate: format(date, "MMM d"),
        score: avgScore,
        quizzes: dayScores.length,
      };
    });

    // Subject/document performance
    const subjectMap = new Map<string, number[]>();
    scores.forEach(s => {
      const name = s.name.length > 15 ? s.name.slice(0, 15) + "..." : s.name;
      if (!subjectMap.has(name)) subjectMap.set(name, []);
      subjectMap.get(name)!.push(s.score);
    });

    const subjectData = Array.from(subjectMap.entries())
      .map(([name, scoresArr]) => ({
        name,
        avgScore: Math.round(scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length),
        count: scoresArr.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent trend (comparing last 3 vs previous 3)
    const sortedByDate = [...scores].sort((a, b) => b.date.getTime() - a.date.getTime());
    let recentTrend = 0;
    if (sortedByDate.length >= 4) {
      const recent3 = sortedByDate.slice(0, 3).reduce((acc, s) => acc + s.score, 0) / 3;
      const previous3 = sortedByDate.slice(3, 6).reduce((acc, s) => acc + s.score, 0) / Math.min(3, sortedByDate.length - 3);
      recentTrend = Math.round(recent3 - previous3);
    }

    return {
      trendData: last7Days,
      subjectData,
      averageScore,
      bestScore,
      totalQuizzes,
      recentTrend,
    };
  }, [completedSessions]);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (completedSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Quiz Performance
          </CardTitle>
          <CardDescription>Track your quiz scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No quiz data yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Complete quizzes to see your performance trends
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return "hsl(var(--chart-2))";
    if (score >= 50) return "hsl(var(--chart-4))";
    return "hsl(var(--chart-5))";
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalQuizzes}</p>
                <p className="text-xs text-muted-foreground">Quizzes Taken</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <Target className="w-4 h-4 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.averageScore}%</p>
                <p className="text-xs text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <Award className="w-4 h-4 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.bestScore}%</p>
                <p className="text-xs text-muted-foreground">Best Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${analytics.recentTrend >= 0 ? "bg-chart-2/10" : "bg-destructive/10"}`}>
                {analytics.recentTrend >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-chart-2" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {analytics.recentTrend >= 0 ? "+" : ""}{analytics.recentTrend}%
                </p>
                <p className="text-xs text-muted-foreground">Recent Trend</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Trend Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            Quiz Score Trend
            {analytics.recentTrend !== 0 && (
              <Badge variant={analytics.recentTrend > 0 ? "default" : "secondary"} className="ml-2">
                {analytics.recentTrend > 0 ? "Improving" : "Needs focus"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Your average quiz scores over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(label, payload) => {
                    const data = payload?.[0]?.payload;
                    return data?.fullDate || label;
                  }}
                  formatter={(value, name) => [value ? `${value}%` : "No quizzes", "Score"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance */}
      {analytics.subjectData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Performance by Document</CardTitle>
            <CardDescription>Average scores across different study materials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.subjectData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    width={100}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value}%`, "Avg Score"]}
                  />
                  <Bar dataKey="avgScore" radius={[0, 4, 4, 0]}>
                    {analytics.subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreColor(entry.avgScore)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
