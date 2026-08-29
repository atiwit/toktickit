import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useRequester } from '../context/RequesterContext';

const ProtectedRoute: React.FC = () => {
  const { selectedRequester } = useRequester();

  if (!selectedRequester) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
