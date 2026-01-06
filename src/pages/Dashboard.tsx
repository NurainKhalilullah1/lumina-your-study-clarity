import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Calendar, Clock, AlertCircle, Upload, Plus, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";

// Helper to get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";

  // State for real data (Currently set to empty/zero)
  const [stats, setStats] = useState([
    { label: "Assignments Pending", value: 0, icon: ClipboardList, color: "text-primary" },
    { label: "Upcoming Exams", value: 0, icon: Calendar, color: "text-accent" },
    { label: "Study Hours", value: "0h", icon: Clock, color: "text-emerald-500" },
  ]);

  const [urgentAssignments, setUrgentAssignments] = useState<any[]>([]); // Empty array = No assignments

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {getGreeting()}, {userName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Ready to start your productive day?</p>
        </motion.div>

        {/* Stats Cards (Now showing 0) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {stats.map((stat, index) => (
            <div key={stat.label} className="bg-card rounded-xl p-5 shadow-sm border border-border">
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

        {/* Due Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-xl p-6 shadow-sm border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Due Soon</h2>
          </div>

          {/* EMPTY STATE LOGIC */}
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
            // This is what shows when there are no assignments
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-foreground">You're all caught up!</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1 mb-4">
                No upcoming deadlines. This is a great time to start a new assignment or upload a lecture slide.
              </p>
              <Button variant="outline" onClick={() => navigate("/assignments")}>
                Add Assignment
              </Button>
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
            <Button className="gap-2" onClick={() => navigate("/tutor")}>
              <Upload className="w-4 h-4" />
              Upload New PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/assignments")}>
              <Plus className="w-4 h-4" />
              Add Assignment
            </Button>
            <Button variant="secondary" className="gap-2" onClick={() => navigate("/tutor")}>
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
