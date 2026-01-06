import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Course = {
  id: string;
  title: string;
  code: string;
  color: string;
};

const COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500"
];

const Courses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [open, setOpen] = useState(false);

  const fetchCourses = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (!error && data) setCourses(data);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, [user]);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAdding(true);

    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    const { error } = await supabase.from("courses").insert({
      user_id: user.id,
      title: newTitle,
      code: newCode,
      color: randomColor
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add course", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Course created!" });
      setOpen(false);
      setNewTitle("");
      setNewCode("");
      fetchCourses();
    }
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    await supabase.from("courses").delete().eq("id", id);
    fetchCourses();
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">My Courses</h1>
            <p className="text-muted-foreground mt-1">Manage your subjects.</p>
          </motion.div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Add Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Course</DialogTitle></DialogHeader>
              <form onSubmit={handleAddCourse} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Course Name</Label>
                  <Input placeholder="e.g. Physiology" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Course Code</Label>
                  <Input placeholder="e.g. PHY 201" value={newCode} onChange={e => setNewCode(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={isAdding}>
                  {isAdding ? <Loader2 className="animate-spin" /> : "Create Course"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
        ) : courses.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="group relative bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-all">
                <div className={`w-12 h-12 ${course.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-black/10`}>
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{course.code}</h3>
                <p className="text-muted-foreground">{course.title}</p>
                
                <button 
                  onClick={() => handleDelete(course.id)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 text-destructive rounded-md transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] border-2 border-dashed border-muted rounded-xl">
            <p className="text-muted-foreground">No courses yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Courses;
