import React from 'react';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { useNavigate, Outlet, Link } from 'react-router-dom';
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
          <Navbar.Brand as={Link} to="/">TokTickIT</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">My Tickets</Nav.Link>
              <Nav.Link as={Link} to="/create-ticket">Create Ticket</Nav.Link>
            </Nav>
            <Nav>
              {selectedRequester && (
                <Navbar.Text className="text-white me-3">
                  Requester: <strong>{selectedRequester.name}</strong>
                </Navbar.Text>
              )}
              <Button variant="outline-light" size="sm" onClick={handleChangeRequester}>
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
