import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LogOut,
  ChevronDown,
  Home,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Remove sidebar toggle props
interface AdminHeaderProps {}

export function AdminHeader({}: AdminHeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "A";
    
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    
    return user.email?.charAt(0).toUpperCase() || "A";
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Improved home navigation that reliably takes you to the homepage
  const goToHomePage = () => {
    // Set a flag to indicate intentional navigation to homepage
    sessionStorage.setItem('intentionalHomeNavigation', 'true');
    
    // Use direct browser navigation to ensure we get a clean page load
    window.location.href = '/';
  };

  return (
    <header className="fixed top-0 z-40 bg-white border-b border-gray-200 h-16 transition-all duration-300 left-64 right-0">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold">
            Admin Panel
          </h2>
        </div>
        
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1 hover:bg-gray-100">
                <Avatar className="h-8 w-8 mr-1">
                  <AvatarFallback className="bg-[#f74f4f]/10 text-[#f74f4f]">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline-block text-sm">Admin</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Homepage navigation item using improved function */}
              <DropdownMenuItem 
                onClick={goToHomePage}
                className="cursor-pointer"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </DropdownMenuItem>
              
              {/* Profile navigation item */}
              <DropdownMenuItem 
                onClick={() => navigate('/profile/')}
                className="cursor-pointer"
              >
                <User className="h-4 w-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-500 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}