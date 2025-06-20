import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar is always expanded */}
      <AdminSidebar />
      
      {/* Header without toggle functionality */}
      <AdminHeader />
      
      <main className="flex-1 pt-16 transition-all duration-300 min-h-screen ml-64">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}