import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Upload, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AddAssignmentDialog } from "@/components/AddAssignmentDialog"; // Import the Dialog

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

  const [stats, setStats] = useState([
    { label: "Assignments Pending", value: 0, icon: ClipboardList, color: "text-primary" },
    { label: "Upcoming Exams", value: 0, icon: Calendar, color: "text-accent" },
    { label: "Study Hours", value: "0h", icon: Clock, color: "text-emerald-500" },
  ]);

  const [urgentAssignments, setUrgentAssignments] = useState<any[]>([]);

  // Function to fetch fresh data
  const fetchData = async () => {
    if (!user) return;

    // 1. Get Pending Assignments Count
    const { count: pendingCount } = await supabase
      .from("assignments")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", user.id)
      .eq("status", "pending");

    // 2. Get Urgent Assignments (Due in next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const { data: urgent } = await supabase
      .from("assignments")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lte("due_date", threeDaysFromNow.toISOString())
      .order("due_date", { ascending: true })
      .limit(3);

    // Update State
    setStats(prev => [
      { ...prev[0], value: pendingCount || 0 }, // Update pending count
      { ...prev[1], value: 0 }, // Exams placeholder
      { ...prev[2], value: "12h" } // Study hours placeholder
    ]);

    if (urgent) {
      setUrgentAssignments(urgent.map(a => ({
        ...a,
        dueIn: new Date(a.due_date).toLocaleDateString() // Simple date formatting
      })));
    }
  };

  // Fetch on load
  useEffect(() => {
    fetchData();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            {getGreeting()}, {userName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here is your academic overview.</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
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

        {/* Urgent Assignments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Due Soon</h2>
          </div>
          
          {urgentAssignments.length > 0 ? (
            <div className="space-y-3">
              {urgentAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">{assignment.course_name}</p>
                  </div>
                  <span className="text-sm font-medium text-destructive bg-destructive/10 px-3 py-1 rounded-full">
                    {assignment.dueIn}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-muted rounded-lg">
              <Sparkles className="w-8 h-8 text-primary/50 mb-2" />
              <p className="text-muted-foreground">No urgent deadlines!</p>
              {/* Insert the Add Modal here so they can add one right away */}
              <div className="mt-4">
                <AddAssignmentDialog onAssignmentAdded={fetchData} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" onClick={() => navigate('/tutor')}>
              <Upload className="w-4 h-4" /> Upload PDF
            </Button>
            
            {/* The Magic: Add Assignment Dialog is here now */}
            <AddAssignmentDialog onAssignmentAdded={fetchData} />
            
            <Button variant="secondary" className="gap-2" onClick={() => navigate('/tutor')}>
              <Sparkles className="w-4 h-4" /> Ask AI
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
