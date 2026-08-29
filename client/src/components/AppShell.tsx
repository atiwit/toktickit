import React from 'react';
import { Navbar, Container, Nav, Dropdown } from 'react-bootstrap';
import { useNavigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { useRequester } from '../context/RequesterContext';
import { Clock, FileText, PlusCircle, User } from 'lucide-react';

const AppShell: React.FC = () => {
  const { selectedRequester, changeRequester } = useRequester();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChangeRequester = () => {
    changeRequester(null);
    navigate('/login');
  };

  const isLogin = location.pathname === '/login';

  return (
    <div className="app-shell" style={{ backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <Navbar style={{ backgroundColor: '#0f5132' }} variant="dark" expand="lg" className="px-3 shadow-sm py-2">
        <Container fluid>
          <Navbar.Brand as={NavLink} to="/" className="d-flex align-items-center gap-2" style={{ fontWeight: 700, fontSize: '1.4rem' }}>
            <Clock size={28} /> TikTockIT
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar-nav" />
          <Navbar.Collapse id="main-navbar-nav">
            {!isLogin ? (
              <Nav className="me-auto gap-4 ms-5">
                <Nav.Link as={NavLink} to="/" end id="nav-my-tickets" className="d-flex align-items-center gap-2 text-white opacity-75">
                  <FileText size={18} /> My Tickets
                </Nav.Link>
                <Nav.Link as={NavLink} to="/create-ticket" id="nav-create-ticket" className="d-flex align-items-center gap-2 text-white opacity-75">
                  <PlusCircle size={18} /> Create Ticket
                </Nav.Link>
              </Nav>
            ) : (
              <Nav className="me-auto gap-4 ms-5">
                <Nav.Link className="d-flex align-items-center gap-2 text-white opacity-100">
                  <FileText size={18} /> My Tickets
                </Nav.Link>
                <Nav.Link className="d-flex align-items-center gap-2 text-white opacity-100">
                  <PlusCircle size={18} /> Create Ticket
                </Nav.Link>
              </Nav>
            )}
            <Nav className="ms-auto">
              <Dropdown align="end">
                <Dropdown.Toggle variant="transparent" className="text-white border-0 d-flex align-items-center gap-2" id="profile-dropdown" style={{ boxShadow: 'none' }}>
                  <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, color: '#0f5132' }}>
                    <User size={20} />
                  </div>
                  Profile
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {selectedRequester ? (
                    <>
                      <Dropdown.Header>Requester: <strong>{selectedRequester.name}</strong></Dropdown.Header>
                      <Dropdown.Item onClick={handleChangeRequester}>Change Requester</Dropdown.Item>
                    </>
                  ) : (
                    <Dropdown.Item disabled>No requester selected</Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
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
