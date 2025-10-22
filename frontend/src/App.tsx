import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { UnreadMessagesProvider } from './context/UnreadMessagesContext';
import { Layout } from './components/Layout/Layout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { ExerciseDetailPage } from './pages/ExerciseDetailPage';
import { PhysiotherapistsPage } from './pages/PhysiotherapistsPage';
import { PhysiotherapistDetailPage } from './pages/PhysiotherapistDetailPage';
import { AppointmentBookingPage } from './pages/AppointmentBookingPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { PhysiotherapistSchedulePage } from './pages/PhysiotherapistSchedulePage';
import { ForumPage } from './pages/ForumPage';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { PatientsPage } from './pages/PatientsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

// Create Material-UI theme for FisioNet
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Green for health/medical theme
      light: '#60AD5E',
      dark: '#005005',
    },
    secondary: {
      main: '#1976D2', // Blue for trust and reliability
      light: '#63A4FF',
      dark: '#004BA0',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ToastProvider>
          <Router>
            <UnreadMessagesProvider>
              <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/exercises" element={<ExercisesPage />} />
              <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
              <Route path="/physiotherapists" element={
                <ProtectedRoute requiredRole={["patient", "admin"]}>
                  <PhysiotherapistsPage />
                </ProtectedRoute>
              } />
              <Route path="/physiotherapists/:id" element={
                <ProtectedRoute requiredRole={["patient", "admin"]}>
                  <PhysiotherapistDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/physiotherapists/:id/book" element={
                <ProtectedRoute requiredRole={["patient","physiotherapist","admin"]}>
                  <AppointmentBookingPage />
                </ProtectedRoute>
              } />
              <Route path="/patients/:patientId/book/:id" element={
                <ProtectedRoute requiredRole={["patient","physiotherapist","admin"]}>
                  <AppointmentBookingPage />
                </ProtectedRoute>
              } />

              {/* Protected routes - require authentication and/or role */}
              <Route path="/appointments" element={
                <ProtectedRoute requiredRole="patient">
                  <AppointmentsPage />
                </ProtectedRoute>
              } />
              <Route path="/schedule" element={
                <ProtectedRoute requiredRole="physiotherapist">
                  <PhysiotherapistSchedulePage />
                </ProtectedRoute>
              } />
              <Route path="/forum" element={
                <ProtectedRoute>
                  <ForumPage />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/profile/:userId" element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPanelPage />
                </ProtectedRoute>
              } />
              <Route path="/patients" element={
                <ProtectedRoute requiredRole={["physiotherapist", "admin"]}>
                  <PatientsPage />
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
              </Layout>
            </UnreadMessagesProvider>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
