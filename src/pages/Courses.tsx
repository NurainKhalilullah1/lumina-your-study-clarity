import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate } from "react-router-dom";

const Courses = () => {
  const navigate = useNavigate();
  // State is empty by default
  const [courses, setCourses] = useState<any[]>([]);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">My Courses</h1>
            <p className="text-muted-foreground mt-1">Manage your courses and study materials.</p>
          </motion.div>

          <Button
            onClick={() => {
              /* TODO: Open Add Course Modal */
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>

        {courses.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {/* Course mapping logic would go here */}
          </motion.div>
        ) : (
          // EMPTY STATE
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-muted rounded-xl bg-muted/10"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No courses yet</h3>
            <p className="text-muted-foreground max-w-sm text-center mb-6">
              Create your first course to start organizing your lecture slides and assignments.
            </p>
            <Button
              size="lg"
              onClick={() => {
                /* TODO: Open Add Course Modal */
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Courses;
