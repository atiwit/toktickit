import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import MyTickets from './pages/MyTickets';
import CreateTicket from './pages/CreateTicket';
import TicketDetailPage from './pages/TicketDetail';
import StaffTicketQueue from './pages/StaffTicketQueue';
import StaffTicketDetail from './pages/StaffTicketDetail';
import UserManagement from './pages/UserManagement';
import RequesterDashboard from './pages/RequesterDashboard';
import StaffDashboard from './pages/StaffDashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

const HomeRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'IT_STAFF' || user.role === 'ADMINISTRATOR') {
    return <Navigate to="/staff/dashboard" replace />;
  }
  return <Navigate to="/requester/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes — no shell */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Protected routes — inside AppShell */}
          <Route element={<AppShell />}>
            {/* Authenticated Root Landing */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomeRedirect />} />
            </Route>

            {/* Requester routes */}
            <Route element={<ProtectedRoute allowedRoles={['REQUESTER']} />}>
              <Route path="/requester/dashboard" element={<RequesterDashboard />} />
              <Route path="/tickets" element={<MyTickets />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Route>

            {/* Create Ticket (Accessible by Requester, IT Staff, and Administrator) */}
            <Route element={<ProtectedRoute allowedRoles={['REQUESTER', 'IT_STAFF', 'ADMINISTRATOR']} />}>
              <Route path="/create-ticket" element={<CreateTicket />} />
            </Route>

            {/* IT Staff & Admin dashboard (A-01, FR-13, Section 6) */}
            <Route element={<ProtectedRoute allowedRoles={['IT_STAFF', 'ADMINISTRATOR']} />}>
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/tickets" element={<StaffTicketQueue />} />
              <Route path="/staff/tickets/:id" element={<StaffTicketDetail />} />
            </Route>

            {/* Administrator routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMINISTRATOR']} />}>
              <Route path="/admin/dashboard" element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="/admin/users" element={<UserManagement />} />
            </Route>

            {/* Fallback — redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;