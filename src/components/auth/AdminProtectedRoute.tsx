import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode'; // Using jwt-decode to check token claims

// Placeholder for actual auth token retrieval logic
const getAuthTokenForAdminCheck = (): string | null => {
  return localStorage.getItem('userToken');
};

interface DecodedToken {
  userId: number;
  username: string;
  isAdmin?: boolean;
  iat: number;
  exp: number;
}

const AdminProtectedRoute: React.FC = () => {
  const token = getAuthTokenForAdminCheck();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const decodedToken = jwt_decode<DecodedToken>(token);
    if (!decodedToken.isAdmin) {
      // Not an admin, redirect to dashboard or a generic "unauthorized" page
      alert("Access Denied: Admin privileges required."); // Basic feedback
      return <Navigate to="/dashboard" replace />;
    }
  } catch (error) {
    console.error("Invalid token:", error);
    // Invalid token, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // User is authenticated and is an admin
};

export default AdminProtectedRoute;
