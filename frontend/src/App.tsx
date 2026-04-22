import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { GpaPage } from '@/pages/gpa/GpaPage';
import { FinancePage } from '@/pages/finance/FinancePage';
import { RoadmapPage } from '@/pages/roadmap/RoadmapPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { useAuthStore } from '@/store/authStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { ThemeProvider } from '@/components/theme-provider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { CONFIG } from '@/config';

/* ─── Protected Route ─────────────────────────────────────────────── */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/* ─── App ─────────────────────────────────────────────────────────── */
function App() {
  const recaptchaKey = CONFIG.RECAPTCHA.SITE_KEY;

  return (
    <GoogleOAuthProvider clientId={CONFIG.GOOGLE.CLIENT_ID}>
      {recaptchaKey ? (
        <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey} language="vi">
          <AppContent />
        </GoogleReCaptchaProvider>
      ) : (
        <AppContent />
      )}
    </GoogleOAuthProvider>
  );
}

import { Toaster } from 'react-hot-toast';

function AppContent() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="pmp-theme">
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
          <Route path="/verify-email"   element={<VerifyEmailPage />} />

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
          <Route path="/settings" element={
            <ProtectedRoute>
              <MainLayout><SettingsPage /></MainLayout>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </Router>
    </ThemeProvider>
  );
}

export default App;
