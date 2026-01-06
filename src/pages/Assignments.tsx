import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, Inbox, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { AddAssignmentDialog } from "@/components/AddAssignmentDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type Assignment = {
  id: string;
  title: string;
  due_date: string;
  status: string;
  course_id: string | null;
};

const Assignments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

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

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    await supabase.from("assignments").update({ status: newStatus }).eq("id", id);
  };

  const pending = assignments.filter(a => a.status === "pending");
  const completed = assignments.filter(a => a.status === "completed");

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground mt-1">Track your assignments and deadlines.</p>
          </motion.div>
          <AddAssignmentDialog onAssignmentAdded={fetchAssignments} />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Pending ({pending.length})</h2>
              </div>
              {pending.length > 0 ? (
                <div className="space-y-3">
                  {pending.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-transparent hover:border-primary/20 transition-all">
                      <input type="checkbox" className="w-5 h-5 rounded border-gray-300 accent-primary cursor-pointer" checked={false} onChange={() => toggleStatus(assignment.id, "pending")} />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">Due: {format(new Date(assignment.due_date), "PPP")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Inbox className="w-10 h-10 mb-3 opacity-20" />
                  <p>No pending assignments.</p>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-6 shadow-sm border border-border opacity-80">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-semibold text-foreground">Completed ({completed.length})</h2>
              </div>
              {completed.length > 0 && (
                <div className="space-y-3">
                  {completed.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground line-through decoration-slate-400">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(assignment.id, "completed")}>Undo</Button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Assignments;
