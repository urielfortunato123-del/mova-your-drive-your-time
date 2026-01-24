import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DriverProvider } from "@/contexts/DriverContext";
import { InstallBanner } from "@/components/InstallBanner";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rides from "./pages/Rides";
import RideDetail from "./pages/RideDetail";
import History from "./pages/History";
import Earnings from "./pages/Earnings";
import Benefits from "./pages/Benefits";
import Profile from "./pages/Profile";
import DriverMap from "./pages/DriverMap";
import BradescoPartner from "./pages/BradescoPartner";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

// Premium Pages
import PremiumPresentation from "./pages/premium/PremiumPresentation";
import PremiumSubscribe from "./pages/premium/PremiumSubscribe";
import PremiumGoals from "./pages/premium/PremiumGoals";
import PremiumBonus from "./pages/premium/PremiumBonus";
import PremiumPartners from "./pages/premium/PremiumPartners";
import PremiumHistory from "./pages/premium/PremiumHistory";
import PremiumTelefonia from "./pages/premium/PremiumTelefonia";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/rides" element={
        <ProtectedRoute>
          <Rides />
        </ProtectedRoute>
      } />
      <Route path="/rides/:id" element={
        <ProtectedRoute>
          <RideDetail />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      } />
      <Route path="/earnings" element={
        <ProtectedRoute>
          <Earnings />
        </ProtectedRoute>
      } />
      <Route path="/benefits" element={
        <ProtectedRoute>
          <Benefits />
        </ProtectedRoute>
      } />
      <Route path="/map" element={
        <ProtectedRoute>
          <DriverMap />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/bradesco" element={
        <ProtectedRoute>
          <BradescoPartner />
        </ProtectedRoute>
      } />
      {/* Premium Routes */}
      <Route path="/premium" element={
        <ProtectedRoute>
          <PremiumPresentation />
        </ProtectedRoute>
      } />
      <Route path="/premium/subscribe" element={
        <ProtectedRoute>
          <PremiumSubscribe />
        </ProtectedRoute>
      } />
      <Route path="/premium/goals" element={
        <ProtectedRoute>
          <PremiumGoals />
        </ProtectedRoute>
      } />
      <Route path="/premium/bonus" element={
        <ProtectedRoute>
          <PremiumBonus />
        </ProtectedRoute>
      } />
      <Route path="/premium/partners" element={
        <ProtectedRoute>
          <PremiumPartners />
        </ProtectedRoute>
      } />
      <Route path="/premium/history" element={
        <ProtectedRoute>
          <PremiumHistory />
        </ProtectedRoute>
      } />
      <Route path="/premium/telefonia" element={
        <ProtectedRoute>
          <PremiumTelefonia />
        </ProtectedRoute>
      } />
      <Route path="/install" element={<Install />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <DriverProvider>
            <AppRoutes />
            <InstallBanner delay={2000} />
          </DriverProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
