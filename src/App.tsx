import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layouts/DashboardLayout";

// Shared Logic Entry
import Dashboard from "./pages/dashboard/Dashboard";

// Student Pages
import StudentProfile from "./pages/dashboard/student/StudentProfile";
import StudentBrowse from "./pages/dashboard/student/BrowseProjects";
import MyBids from "./pages/dashboard/student/MyBids";
import StudentMilestones from "./pages/dashboard/student/Milestones";
import StudentWorkspace from "./pages/dashboard/student/Workspace";
import StudentPayments from "./pages/dashboard/student/Payments";
import TeamManagement from "./pages/dashboard/student/TeamManagement";
import StudentReviews from "./pages/dashboard/student/StudentReviews";
import StudentSettings from "./pages/dashboard/student/StudentSettings";
import WonProjects from "./pages/dashboard/student/WonProjects";

// Company Pages
import CompanyProfile from "./pages/dashboard/company/CompanyProfile";
import PostProject from "./pages/dashboard/company/PostProject";
import ViewBids from "./pages/dashboard/company/ViewBids";
import ActiveProjects from "./pages/dashboard/company/ActiveProjects";
import CompanyMilestones from "./pages/dashboard/company/Milestones";
import CompanyWorkspace from "./pages/dashboard/company/Workspace";
import CompanyPayments from "./pages/dashboard/company/Payments";
import CompanyReviews from "./pages/dashboard/company/CompanyReviews";
import CompanySettings from "./pages/dashboard/company/CompanySettings";

// Admin Pages
import AdminProfile from "./pages/dashboard/admin/AdminProfile";
import AdminUsers from "./pages/dashboard/admin/AdminUsers";
import AdminAnalytics from "./pages/dashboard/admin/Analytics";
import AdminDisputes from "./pages/dashboard/admin/Disputes";
import AdminVerification from "./pages/dashboard/admin/Verification";
import AdminSettings from "./pages/dashboard/admin/AdminSettings";

const queryClient = new QueryClient();

// Dynamic Component Router based on current user role
const RoleRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { profile, loading, user } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  // If no user at all, redirect to auth
  if (!user) return <Navigate to="/auth" />;

  // If profile isn't loaded yet or role doesn't match, return null to avoid sibling redirects
  if (!profile || !allowedRoles.includes(profile.role)) return null;

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Dashboard Root */}
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />

            {/* Profile - Role Specific */}
            <Route path="/dashboard/profile" element={
              <DashboardLayout>
                <RoleRoute allowedRoles={['student']}><StudentProfile /></RoleRoute>
                <RoleRoute allowedRoles={['company']}><CompanyProfile /></RoleRoute>
                <RoleRoute allowedRoles={['admin']}><AdminProfile /></RoleRoute>
              </DashboardLayout>
            } />

            {/* Settings - Role Specific */}
            <Route path="/dashboard/settings" element={
              <DashboardLayout>
                <RoleRoute allowedRoles={['student']}><StudentSettings /></RoleRoute>
                <RoleRoute allowedRoles={['company']}><CompanySettings /></RoleRoute>
                <RoleRoute allowedRoles={['admin']}><AdminSettings /></RoleRoute>
              </DashboardLayout>
            } />

            {/* Reviews - Role Specific */}
            <Route path="/dashboard/reviews" element={
              <DashboardLayout>
                <RoleRoute allowedRoles={['student']}><StudentReviews /></RoleRoute>
                <RoleRoute allowedRoles={['company']}><CompanyReviews /></RoleRoute>
              </DashboardLayout>
            } />

            {/* Projects/Bids - Role Specific */}
            <Route path="/dashboard/projects" element={
              <DashboardLayout>
                <RoleRoute allowedRoles={['student']}><StudentBrowse /></RoleRoute>
                <RoleRoute allowedRoles={['company']}><ActiveProjects /></RoleRoute>
              </DashboardLayout>
            } />

            <Route path="/dashboard/bids" element={
              <DashboardLayout>
                <RoleRoute allowedRoles={['student']}><MyBids /></RoleRoute>
                <RoleRoute allowedRoles={['company']}><ViewBids /></RoleRoute>
              </DashboardLayout>
            } />

            <Route path="/dashboard/won-projects" element={
              <DashboardLayout>
                <RoleRoute allowedRoles={['student']}><WonProjects /></RoleRoute>
              </DashboardLayout>
            } />

            {/* Workflow - Role Specific */}
            <Route path="/dashboard/milestones" element={
              <DashboardLayout>
                <RoleRoute allowedRoles={['student']}><StudentMilestones /></RoleRoute>
                <RoleRoute allowedRoles={['company']}><CompanyMilestones /></RoleRoute>
              </DashboardLayout>
            } />

            <Route path="/dashboard/deliverables" element={
              <DashboardLayout>
                <RoleRoute allowedRoles={['student']}><StudentMilestones /></RoleRoute>
              </DashboardLayout>
            } />

            <Route path="/dashboard/workspace" element={
              <DashboardLayout>
                <RoleRoute allowedRoles={['student']}><StudentWorkspace /></RoleRoute>
                <RoleRoute allowedRoles={['company']}><CompanyWorkspace /></RoleRoute>
              </DashboardLayout>
            } />

            <Route path="/dashboard/payments" element={
              <DashboardLayout>
                <RoleRoute allowedRoles={['student']}><StudentPayments /></RoleRoute>
                <RoleRoute allowedRoles={['company']}><CompanyPayments /></RoleRoute>
              </DashboardLayout>
            } />

            <Route path="/dashboard/earnings" element={
              <DashboardLayout>
                <RoleRoute allowedRoles={['student']}><StudentPayments /></RoleRoute>
              </DashboardLayout>
            } />

            {/* Student Specific URLs */}
            <Route path="/dashboard/teams" element={<DashboardLayout><RoleRoute allowedRoles={['student']}><TeamManagement /></RoleRoute></DashboardLayout>} />

            {/* Company Specific URLs */}
            <Route path="/dashboard/post-project" element={<DashboardLayout><RoleRoute allowedRoles={['company']}><PostProject /></RoleRoute></DashboardLayout>} />
            <Route path="/dashboard/select-leader" element={<DashboardLayout><RoleRoute allowedRoles={['company']}><ViewBids /></RoleRoute></DashboardLayout>} />

            {/* Admin Specific URLs */}
            <Route path="/dashboard/analytics" element={<DashboardLayout><RoleRoute allowedRoles={['admin', 'student']}><AdminAnalytics /></RoleRoute></DashboardLayout>} />
            <Route path="/dashboard/users" element={<DashboardLayout><RoleRoute allowedRoles={['admin']}><AdminUsers /></RoleRoute></DashboardLayout>} />
            <Route path="/dashboard/companies" element={<DashboardLayout><RoleRoute allowedRoles={['admin']}><AdminUsers /></RoleRoute></DashboardLayout>} />
            <Route path="/dashboard/disputes" element={<DashboardLayout><RoleRoute allowedRoles={['admin']}><AdminDisputes /></RoleRoute></DashboardLayout>} />
            <Route path="/dashboard/verification" element={<DashboardLayout><RoleRoute allowedRoles={['admin']}><AdminVerification /></RoleRoute></DashboardLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
