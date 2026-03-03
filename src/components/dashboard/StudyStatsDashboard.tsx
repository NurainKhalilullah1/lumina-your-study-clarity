import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useStudyStats } from "@/hooks/useStudyStats";
import { Timer, Layers, FileText, Flame, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
}

const StatCard = ({ title, value, subtitle, icon: Icon, gradient, iconColor }: StatCardProps) => (
  <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
    <div className={cn(
      "absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity",
      "bg-gradient-to-br",
      gradient
    )} />
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        "bg-gradient-to-br",
        gradient
      )}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </CardContent>
  </Card>
);

export const StudyStatsDashboard = () => {
  const { user } = useAuth();
  const { stats, isLoading } = useStudyStats(user?.id);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Study Statistics</h2>
          <p className="text-muted-foreground">Your learning progress this month</p>
        </div>
        {stats.streakDays > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full border border-primary/20">
            <Flame className="w-5 h-5 text-primary" />
            <span className="font-semibold">{stats.streakDays} day streak!</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Pomodoro Sessions"
          value={stats.pomodoroCompleted}
          subtitle="Focus sessions completed"
          icon={Timer}
          gradient="from-primary/20 to-accent/20"
          iconColor="text-primary"
        />
        
        <StatCard
          title="Flashcards Reviewed"
          value={stats.flashcardsReviewed}
          subtitle="Cards studied"
          icon={Layers}
          gradient="from-accent/20 to-primary/20"
          iconColor="text-accent"
        />
        
        <StatCard
          title="Documents Analyzed"
          value={stats.documentsAnalyzed}
          subtitle="PDFs & files processed"
          icon={FileText}
          gradient="from-secondary/30 to-muted/30"
          iconColor="text-secondary-foreground"
        />
        
        <StatCard
          title="Study Time"
          value={formatMinutes(stats.totalStudyMinutes)}
          subtitle="Total focus time"
          icon={TrendingUp}
          gradient="from-muted/30 to-secondary/30"
          iconColor="text-muted-foreground"
        />
        
        <StatCard
          title="Today's Activity"
          value={stats.todayEvents}
          subtitle="Events today"
          icon={Calendar}
          gradient="from-primary/15 to-accent/15"
          iconColor="text-primary"
        />
        
        <StatCard
          title="Current Streak"
          value={`${stats.streakDays} days`}
          subtitle="Keep it up!"
          icon={Flame}
          gradient="from-accent/15 to-primary/15"
          iconColor="text-accent"
        />
      </div>

      {/* Weekly activity chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-32">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const dayEvents = stats.weeklyEvents.filter(e => {
                const eventDay = new Date(e.created_at).getDay();
                // Convert Sunday=0 to Sunday=6 for display
                const adjustedDay = eventDay === 0 ? 6 : eventDay - 1;
                return adjustedDay === i;
              }).length;
              
              const maxHeight = Math.max(...['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((_, idx) => 
                stats.weeklyEvents.filter(e => {
                  const eventDay = new Date(e.created_at).getDay();
                  const adjustedDay = eventDay === 0 ? 6 : eventDay - 1;
                  return adjustedDay === idx;
                }).length
              ), 1);
              
              const height = dayEvents > 0 ? Math.max((dayEvents / maxHeight) * 100, 10) : 5;
              
              return (
                <div key={day} className="flex flex-col items-center gap-2 flex-1">
                  <div 
                    className={cn(
                      "w-full rounded-t-md transition-all duration-300",
                      dayEvents > 0 
                        ? "gradient-primary" 
                        : "bg-muted"
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
