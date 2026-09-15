import React from 'react';
import { Navbar, Container, Nav, Dropdown } from 'react-bootstrap';
import { useNavigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, FileText, PlusCircle, User, Shield, Users, LogOut } from 'lucide-react';

// Role display name mapping
const ROLE_DISPLAY: Record<string, string> = {
  REQUESTER: 'Requester',
  IT_STAFF: 'IT Staff',
  ADMINISTRATOR: 'Administrator',
};

const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Don't render shell on login or change-password pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/change-password';
  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="app-shell" style={{ backgroundColor: '#F5F7F6', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <Navbar style={{ backgroundColor: '#006B3C' }} variant="dark" expand="lg" className="px-3 shadow-sm py-2">
        <Container fluid>
          <Navbar.Brand as={NavLink} to="/" className="d-flex align-items-center gap-2" style={{ fontWeight: 700, fontSize: '1.4rem' }}>
            <Clock size={28} /> TokTickIT
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar-nav" />
          <Navbar.Collapse id="main-navbar-nav">
            {user && (
              <Nav className="me-auto gap-4 ms-5">
                {/* Requester navigation */}
                {user.role === 'REQUESTER' && (
                  <>
                    <Nav.Link as={NavLink} to="/" end id="nav-my-tickets" className="d-flex align-items-center gap-2 text-white opacity-75">
                      <FileText size={18} /> My Tickets
                    </Nav.Link>
                    <Nav.Link as={NavLink} to="/create-ticket" id="nav-create-ticket" className="d-flex align-items-center gap-2 text-white opacity-75">
                      <PlusCircle size={18} /> Create Ticket
                    </Nav.Link>
                  </>
                )}

                {/* IT Staff navigation */}
                {user.role === 'IT_STAFF' && (
                  <Nav.Link as={NavLink} to="/staff/tickets" id="nav-ticket-queue" className="d-flex align-items-center gap-2 text-white opacity-75">
                    <Shield size={18} /> Ticket Queue
                  </Nav.Link>
                )}

                {/* Administrator navigation */}
                {user.role === 'ADMINISTRATOR' && (
                  <Nav.Link as={NavLink} to="/admin/users" id="nav-user-management" className="d-flex align-items-center gap-2 text-white opacity-75">
                    <Users size={18} /> User Management
                  </Nav.Link>
                )}
              </Nav>
            )}

            <Nav className="ms-auto">
              {user ? (
                <Dropdown align="end">
                  <Dropdown.Toggle variant="transparent" className="text-white border-0 d-flex align-items-center gap-2" id="profile-dropdown" style={{ boxShadow: 'none' }}>
                    <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, color: '#006B3C' }}>
                      <User size={20} />
                    </div>
                    {user.name} ({ROLE_DISPLAY[user.role] || user.role})
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Header>
                      <strong>{user.name}</strong>
                      <br />
                      <small className="text-muted">{user.email}</small>
                    </Dropdown.Header>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="d-flex align-items-center gap-2">
                      <LogOut size={16} /> Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : null}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main className="app-content py-4">
        <Container fluid="lg">
          <Outlet />
        </Container>
      </main>
    </div>
  );
};

export default AppShell;
