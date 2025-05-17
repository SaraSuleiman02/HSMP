import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectPath = '/sign-in' 
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // If not authenticated, always redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If route requires specific roles and user's role is not allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user's role
    const redirectTo ='/404'; 
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute; 