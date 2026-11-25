import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewAssessmentPage from './pages/NewAssessmentPage';
import ResultPage from './pages/ResultPage';
import BatchPortfolioPage from './pages/BatchPortfolioPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import AuditLogPage from './pages/AuditLogPage';
import PolicySettingsPage from './pages/PolicySettingsPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0F19]">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Routes wrapped in Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assess"
            element={
              <ProtectedRoute>
                <NewAssessmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/result/:id"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/batch"
            element={
              <ProtectedRoute>
                <BatchPortfolioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/model-performance"
            element={
              <ProtectedRoute>
                <ModelPerformancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RISK_MANAGER']}>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/policy-settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PolicySettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
