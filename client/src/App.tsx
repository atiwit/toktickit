
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RequesterProvider } from './context/RequesterContext';
import RequesterSelector from './pages/RequesterSelector';
import CreateTicket from './pages/CreateTicket';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import MyTickets from './pages/MyTickets';
import TicketDetailPage from './pages/TicketDetail';

function App() {
  return (
    <RequesterProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/login" element={<RequesterSelector />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MyTickets />} />
              <Route path="/create-ticket" element={<CreateTicket />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RequesterProvider>
  );
}

export default App;