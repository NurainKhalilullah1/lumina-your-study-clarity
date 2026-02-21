import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Shield, Loader2, Save, LogOut, BookOpen, Database, Info, Trash2, Download, Camera, GraduationCap } from "lucide-react";
import { exportUserDataAsPDF } from "@/utils/exportUserData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useProfile } from "@/hooks/useProfile";
import { UNIVERSITIES } from "@/constants/universities";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile state
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // University & Course state
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const [university, setUniversity] = useState("");
  const [customUniversity, setCustomUniversity] = useState("");
  const [courseOfStudy, setCourseOfStudy] = useState("");
  const [savingUniCourse, setSavingUniCourse] = useState(false);

  // Study preferences hook
  const {
    preferences,
    saving: savingPreferences,
    hasChanges: hasPreferenceChanges,
    updatePreference,
    savePreferences,
  } = useUserPreferences();

  // Load current name and avatar when page opens
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setName(user.user_metadata.full_name);
    }
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
    } else {
      // Also check the profiles table
      supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user?.id ?? "")
        .maybeSingle()
        .then(({ data }) => {
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        });
    }
  }, [user]);

  // Load university/course from profile
  useEffect(() => {
    if (profile) {
      if (profile.university) {
        const isPreset = UNIVERSITIES.includes(profile.university as any);
        setUniversity(isPreset ? profile.university : "Other");
        if (!isPreset) setCustomUniversity(profile.university);
      }
      if (profile.course_of_study) setCourseOfStudy(profile.course_of_study);
    }
  }, [profile]);

  const selectedUniversity = university === "Other" ? customUniversity : university;

  const handleSaveUniCourse = async () => {
    if (!user || !selectedUniversity || !courseOfStudy) return;
    setSavingUniCourse(true);
    try {
      await supabase.from("profiles").update({
        university: selectedUniversity,
        course_of_study: courseOfStudy,
      }).eq("id", user.id);

      await supabase.rpc("upsert_user_group", {
        p_university: selectedUniversity,
        p_course_of_study: courseOfStudy,
      });

      await refetchProfile();
      toast({ title: "Saved!", description: "Your university and course have been updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSavingUniCourse(false);
    }
  };

  // Function to Upload Avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPG, PNG, WEBP, or GIF image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Avatar must be under 5MB.", variant: "destructive" });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update auth metadata
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });

      // Update profiles table
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

      setAvatarUrl(publicUrl);
      toast({ title: "Profile picture updated!", description: "Your new profile picture has been saved." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Function to Save Name
  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name }
      });

      if (error) throw error;

      toast({ 
        title: "Profile Updated", 
        description: "Your display name has been changed." 
      });
      
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to Clear Chat History
  const handleClearChatHistory = async () => {
    if (!user) return;
    setIsClearingHistory(true);
    
    try {
      // Delete all chat sessions for this user (messages will cascade delete)
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Chat History Cleared",
        description: "All your AI tutor conversations have been deleted."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsClearingHistory(false);
    }
  };

  // Function to COMPLETELY Delete Account
  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      // Call the secure database function - this deletes from auth.users
      // All related data is automatically deleted via ON DELETE CASCADE
      const { error } = await supabase.rpc('delete_own_account');
      
      if (error) throw error;

      // If successful, sign out and redirect
      await signOut();
      toast({ title: "Account Deleted", description: "All your data has been erased. Goodbye!" });
      navigate("/", { replace: true });
      
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Error", 
        description: "Could not delete account. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const originalName = user?.user_metadata?.full_name ?? "";
  const hasNameChanged = name !== originalName;

  const handleExportData = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      await exportUserDataAsPDF(user.id, user.user_metadata?.full_name || user.email || 'User');
      toast({
        title: "Export Ready",
        description: "Your data export is ready. Use your browser's print dialog to save as PDF."
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Could not export your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your preferences and privacy.</p>
        </motion.div>

        {/* Profile Section */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Profile</h2>
          </div>
          
          <div className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Profile Picture</p>
                <p className="text-xs text-muted-foreground mb-2">JPG, PNG, WEBP or GIF · Max 5MB</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Camera className="mr-2 h-3 w-3" />}
                  {isUploadingAvatar ? "Uploading..." : avatarUrl ? "Change Photo" : "Upload Photo"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Enter your name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button 
                onClick={handleUpdateProfile} 
                disabled={loading || !hasNameChanged}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* University & Course Section */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">University & Course</h2>
            </div>
            <Button
              size="sm"
              onClick={handleSaveUniCourse}
              disabled={savingUniCourse || !selectedUniversity || !courseOfStudy}
            >
              {savingUniCourse ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>University</Label>
              <Select value={university} onValueChange={(val) => { setUniversity(val); if (val !== "Other") setCustomUniversity(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your university" />
                </SelectTrigger>
                <SelectContent>
                  {UNIVERSITIES.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {university === "Other" && (
                <Input
                  placeholder="Enter your university name"
                  value={customUniversity}
                  onChange={(e) => setCustomUniversity(e.target.value)}
                />
              )}
            </div>
            <div className="grid gap-2">
              <Label>Course of Study</Label>
              <Input
                placeholder="e.g. Computer Science"
                value={courseOfStudy}
                onChange={(e) => setCourseOfStudy(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Study Preferences Section */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Study Preferences</h2>
            </div>
            <Button
              size="sm"
              onClick={savePreferences}
              disabled={savingPreferences || !hasPreferenceChanges}
            >
              {savingPreferences ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Default Quiz Questions</p>
                <p className="text-sm text-muted-foreground">Number of questions per quiz</p>
              </div>
              <Select
                value={String(preferences.default_quiz_questions)}
                onValueChange={(val) => updatePreference("default_quiz_questions", parseInt(val))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Pomodoro Duration</p>
                <p className="text-sm text-muted-foreground">Default focus session length</p>
              </div>
              <Select
                value={String(preferences.pomodoro_duration)}
                onValueChange={(val) => updatePreference("pomodoro_duration", parseInt(val))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="25">25 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Data & Privacy Section */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Data & Privacy</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Clear Chat History</p>
                <p className="text-sm text-muted-foreground">Delete all AI tutor conversations</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all chat history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your AI tutor conversations. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearChatHistory} disabled={isClearingHistory}>
                      {isClearingHistory ? "Clearing..." : "Yes, Clear All"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Export My Data</p>
                <p className="text-sm text-muted-foreground">Download all your data as PDF</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2 mb-6">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">About</h2>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>StudyFlow v1.0.0</p>
            <p>Made with ❤️ for students everywhere</p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-primary hover:underline">Help Center</a>
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-destructive/30">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently remove all data</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account, all documents, courses, assignments, quizzes, flashcards, and chat history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
