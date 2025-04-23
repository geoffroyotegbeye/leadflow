import React from 'react';
import { Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import NotFoundPage from '../pages/NotFoundPage';
import ForbiddenPage from '../pages/ForbiddenPage';
import SettingsPage from '../pages/SettingsPage';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import VerificationCodePage from '../pages/VerificationCodePage';
import DashboardPage from '../pages/DashboardPage';
import ChatbotsPage from '../pages/ChatbotsPage';
import ChatbotEditor from '../pages/ChatbotEditor';
import FeaturesPage from '../pages/FeaturesPage';
import DocumentationPage from '../pages/DocumentationPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import LeadsPage from '../pages/LeadsPage';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

const Routes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <RouterRoutes>
      {/* Public Routes */}
      <Route path="/" element={
        <MainLayout>
          <LandingPage />
        </MainLayout>
      } />
      <Route path="/features" element={
        <MainLayout>
          <FeaturesPage />
        </MainLayout>
      } />
      <Route path="/documentation" element={
        <MainLayout>
          <DocumentationPage />
        </MainLayout>
      } />
      <Route path="/login" element={
        isAuthenticated ? 
        <Navigate to="/dashboard" replace /> :
        <MainLayout>
          <LoginPage />
        </MainLayout>
      } />
      <Route path="/register" element={
        isAuthenticated ? 
        <Navigate to="/dashboard" replace /> :
        <MainLayout>
          <RegisterPage />
        </MainLayout>
      } />
      <Route path="/forgot-password" element={
        <MainLayout>
          <ForgotPasswordPage />
        </MainLayout>
      } />
      <Route path="/reset-password" element={
        <MainLayout>
          <ResetPasswordPage />
        </MainLayout>
      } />
      <Route path="/verify-code" element={
        <MainLayout>
          <VerificationCodePage />
        </MainLayout>
      } />

      {/* Route explicite pour 403 */}
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/chatbots" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ChatbotsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/chatbots/editor/:assistantId" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ChatbotEditor />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/chatbots/new" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ChatbotEditor />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/chatbots/editor" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ChatbotEditor />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/analytics" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AnalyticsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/analytics/:assistantId" element={
        <ProtectedRoute>
          <DashboardLayout>
            <AnalyticsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/leads" element={
        <ProtectedRoute>
          <DashboardLayout>
            <LeadsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/settings" element={
        <ProtectedRoute>
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      {/* Catch-all route pour 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </RouterRoutes>
  );
};

export default Routes;
