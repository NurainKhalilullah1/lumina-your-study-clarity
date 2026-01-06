import { motion } from "framer-motion";
import { BookOpen, FolderOpen } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const mockCourses = [
  { id: 1, code: "PHY 201", name: "Physics II", materials: 12, color: "bg-blue-500" },
  { id: 2, code: "MAT 301", name: "Calculus III", materials: 8, color: "bg-purple-500" },
  { id: 3, code: "ENG 102", name: "Academic Writing", materials: 15, color: "bg-emerald-500" },
  { id: 4, code: "CSC 201", name: "Data Structures", materials: 20, color: "bg-orange-500" },
];

const Courses = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground mt-1">Manage your courses and study materials.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {mockCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="bg-card rounded-xl p-6 shadow-sm border border-border cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div className={`w-12 h-12 ${course.color} rounded-xl flex items-center justify-center mb-4`}>
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{course.code}</h3>
              <p className="text-muted-foreground text-sm">{course.name}</p>
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <FolderOpen className="w-4 h-4" />
                <span>{course.materials} materials</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Courses;
