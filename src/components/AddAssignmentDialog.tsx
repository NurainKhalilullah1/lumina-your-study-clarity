import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { downloadCalendarInvite } from "@/utils/calendarUtils";

interface AddAssignmentDialogProps {
  onAssignmentAdded: () => void;
}

export function AddAssignmentDialog({ onAssignmentAdded }: AddAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
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
        course_name: course, // CHANGE: Save the course variable to the course_name column
        status: "pending",
        due_date: date.toISOString(),
        priority: "medium" 
      });

      if (error) throw error;

      if (addToCalendar) {
        downloadCalendarInvite(title, date, course);
      }

      toast({ title: "Assignment Added", description: "Good luck with your task!" });
      onAssignmentAdded();
      setOpen(false);
      
      setTitle("");
      setCourse("");
      setDate(undefined);

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
          New Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Physiology Lab Report" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
            <Label htmlFor="calendar" className="text-sm font-normal text-muted-foreground cursor-pointer">Add to my Calendar</Label>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Assignment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
