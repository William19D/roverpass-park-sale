import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard
} from "lucide-react";

// Remove collapsed prop from interface
interface AdminSidebarProps {}

// Define admin navigation items - removed Main Site link
const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard/",
    icon: LayoutDashboard,
  }
];

export function AdminSidebar({}: AdminSidebarProps) {
  const location = useLocation();
  
  return (
    <aside className="h-screen fixed top-0 left-0 z-50 bg-white border-r border-gray-200 w-64 overflow-hidden">
      <div className="h-full flex flex-col justify-between py-4">
        <div>
          {/* Logo Section */}
          <div className="flex items-center justify-center h-16 mb-6">
            <h1 className="text-xl font-bold text-[#f74f4f] px-4 whitespace-nowrap overflow-hidden text-ellipsis">
              RoverPass Admin
            </h1>
          </div>
          
          {/* Navigation Section */}
          <div className="px-2">
            <ul className="space-y-2">
              {adminNavItems.map((item) => {
                const isActive = location.pathname === item.href || 
                                location.pathname.startsWith(item.href);
                
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center py-2 px-3 rounded-md group transition-colors",
                        isActive 
                          ? "bg-[#f74f4f]/10 text-[#f74f4f]" 
                          : "hover:bg-gray-100"
                      )}
                    >
                      <item.icon className={cn(
                        "flex-shrink-0 w-5 h-5 transition-colors",
                        isActive 
                          ? "text-[#f74f4f]" 
                          : "text-gray-500 group-hover:text-[#f74f4f]"
                      )} />
                      
                      <span 
                        className={cn(
                          "ml-3 whitespace-nowrap",
                          isActive ? "font-medium" : ""
                        )}
                      >
                        {item.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;