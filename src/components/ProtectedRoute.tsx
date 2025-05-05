import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path if necessary

interface ProtectedRouteProps {
  children: React.ReactElement; // Use React.ReactElement for specific components
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Optional: Render a loading spinner or skeleton screen while checking auth
    return <div>Loading authentication...</div>; 
  }

  if (!user) {
    // User not logged in, redirect to login page
    // Pass the current location to redirect back after login (optional)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is logged in, render the protected component
  return children;
};

export default ProtectedRoute; 