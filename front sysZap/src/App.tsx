import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Companies from './pages/admin/Companies';
import Users from './pages/admin/Users';
import WhatsAppSessions from './pages/admin/WhatsAppSessions';
import AllMessages from './pages/admin/AllMessages';
import Queues from './pages/admin/Queues';
import QueueUsers from './pages/admin/QueueUsers';
import Categories from './pages/admin/Categories';
import Tickets from './pages/Tickets';
import Clients from './pages/Clients';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import WhatsAppMessages from './pages/WhatsAppMessages';

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Toaster position="top-right" />
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Companies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/whatsapp"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <WhatsAppSessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AllMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/queues"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Queues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/queues/:queueId/users"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <QueueUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Categories />
              </ProtectedRoute>
            }
          />

          {/* Common Routes */}
          <Route
            path="/whatsapp"
            element={
              <ProtectedRoute allowedRoles={['manager', 'user']}>
                <WhatsAppMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;


