import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, Inbox, Loader2, Calendar as CalendarIcon, BookOpen } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { AddAssignmentDialog } from "@/components/AddAssignmentDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, isValid } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";

// Updated Type Definition to match Database
type Assignment = {
  id: string;
  title: string;
  due_date: string;
  status: string;
  course_name: string | null; // Matches the SQL column we added
  priority: string;
};

const Assignments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  const fetchAssignments = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true });
    
    if (!error && data) {
      setAssignments(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const toggleStatus = async (e: React.MouseEvent, id: string, currentStatus: string) => {
    e.stopPropagation(); // Prevent opening the details sheet when clicking checkbox
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    await supabase.from("assignments").update({ status: newStatus }).eq("id", id);
  };

  // Safe Date Formatter
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, "PPP") : "Invalid date";
  };

  const pending = assignments.filter(a => a.status === "pending");
  const completed = assignments.filter(a => a.status === "completed");

  const AssignmentCard = ({ assignment }: { assignment: Assignment }) => (
    <Sheet>
      <SheetTrigger asChild>
        <div className="group flex items-center gap-3 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md">
          {/* Checkbox */}
          <div 
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${assignment.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground hover:border-primary'}`}
            onClick={(e) => toggleStatus(e, assignment.id, assignment.status)}
          >
            {assignment.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <p className={`font-medium truncate ${assignment.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {assignment.title}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {assignment.course_name && (
                <span className="flex items-center gap-1 text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                  <BookOpen className="w-3 h-3" />
                  {assignment.course_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {formatDate(assignment.due_date)}
              </span>
            </div>
          </div>
        </div>
      </SheetTrigger>
      
      {/* DETAILS SLIDE-OVER (The "Page" you expected) */}
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="text-xl">{assignment.title}</SheetTitle>
          <SheetDescription>Assignment Details</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Course</h4>
            <p className="text-base font-medium">{assignment.course_name || "General"}</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
            <p className="text-base font-medium">{formatDate(assignment.due_date)}</p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${assignment.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {assignment.status === 'pending' ? 'Pending' : 'Completed'}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground mt-1">Manage your academic workload.</p>
          </motion.div>
          <AddAssignmentDialog onAssignmentAdded={fetchAssignments} />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Pending Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Up Next ({pending.length})</h2>
              </div>
              
              {pending.length > 0 ? (
                <div className="grid gap-3">
                  {pending.map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-muted rounded-xl">
                  <Inbox className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">No pending assignments</p>
                  <p className="text-sm text-muted-foreground/60">Time to relax or study ahead!</p>
                </div>
              )}
            </motion.div>

            {/* Completed Section */}
            {completed.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4 pt-8">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-lg font-semibold text-foreground">Completed ({completed.length})</h2>
                </div>
                <div className="grid gap-3 opacity-60 hover:opacity-100 transition-opacity">
                  {completed.map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} />
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Assignments;
