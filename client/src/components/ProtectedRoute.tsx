import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRequester } from '../context/RequesterContext';
import AppShell from './AppShell';

const ProtectedRoute: React.FC = () => {
  const { selectedRequester } = useRequester();

  if (!selectedRequester) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell />
  );
};

export default ProtectedRoute;
