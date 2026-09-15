import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import ForbiddenPage from '../pages/ForbiddenPage';

interface ProtectedRouteProps {
  /** Roles allowed to access this route. If omitted, any authenticated user is allowed. */
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  // Show nothing while session is being restored
  if (loading) return null;

  // Unauthenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // mustChangePassword → redirect to change-password screen (only allow that route)
  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  // Role check — show Forbidden (not redirect) for direct URL access (FR-06, ui-spec §2.3)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
