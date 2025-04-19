import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import VerificationCodePage from '../pages/VerificationCodePage';
import DashboardPage from '../pages/DashboardPage';
import ChatbotEditor from '../pages/ChatbotEditor';

const Routes: React.FC = () => {
  return (
    <RouterRoutes>
      {/* Public Routes */}
      <Route path="/" element={
        <MainLayout>
          <LandingPage />
        </MainLayout>
      } />
      <Route path="/login" element={
        <MainLayout>
          <LoginPage />
        </MainLayout>
      } />
      <Route path="/register" element={
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

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      } />
      <Route path="/dashboard/chatbots" element={
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      } />
      <Route path="/chatbots/editor/:assistantId" element={
        <DashboardLayout>
          <ChatbotEditor />
        </DashboardLayout>
      } />
      <Route path="/dashboard/chatbots/editor" element={
        <DashboardLayout>
          <ChatbotEditor />
        </DashboardLayout>
      } />
      <Route path="/dashboard/analytics" element={
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      } />
      <Route path="/dashboard/leads" element={
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      } />
      <Route path="/dashboard/settings" element={
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      } />
    </RouterRoutes>
  );
};

export default Routes;
