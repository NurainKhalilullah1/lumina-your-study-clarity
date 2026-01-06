import { motion } from "framer-motion";
import { CalendarCheck, Clock, CheckCircle2, Circle } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const mockAssignments = [
  { id: 1, title: "Physics Lab Report", course: "PHY 201", dueDate: "Today, 6:00 PM", status: "pending" },
  { id: 2, title: "Calculus Problem Set 5", course: "MAT 301", dueDate: "Tomorrow, 11:59 PM", status: "pending" },
  { id: 3, title: "Essay Draft: Climate Change", course: "ENG 102", dueDate: "Jan 8, 2026", status: "pending" },
  { id: 4, title: "Algorithm Analysis", course: "CSC 201", dueDate: "Jan 10, 2026", status: "pending" },
  { id: 5, title: "Weekly Reading Quiz", course: "ENG 102", dueDate: "Jan 3, 2026", status: "completed" },
  { id: 6, title: "Lab Experiment 4", course: "PHY 201", dueDate: "Jan 2, 2026", status: "completed" },
];

const Assignments = () => {
  const pending = mockAssignments.filter((a) => a.status === "pending");
  const completed = mockAssignments.filter((a) => a.status === "completed");

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground mt-1">Track your assignments and deadlines.</p>
        </motion.div>

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
          <div className="space-y-3">
            {pending.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{assignment.title}</p>
                  <p className="text-sm text-muted-foreground">{assignment.course}</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {assignment.dueDate}
                </span>
              </div>
            ))}
          </div>
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
          <div className="space-y-3">
            {completed.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 opacity-70"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate line-through">{assignment.title}</p>
                  <p className="text-sm text-muted-foreground">{assignment.course}</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {assignment.dueDate}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Assignments;
