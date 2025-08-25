import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AttendancePage from './pages/AttendancePage';
import WorkSheetPage from './pages/WorkSheetPage';
import LeavesPage from './pages/LeavesPage';
import ProfilePage from './pages/ProfilePage';
import TeamPage from './pages/TeamPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import CompanyPage from './pages/CompanyPage';
import SettingsPage from './pages/SettingsPage';
import DailyTaskSheet from './pages/DailyTaskSheet';
import TeamManagement from './pages/TeamManagement';
import PendingApprovals from './pages/admin/PendingApprovals';
import AdminUserManagement from './pages/UsersPage';
import AdminAttendancePage from './pages/AdminAttendancePage';
import AdminWorksheetsPage from './pages/AdminWorksheetsPage';
import AdminLeavesPage from './pages/AdminLeavesPage';
import BugReportsPage from './pages/BugReportsPage';
import AdminBugReportsPage from './pages/AdminBugReportsPage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Component to render admin or regular pages based on user role
const RoleBasedPageWrapper = ({ AdminComponent, RegularComponent, requiresAdminAccess = false }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isHR = user?.role === 'HR';
  const isManager = user?.role === 'Manager';
  
  // For pages that should show admin view for Admin/HR/Manager
  if (requiresAdminAccess && (isAdmin || isHR || isManager)) {
    return <AdminComponent />;
  }
  
  return <RegularComponent />;
};

// Main Layout Component
const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedPageWrapper 
                  AdminComponent={AdminAttendancePage}
                  RegularComponent={AttendancePage}
                  requiresAdminAccess={true}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/worksheets" 
          element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedPageWrapper 
                  AdminComponent={AdminWorksheetsPage}
                  RegularComponent={WorkSheetPage}
                  requiresAdminAccess={true}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/leaves" 
          element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedPageWrapper 
                  AdminComponent={AdminLeavesPage}
                  RegularComponent={LeavesPage}
                  requiresAdminAccess={true}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/team" 
          element={
            <ProtectedRoute>
              <Layout>
                <TeamPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <Layout>
                <AnalyticsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/leaderboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <LeaderboardPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/company" 
          element={
            <ProtectedRoute>
              <Layout>
                <RoleBasedPageWrapper 
                  AdminComponent={CompanyPage}
                  RegularComponent={CompanyPage}
                  requiresAdminAccess={false}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/task-sheet" 
          element={
            <ProtectedRoute>
              <Layout>
                <DailyTaskSheet />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teams" 
          element={
            <ProtectedRoute>
              <Layout>
                <TeamManagement />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/approvals" 
          element={
            <ProtectedRoute>
              <Layout>
                <PendingApprovals />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute>
              <Layout>
                <AdminUserManagement />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/bug-reports" 
          element={
            <ProtectedRoute>
              <Layout>
                <BugReportsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/bug-reports" 
          element={
            <ProtectedRoute>
              <Layout>
                <AdminBugReportsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <AppContent />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
