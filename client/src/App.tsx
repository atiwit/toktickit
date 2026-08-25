
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RequesterProvider } from './context/RequesterContext';
import RequesterSelector from './pages/RequesterSelector';
import CreateTicket from './pages/CreateTicket';
import ProtectedRoute from './components/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Placeholder for future issues
const MyTickets = () => (
  <div>
    <h2>My Tickets</h2>
    <p>This screen will be implemented in Issue 6.</p>
  </div>
);

function App() {
  return (
    <RequesterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<RequesterSelector />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MyTickets />} />
            <Route path="/create-ticket" element={<CreateTicket />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </RequesterProvider>
  );
}

export default App;