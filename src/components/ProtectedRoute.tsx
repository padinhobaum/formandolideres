import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import { maintenanceConfig } from "@/config/maintenance";

export default function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, loading, isAdmin, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen persistent />;
  }

  if (!session) return <Navigate to="/login" replace />;
  
  // Wait for profile to be loaded before rendering content
  if (!profile) {
    return <LoadingScreen persistent />;
  }

  if (maintenanceConfig.enabled && location.pathname !== maintenanceConfig.redirectPath) {
    return <Navigate to={maintenanceConfig.redirectPath} replace />;
  }

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
