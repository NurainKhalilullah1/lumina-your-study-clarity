import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";
import BottomNav from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col">
          {/* Mobile Header */}
          <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-card md:hidden">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <span className="text-lg font-bold text-foreground">StudyFlow</span>
            </div>
            <ThemeToggle />
          </header>
          
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
