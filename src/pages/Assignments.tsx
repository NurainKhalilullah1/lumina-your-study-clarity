import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, Clock, CheckCircle2, Plus, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";

const Assignments = () => {
  // Empty states
  const [pending, setPending] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Assignments</h1>
            <p className="text-muted-foreground mt-1">Track your assignments and deadlines.</p>
          </motion.div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </Button>
        </div>

        {/* Pending Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card rounded-xl p-6 shadow-sm border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Pending ({pending.length})</h2>
          </div>

          {pending.length > 0 ? (
            <div className="space-y-3">{/* List of pending assignments would go here */}</div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Inbox className="w-10 h-10 mb-3 opacity-20" />
              <p>No pending assignments.</p>
              <p className="text-sm">Enjoy your free time!</p>
            </div>
          )}
        </motion.div>

        {/* Completed Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-xl p-6 shadow-sm border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-foreground">Completed ({completed.length})</h2>
          </div>

          {completed.length > 0 ? (
            <div className="space-y-3">{/* List of completed assignments would go here */}</div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">No completed assignments yet.</div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Assignments;
