import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";
import BottomNav from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut } from "lucide-react";
import { StudyFlowLogo } from "@/components/StudyFlowLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
  hideMobileHeader?: boolean;
}

const DashboardLayout = ({ children, hideMobileHeader }: DashboardLayoutProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    queryClient.clear();
    toast({ title: "Signed out", description: "You have been signed out successfully." });
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>
        <SidebarInset className="flex flex-col">
          {/* Mobile Header */}
          {!hideMobileHeader && (
            <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card md:hidden">
              <div className="flex items-center gap-2">
                <button onClick={handleSignOut} className="p-2 -ml-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
                <StudyFlowLogo size="md" variant="purple" />
                <span className="text-lg font-bold text-foreground">StudyFlow</span>
              </div>
              <ThemeToggle />
            </header>
          )}
          
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between h-14 px-4 border-b border-border bg-card">
            <SidebarTrigger />
            <ThemeToggle />
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
            {children}
          </main>
        </SidebarInset>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
