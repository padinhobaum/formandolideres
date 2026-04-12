import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, loading, isAdmin, profile } = useAuth();

  if (loading) {
    return <LoadingScreen persistent />;
  }

  if (!session) return <Navigate to="/login" replace />;
  
  // Wait for profile to be loaded before rendering content
  if (!profile) {
    return <LoadingScreen persistent />;
  }

  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
