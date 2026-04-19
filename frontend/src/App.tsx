import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { GpaPage } from '@/pages/gpa/GpaPage';
import { FinancePage } from '@/pages/finance/FinancePage';
import { RoadmapPage } from '@/pages/roadmap/RoadmapPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { useAuthStore } from '@/store/authStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { ThemeProvider } from '@/components/theme-provider';

/* ─── Protected Route ─────────────────────────────────────────────── */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/* ─── App ─────────────────────────────────────────────────────────── */
function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="pmp-theme">
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout><DashboardPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/gpa" element={
            <ProtectedRoute>
              <MainLayout><GpaPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/finance" element={
            <ProtectedRoute>
              <MainLayout><FinancePage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/roadmap" element={
            <ProtectedRoute>
              <MainLayout><RoadmapPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <MainLayout><ChatPage /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
