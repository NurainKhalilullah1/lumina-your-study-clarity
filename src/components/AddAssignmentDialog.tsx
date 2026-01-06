import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Plus, GraduationCap, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { downloadCalendarInvite } from "@/utils/calendarUtils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddAssignmentDialogProps {
  onAssignmentAdded: () => void;
}

export function AddAssignmentDialog({ onAssignmentAdded }: AddAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [type, setType] = useState("assignment"); // Default type
  const [addToCalendar, setAddToCalendar] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date || !title || !course) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("assignments").insert({
        user_id: user.id,
        title: title,
        course_name: course,
        status: "pending",
        due_date: date.toISOString(),
        priority: "medium",
        type: type // Save the type (exam/assignment)
      });

      if (error) throw error;

      if (addToCalendar) {
        // Add emoji based on type
        const icon = type === 'exam' ? '🎓' : '📚';
        downloadCalendarInvite(`${icon} ${title}`, date, course);
      }

      toast({ title: "Success", description: `${type === 'exam' ? 'Exam' : 'Assignment'} added successfully!` });
      onAssignmentAdded();
      setOpen(false);
      
      // Reset
      setTitle("");
      setCourse("");
      setDate(undefined);
      setType("assignment");

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Task Type</Label>
            <RadioGroup defaultValue="assignment" value={type} onValueChange={setType} className="flex gap-4">
              <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                <RadioGroupItem value="assignment" id="r1" />
                <Label htmlFor="r1" className="cursor-pointer flex items-center gap-2"><BookOpen className="w-4 h-4"/> Assignment</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-all">
                <RadioGroupItem value="exam" id="r2" />
                <Label htmlFor="r2" className="cursor-pointer flex items-center gap-2"><GraduationCap className="w-4 h-4"/> Exam</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder={type === 'exam' ? "e.g. Finals: Anatomy" : "e.g. Lab Report"} value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course">Course Name</Label>
            <Input id="course" placeholder="e.g. PHY 201" value={course} onChange={(e) => setCourse(e.target.value)} required />
          </div>

          <div className="space-y-2 flex flex-col">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !date && "text-muted-foreground")}>
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} disabled={(date) => date < new Date()} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="calendar" checked={addToCalendar} onChange={(e) => setAddToCalendar(e.target.checked)} className="accent-primary h-4 w-4 rounded"/>
            <Label htmlFor="calendar" className="text-sm font-normal text-muted-foreground cursor-pointer">Add to Calendar</Label>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save {type === 'exam' ? 'Exam' : 'Assignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
