import React, { useEffect, useState } from 'react';
import { Card, Form, Button, Alert, Spinner, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useRequester, type Requester } from '../context/RequesterContext';

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
        const response = await fetch('http://localhost:3000/api/requesters');
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
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Card style={{ maxWidth: '500px', width: '100%' }} className="p-4 shadow-sm">
        <div className="text-center mb-4">
          <h2 className="text-primary">TokTickIT</h2>
          <p className="text-muted">Development Requester Selector</p>
        </div>
        
        <Alert variant="info" style={{ fontSize: '0.9rem' }}>
          Select a Development Requester to test requester-specific ticket behavior. 
          This is not a login screen. Authentication and role-based access will be introduced in Lab 3.
        </Alert>

        {loading ? (
          <div className="text-center my-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading requesters...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : requesters.length === 0 ? (
          <Alert variant="warning">No active requesters found in the database.</Alert>
        ) : (
          <Form onSubmit={handleContinue}>
            <Form.Group className="mb-4">
              <Form.Label>Select Requester</Form.Label>
              <Form.Select 
                value={selectedId} 
                onChange={(e) => setSelectedId(e.target.value)}
                required
              >
                {requesters.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.name} ({req.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="d-grid">
              <Button variant="primary" type="submit" size="lg">
                Continue
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </Container>
  );
};

export default RequesterSelector;
