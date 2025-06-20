import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import BrokerDashboard from "./pages/BrokerDashboard";
import AddListing from "./pages/AddListing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword"; 
import AuthenticationSuccess from "./pages/AuthenticationSuccess";
import AuthCallback from "./pages/AuthCallback";
import EmailVerification from "./pages/EmailVerification";
import ListingEdit from "./pages/ListingEdit";
import UserProfile from "./pages/UserProfile";
import Support from "./pages/Support";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import SupportTickets from "./pages/admin/SupportTickets";

// Components
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Header, HeaderSpacer } from "@/components/layout/Header";
import { AdminRoute } from "@/components/admin/AdminRoute";

const queryClient = new QueryClient();

// Update the path prefix logic to work correctly in all environments
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isVercelProduction = import.meta.env.PROD && window.location.hostname === 'roverpass-park-sale.vercel.app';

// Don't use prefix for localhost or Vercel production
const PATH_PREFIX = isLocalhost || isVercelProduction ? '' : '/rv-parks-for-sale';

// Admin redirect component - DISABLED to allow admins free navigation
const AdminRedirect = () => {
  // This component now does nothing - just returns null
  return null;
};

// Route handling component
const AppRoutes = () => {
  const { user, loading, isAdmin, roles } = useAuth();
  const location = useLocation();
  
  // Add additional debug logging for refresh issues
  useEffect(() => {
    console.log(`[Router] Current URL: ${window.location.href}`);
    console.log(`[Router] Current pathname: ${location.pathname}`);
    console.log(`[Router] PATH_PREFIX: ${PATH_PREFIX}`);
  }, [location]);
  
  // Detect admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Debug logging
  useEffect(() => {
    console.log(`[Router] Route changed to: ${location.pathname}`);
    console.log(`[Router] Current auth state - User: ${user?.id || 'none'}`);
    console.log(`[Router] Is admin: ${isAdmin}, Roles: ${roles?.join(', ') || 'none'}`);
  }, [location.pathname, user, isAdmin, roles]);
  
  // Show loader during authentication verification
  if (loading && !isAdminRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }
  
  return (
    <>
      {/* Add AdminRedirect component to handle admin redirections */}
      <AdminRedirect />
      
      {/* Only show header on non-admin routes */}
      {!isAdminRoute && (
        <>
          <Header />
          <HeaderSpacer />
        </>
      )}
      
      <Routes>
        {/* Public routes - No more automatic admin redirects */}
        <Route path="/" element={<Index />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/support" element={<Support />} />
        
        {/* User Profile route */}
        <Route path="/profile" element={
          user ? <UserProfile /> : <Navigate to="/login" state={{ from: location }} replace />
        } />
        
        {/* Admin routes - reduced to only Dashboard and Support Tickets */}
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/support" element={
          <AdminRoute>
            <SupportTickets />
          </AdminRoute>
        } />
        
        {/* Protected routes */}
        <Route path="/broker/dashboard" element={
          user ? <BrokerDashboard /> : <Navigate to="/login" state={{ from: location }} replace />
        } />
        <Route path="/listings/new" element={
          user ? <AddListing /> : <Navigate to="/login" state={{ from: location }} replace />
        } />
        <Route path="/listings/:id/edit" element={
          user ? (ListingEdit ? <ListingEdit /> : <div>Loading editor...</div>) : <Navigate to="/login" state={{ from: location }} replace />
        } />
        
        {/* Authentication routes */}
        <Route path="/login" element={
          user ? (
            isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/" replace />
          ) : <Login />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/" replace /> : <Register />
        } />
        <Route path="/forgot-password" element={
          user ? <Navigate to="/" replace /> : <ForgotPassword />
        } />
        
        {/* Auth processing routes */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/success" element={<AuthenticationSuccess />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/verify-email" element={<EmailVerification />} />

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={PATH_PREFIX}>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;