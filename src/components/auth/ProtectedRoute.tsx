import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// Re-use or ensure getAuthToken is accessible here
// For simplicity, defining it again. In a real app, this would be a shared utility.
const getAuthToken = (): string | null => {
  // Example: return localStorage.getItem('userToken');
  // This needs to be replaced with actual token logic.
  // console.warn("ProtectedRoute: Using placeholder getAuthToken. Replace with actual token retrieval.");
  return localStorage.getItem('userToken'); // Let's assume token is stored in localStorage for this example
};

interface ProtectedRouteProps {
  // children?: React.ReactNode; // Outlet handles children for element-based routing
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  const token = getAuthToken();
  const location = useLocation();

  if (!token) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to so we can send them along after they login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // Render the child route's element
};

export default ProtectedRoute;
