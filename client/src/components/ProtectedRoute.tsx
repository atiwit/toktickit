import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roles }) => {
  const { user, loading } = useAuth();

  // Show nothing while checking session
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--color-text-muted, #6B7280)' }}>Loading...</div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Must change password → redirect to change password
  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  // Role check
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <h2 style={{ color: 'var(--color-danger, #DC2626)', margin: 0 }}>Access Denied</h2>
        <p style={{ color: 'var(--color-text-muted, #6B7280)' }}>
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
