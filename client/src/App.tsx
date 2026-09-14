
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import CreateTicket from './pages/CreateTicket';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import MyTickets from './pages/MyTickets';
import TicketDetailPage from './pages/TicketDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth pages (no AppShell) */}
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Authenticated routes with AppShell */}
          <Route element={<AppShell />}>
            {/* Requester routes */}
            <Route element={<ProtectedRoute roles={['REQUESTER']} />}>
              <Route path="/" element={<MyTickets />} />
              <Route path="/create-ticket" element={<CreateTicket />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Route>

            {/* IT Staff routes (placeholder) */}
            <Route element={<ProtectedRoute roles={['IT_STAFF']} />}>
              <Route path="/staff/tickets" element={<div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Ticket Queue — Coming Soon</div>} />
            </Route>

            {/* Administrator routes (placeholder) */}
            <Route element={<ProtectedRoute roles={['ADMINISTRATOR']} />}>
              <Route path="/admin/users" element={<div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>User Management — Coming Soon</div>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;