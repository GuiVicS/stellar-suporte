import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import ManagerLayout from "./layouts/ManagerLayout";
import TechnicianLayout from "./layouts/TechnicianLayout";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import AgendaView from "./pages/manager/AgendaView";
import KanbanView from "./pages/manager/KanbanView";

import TechniciansPage from "./pages/manager/TechniciansPage";
import ReportsPage from "./pages/manager/ReportsPage";
import CustomersPage from "./pages/manager/CustomersPage";
import TechnicianHome from "./pages/technician/TechnicianHome";
import TechnicianAgenda from "./pages/technician/TechnicianAgenda";
import TechnicianHistory from "./pages/technician/TechnicianHistory";
import TechnicianProfile from "./pages/technician/TechnicianProfile";
import ServiceOrderWizard from "./pages/technician/ServiceOrderWizard";
import NotFound from "./pages/NotFound";
import InstallPage from "./pages/InstallPage";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'tecnico') return <Navigate to="/tech" replace />;
  return <Navigate to="/manager" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/install" element={<InstallPage />} />
    <Route path="/" element={<ProtectedRoute><RootRedirect /></ProtectedRoute>} />

    {/* Manager routes */}
    <Route path="/manager" element={<ProtectedRoute><ManagerLayout /></ProtectedRoute>}>
      <Route index element={<ManagerDashboard />} />
      <Route path="agenda" element={<AgendaView />} />
      <Route path="kanban" element={<KanbanView />} />
      
      <Route path="customers" element={<CustomersPage />} />
      <Route path="technicians" element={<TechniciansPage />} />
      <Route path="reports" element={<ReportsPage />} />
    </Route>

    {/* Technician routes */}
    <Route path="/tech" element={<ProtectedRoute><TechnicianLayout /></ProtectedRoute>}>
      <Route index element={<TechnicianHome />} />
      <Route path="agenda" element={<TechnicianAgenda />} />
      <Route path="history" element={<TechnicianHistory />} />
      <Route path="os/:id" element={<ServiceOrderWizard />} />
      <Route path="profile" element={<TechnicianProfile />} />
      <Route path="profile" element={<TechnicianProfile />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
