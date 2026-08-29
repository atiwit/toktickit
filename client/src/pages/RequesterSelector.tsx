import React, { useEffect, useState } from 'react';
import { Card, Form, Button, Alert, Spinner, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useRequester, type Requester } from '../context/RequesterContext';
import { Home, ChevronRight, UserCog, Info, ShieldAlert } from 'lucide-react';

const RequesterSelector: React.FC = () => {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { changeRequester } = useRequester();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequesters = async () => {
      try {
        const response = await fetch('/api/requesters');
        if (!response.ok) {
          throw new Error('Failed to fetch requesters');
        }
        const data = await response.json();
        setRequesters(data);
        if (data.length > 0) {
          setSelectedId(data[0].id.toString());
        }
      } catch (err) {
        setError('Unable to load Development Requesters. API might be down.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequesters();
  }, []);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const requester = requesters.find((r) => r.id.toString() === selectedId);
    if (requester) {
      changeRequester(requester);
      navigate('/');
    }
  };

  return (
    <>
      <div className="d-flex align-items-center mb-4 text-success" style={{ fontSize: '0.9rem' }}>
        <Home size={18} />
        <ChevronRight size={16} className="mx-1 text-secondary" />
        <span className="fw-semibold">Development Requester Selection</span>
      </div>

      <Container className="d-flex justify-content-center px-0">
        <Card className="border-0 shadow-sm" style={{ maxWidth: '800px', width: '100%', borderRadius: '8px' }}>
          <Card.Body className="p-5">
            <div className="text-center mb-4">
              <div className="d-inline-flex justify-content-center align-items-center rounded-circle mb-3" style={{ width: '64px', height: '64px', backgroundColor: '#e8f5e9', color: '#198754' }}>
                <UserCog size={32} />
              </div>
              <h3 className="fw-bold mb-2">Select Development Requester</h3>
              <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                Choose a development requester to simulate the current requester context for Lab 2.<br />
                This is for testing only and is not a login screen.
              </p>
            </div>
            
            <hr className="my-4 text-muted opacity-25" />

            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="success" />
                <p className="mt-3 text-muted">Loading requesters...</p>
              </div>
            ) : error ? (
              <Alert variant="danger">{error}</Alert>
            ) : requesters.length === 0 ? (
              <Alert variant="warning">No active requesters found in the database.</Alert>
            ) : (
              <Form onSubmit={handleContinue}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold" style={{ fontSize: '0.9rem' }}>Development Requester <span className="text-danger">*</span></Form.Label>
                  <Form.Select 
                    value={selectedId} 
                    onChange={(e) => setSelectedId(e.target.value)}
                    required
                    className="py-2 bg-light"
                  >
                    {requesters.map((req) => (
                      <option key={req.id} value={req.id}>
                        {req.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Alert variant="success" className="d-flex align-items-center py-2" style={{ backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', color: '#0f5132', fontSize: '0.9rem' }}>
                  <Info size={20} className="me-2 flex-shrink-0" />
                  <span>Only active development requesters are shown.</span>
                </Alert>

                <div className="d-flex p-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                  <div className="me-3 mt-1 d-flex justify-content-center align-items-center bg-light border rounded-circle" style={{ width: '40px', height: '40px' }}>
                    <ShieldAlert size={20} className="text-secondary" />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1" style={{ fontSize: '0.95rem' }}>Authentication coming in Lab 3</h6>
                    <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                      In Lab 3, this selection will be replaced with secure authentication<br/>
                      so you can access the system with your own account.
                    </p>
                  </div>
                </div>

                <hr className="mt-5 mb-4 text-muted opacity-25" />

                <div className="d-flex justify-content-end gap-2">
                  <Button variant="light" className="border px-4 py-2" type="button" onClick={() => window.location.reload()}>
                    Cancel
                  </Button>
                  <Button variant="success" type="submit" className="px-4 py-2 d-flex align-items-center gap-2" style={{ backgroundColor: '#0f5132', borderColor: '#0f5132' }}>
                    <ChevronRight size={18} /> Continue
                  </Button>
                </div>
              </Form>
            )}
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default RequesterSelector;
