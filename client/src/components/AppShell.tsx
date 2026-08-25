import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { useNavigate, Outlet, NavLink } from 'react-router-dom';
import { useRequester } from '../context/RequesterContext';

const AppShell: React.FC = () => {
  const { selectedRequester, changeRequester } = useRequester();
  const navigate = useNavigate();

  const handleChangeRequester = () => {
    changeRequester(null);
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <Navbar style={{ backgroundColor: 'var(--color-primary)' }} variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={NavLink} to="/" style={{ fontWeight: 700, letterSpacing: '0.01em' }}>
            TokTickIT
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar-nav" />
          <Navbar.Collapse id="main-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link
                as={NavLink}
                to="/"
                end
                id="nav-my-tickets"
              >
                My Tickets
              </Nav.Link>
              <Nav.Link
                as={NavLink}
                to="/create-ticket"
                id="nav-create-ticket"
              >
                Create Ticket
              </Nav.Link>
            </Nav>
            <Nav>
              {selectedRequester && (
                <Navbar.Text className="text-white me-3" id="navbar-requester-name">
                  Requester: <strong>{selectedRequester.name}</strong>
                </Navbar.Text>
              )}
              <Button
                id="change-requester-btn"
                variant="outline-light"
                size="sm"
                onClick={handleChangeRequester}
              >
                Change Requester
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="app-content py-4">
        <Container>
          <Outlet />
        </Container>
      </main>
    </div>
  );
};

export default AppShell;
