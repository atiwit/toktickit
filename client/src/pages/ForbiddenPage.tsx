import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useAuth, roleLabel } from '../context/AuthContext';

const ForbiddenPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goBack = () => navigate(-1);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      fontFamily: "'Inter', system-ui, sans-serif",
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        backgroundColor: '#FEF2F2', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.5rem',
      }}>
        <ShieldOff size={40} color="#DC2626" />
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem' }}>
        Access Denied
      </h1>
      <p style={{ color: '#6B7280', fontSize: '1rem', margin: '0 0 0.5rem', maxWidth: '420px' }}>
        You don't have permission to view this page.
      </p>
      {user && (
        <p style={{ color: '#9CA3AF', fontSize: '0.875rem', margin: '0 0 2rem' }}>
          Logged in as: <strong>{user.name}</strong> ({roleLabel(user.role)})
        </p>
      )}

      <button
        id="forbidden-go-back"
        onClick={goBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', borderRadius: '8px',
          backgroundColor: 'var(--color-primary)', border: 'none',
          color: '#fff', fontWeight: 600, fontSize: '0.9rem',
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );
};

export default ForbiddenPage;
