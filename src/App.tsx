import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/layouts/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/dashboard/Profile";
import BrowseProjects from "./pages/dashboard/BrowseProjects";
import MyBids from "./pages/dashboard/MyBids";
import PostProject from "./pages/dashboard/PostProject";
import ViewBids from "./pages/dashboard/ViewBids";
import TeamManagement from "./pages/dashboard/TeamManagement";
import Milestones from "./pages/dashboard/Milestones";
import Workspace from "./pages/dashboard/Workspace";
import Payments from "./pages/dashboard/Payments";
import Reviews from "./pages/dashboard/Reviews";
import Analytics from "./pages/dashboard/Analytics";
import SettingsPage from "./pages/dashboard/Settings";
import AdminUsers from "./pages/dashboard/AdminUsers";

const queryClient = new QueryClient();

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
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="/dashboard/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />
            <Route path="/dashboard/projects" element={<DashboardLayout><BrowseProjects /></DashboardLayout>} />
            <Route path="/dashboard/bids" element={<DashboardLayout><MyBids /></DashboardLayout>} />
            <Route path="/dashboard/post-project" element={<DashboardLayout><PostProject /></DashboardLayout>} />
            <Route path="/dashboard/select-leader" element={<DashboardLayout><ViewBids /></DashboardLayout>} />
            <Route path="/dashboard/won-projects" element={<DashboardLayout><BrowseProjects /></DashboardLayout>} />
            <Route path="/dashboard/teams" element={<DashboardLayout><TeamManagement /></DashboardLayout>} />
            <Route path="/dashboard/milestones" element={<DashboardLayout><Milestones /></DashboardLayout>} />
            <Route path="/dashboard/workspace" element={<DashboardLayout><Workspace /></DashboardLayout>} />
            <Route path="/dashboard/deliverables" element={<DashboardLayout><Milestones /></DashboardLayout>} />
            <Route path="/dashboard/earnings" element={<DashboardLayout><Payments /></DashboardLayout>} />
            <Route path="/dashboard/payments" element={<DashboardLayout><Payments /></DashboardLayout>} />
            <Route path="/dashboard/reviews" element={<DashboardLayout><Reviews /></DashboardLayout>} />
            <Route path="/dashboard/analytics" element={<DashboardLayout><Analytics /></DashboardLayout>} />
            <Route path="/dashboard/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />
            <Route path="/dashboard/users" element={<DashboardLayout><AdminUsers /></DashboardLayout>} />
            <Route path="/dashboard/companies" element={<DashboardLayout><AdminUsers /></DashboardLayout>} />
            <Route path="/dashboard/disputes" element={<DashboardLayout><Analytics /></DashboardLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
