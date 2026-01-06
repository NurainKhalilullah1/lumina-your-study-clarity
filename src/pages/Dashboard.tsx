import { motion } from "framer-motion";
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Upload, 
  Plus, 
  Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";

// Helper to get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Mock data
const stats = [
  { label: "Assignments Pending", value: 5, icon: ClipboardList, color: "text-primary" },
  { label: "Upcoming Exams", value: 2, icon: Calendar, color: "text-accent" },
  { label: "Study Hours", value: "12h", icon: Clock, color: "text-emerald-500" },
];

const urgentAssignments = [
  { id: 1, title: "Physics Lab Report", course: "PHY 201", dueIn: "6 hours" },
  { id: 2, title: "Calculus Problem Set", course: "MAT 301", dueIn: "23 hours" },
  { id: 3, title: "Essay Draft", course: "ENG 102", dueIn: "36 hours" },
];

const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {getGreeting()}, {userName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your studies today.</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-5 shadow-sm border border-border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Due Soon Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-xl p-6 shadow-sm border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Due Soon</h2>
          </div>
          
          {urgentAssignments.length > 0 ? (
            <div className="space-y-3">
              {urgentAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">{assignment.course}</p>
                  </div>
                  <span className="text-sm font-medium text-destructive bg-destructive/10 px-3 py-1 rounded-full">
                    {assignment.dueIn}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">All caught up! 🎉</p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card rounded-xl p-6 shadow-sm border border-border"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload New PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Assignment
            </Button>
            <Button variant="secondary" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Ask AI
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
