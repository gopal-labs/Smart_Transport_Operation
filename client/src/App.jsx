import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AIAssistant from './components/AIAssistant';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';

// Layout wrapper to inject sidebar, header, and content pane dynamically
const AppLayout = ({ children }) => {
  const location = useLocation();
  
  // Dynamic page title mapping based on route path
  const getPageTitle = (path) => {
    switch (path) {
      case '/':
        return 'Dashboard & Operations Overview';
      case '/vehicles':
        return 'Vehicle Registry';
      case '/drivers':
        return 'Driver Roster & Gamification Leaderboard';
      case '/trips':
        return 'Trip Operations Desk';
      case '/maintenance':
        return 'Maintenance Center';
      case '/expenses':
        return 'Financial Desk & Anomaly Review';
      case '/reports':
        return 'Reports & ESG Sustainability Analytics';
      default:
        return 'TransitOps Platform';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Dark Sidebar */}
      <Sidebar />

      {/* Light Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={getPageTitle(location.pathname)} />
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Floating AI Assistant */}
      <AIAssistant />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public login page */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/vehicles" 
            element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Safety Officer']}>
                <AppLayout>
                  <Vehicles />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/drivers" 
            element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Safety Officer']}>
                <AppLayout>
                  <Drivers />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/trips" 
            element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Driver']}>
                <AppLayout>
                  <Trips />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/maintenance" 
            element={
              <ProtectedRoute allowedRoles={['Fleet Manager']}>
                <AppLayout>
                  <Maintenance />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/expenses" 
            element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Financial Analyst']}>
                <AppLayout>
                  <Expenses />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute allowedRoles={['Fleet Manager', 'Financial Analyst']}>
                <AppLayout>
                  <Reports />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          {/* Fallback redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
