import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="font-display text-lg font-semibold">{title}</h1>
            </div>
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || "Admin"}
            </span>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
