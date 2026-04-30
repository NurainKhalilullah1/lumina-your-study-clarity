import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Plus, GraduationCap, BookOpen, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { downloadCalendarInvite, downloadBulkCalendarInvite } from "@/utils/calendarUtils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useGoogleAI } from "@/hooks/useGoogleAI";

// No more direct genAI initialization here

interface AddAssignmentDialogProps {
  onAssignmentAdded: () => void;
}

export function AddAssignmentDialog({ onAssignmentAdded }: AddAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Manual State
  const [date, setDate] = useState<Date>();
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [type, setType] = useState("assignment");
  
  // Smart Import State
  const [syllabusText, setSyllabusText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const { generateContent } = useGoogleAI();

  // --- 1. MANUAL SUBMIT (Single Calendar File) ---
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date || !title || !course) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("assignments").insert({
        user_id: user.id,
        title,
        course_name: course,
        status: "pending",
        due_date: date.toISOString(),
        priority: "medium",
        type
      });
      if (error) throw error;

      // AUTOMATIC DOWNLOAD
      downloadCalendarInvite(title, date, course);

      toast({ title: "Success", description: "Task added & Calendar invite downloaded!" });
      onAssignmentAdded();
      setOpen(false);
      setTitle(""); setCourse(""); setDate(undefined);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // --- 2. SMART IMPORT (Bulk Calendar File) ---
  const handleSmartImport = async () => {
    if (!syllabusText.trim() || !user) return;
    setIsAnalyzing(true);

    try {
      const prompt = `
        Extract deadlines from this text. Return a JSON array: 
        [{ "title": "Task Name", "date": "YYYY-MM-DD", "type": "exam"|"assignment", "course": "Course Name" }]
        TEXT: "${syllabusText}"
      `;

      const responseText = await generateContent(prompt);
      const tasks = JSON.parse(responseText.replace(/```json|```/g, "").trim());

      const { error } = await supabase.from("assignments").insert(
        tasks.map((task: any) => ({
          user_id: user.id,
          title: task.title,
          course_name: task.course || "General",
          status: "pending",
          due_date: new Date(task.date).toISOString(),
          priority: task.type === 'exam' ? 'high' : 'medium',
          type: task.type
        }))
      );

      if (error) throw error;

      // AUTOMATIC DOWNLOAD (One file for all tasks)
      downloadBulkCalendarInvite(tasks);

      toast({ title: "Imported!", description: `Added ${tasks.length} tasks & downloaded calendar file.` });
      onAssignmentAdded();
      setOpen(false);
      setSyllabusText("");
    } catch (error) {
      toast({ title: "Error", description: "Could not parse syllabus.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" />Add Task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
        
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="smart" className="flex gap-2"><Sparkles className="w-3 h-3 text-accent" /> Smart Import</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <RadioGroup defaultValue="assignment" value={type} onValueChange={setType} className="flex gap-4">
                  <div className="flex items-center space-x-2 border p-3 rounded-lg flex-1"><RadioGroupItem value="assignment" id="r1"/><Label htmlFor="r1">Assignment</Label></div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg flex-1"><RadioGroupItem value="exam" id="r2"/><Label htmlFor="r2">Exam</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Course</Label><Input value={course} onChange={e => setCourse(e.target.value)} required /></div>
              <div className="space-y-2 flex flex-col"><Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !date && "text-muted-foreground")}>{date ? format(date, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => d < new Date()} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <Button type="submit" disabled={loading} className="w-full mt-4">{loading ? <Loader2 className="animate-spin" /> : "Save & Download Invite"}</Button>
            </form>
          </TabsContent>

          <TabsContent value="smart">
             <div className="space-y-4">
               <Textarea placeholder="Paste syllabus here..." value={syllabusText} onChange={e => setSyllabusText(e.target.value)} className="h-32" />
               <Button onClick={handleSmartImport} disabled={isAnalyzing || !syllabusText} className="w-full bg-accent text-white hover:bg-accent/90">
                 {isAnalyzing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />} 
                 Auto-Import & Download
               </Button>
             </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
