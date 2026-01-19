import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DriverProvider } from "@/contexts/DriverContext";

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
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

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
          </DriverProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
