import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

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
            {/* Requester routes */}
            <Route element={<ProtectedRoute allowedRoles={['REQUESTER']} />}>
              <Route path="/" element={<MyTickets />} />
              <Route path="/create-ticket" element={<CreateTicket />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Route>

            {/* IT Staff routes */}
            <Route element={<ProtectedRoute allowedRoles={['IT_STAFF']} />}>
              <Route path="/staff/tickets" element={<StaffTicketQueue />} />
              <Route path="/staff/tickets/:id" element={<StaffTicketDetail />} />
            </Route>

            {/* Administrator routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMINISTRATOR']} />}>
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