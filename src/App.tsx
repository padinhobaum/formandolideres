import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import ForumPage from "@/pages/ForumPage";
import MaterialsPage from "@/pages/MaterialsPage";
import VideoLessonsPage from "@/pages/VideoLessonsPage";
import NoticesPage from "@/pages/NoticesPage";
import AdminPage from "@/pages/AdminPage";
import LiderAIPage from "@/pages/LiderAIPage";
import LivePage from "@/pages/LivePage";
import NotFound from "@/pages/NotFound";
import LoadingScreen from "@/components/LoadingScreen";
import PublicSurveyPage from "@/pages/PublicSurveyPage";
import LeaderDashboardPage from "@/pages/LeaderDashboardPage";
import CertificateVerifyPage from "@/pages/CertificateVerifyPage";
import ProposalsPage from "@/pages/ProposalsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <LoadingScreen />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/dashboard" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/pesquisa/:code" element={<PublicSurveyPage />} />
            <Route path="/verificar/:code" element={<CertificateVerifyPage />} />
            <Route path="/home" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/forum" element={<ProtectedRoute><ForumPage /></ProtectedRoute>} />
            <Route path="/alunos" element={<Navigate to="/forum" replace />} />
            <Route path="/materiais" element={<ProtectedRoute><MaterialsPage /></ProtectedRoute>} />
            <Route path="/videoaulas" element={<ProtectedRoute><VideoLessonsPage /></ProtectedRoute>} />
            <Route path="/mural" element={<ProtectedRoute><NoticesPage /></ProtectedRoute>} />
            <Route path="/lider-ai" element={<ProtectedRoute><LiderAIPage /></ProtectedRoute>} />
            <Route path="/ao-vivo" element={<ProtectedRoute><LivePage /></ProtectedRoute>} />
            <Route path="/meus-resultados" element={<ProtectedRoute><LeaderDashboardPage /></ProtectedRoute>} />
            <Route path="/propostas" element={<ProtectedRoute><ProposalsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
