
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { HeaderSpacer } from '@/components/layout/Header';

interface AdminRouteProps {
  children: ReactNode;
}

// Layout for admin pages
const AdminLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader />
      <HeaderSpacer />
      <div className="flex flex-1">
        <AdminSidebar />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading, isAdmin, hasPermission } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const location = useLocation();
  
  // Verify admin access when the component mounts
  useEffect(() => {
    const verifyAdminAccess = async () => {
      
      try {
        // Short delay to ensure JWT has been processed
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if user has admin access permission
        const hasAdminAccess = hasPermission('admin.access');
        
        setVerifying(false);
      } catch (error) {
        setVerifying(false);
      }
    };
    
    if (!loading) {
      verifyAdminAccess();
    }
  }, [loading, hasPermission]);
  
  // Show loader while verifying and loading
  if (loading || verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Verifying admin access...</p>
      </div>
    );
  }
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If not admin, redirect to home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // Render admin layout with children if user is admin
  return <AdminLayout>{children}</AdminLayout>;
};
