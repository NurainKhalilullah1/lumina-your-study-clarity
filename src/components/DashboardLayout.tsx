import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <DashboardSidebar />
        <SidebarInset className="flex flex-col">
          {/* Mobile Header */}
          <header className="flex items-center gap-2 h-14 px-4 border-b border-border bg-card md:hidden">
            <SidebarTrigger className="-ml-1">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <span className="text-lg font-bold text-foreground">Lumina</span>
          </header>
          
          {/* Desktop Toggle */}
          <div className="hidden md:flex items-center h-14 px-4 border-b border-border bg-card">
            <SidebarTrigger />
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
