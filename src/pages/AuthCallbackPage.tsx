import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import LoadingSpinner from '../components/shared/LoadingSpinner'; // Assuming this exists

const AuthCallbackPage: React.FC = () => {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userString = params.get('user');

    if (token && userString) {
      try {
        const user = JSON.parse(decodeURIComponent(userString));
        auth.handleGoogleLogin(token, user); // New function in AuthContext
        navigate('/dashboard', { replace: true }); // Redirect to dashboard or desired page
      } catch (error) {
        console.error('Error processing auth callback:', error);
        navigate('/login', { replace: true, state: { error: 'Failed to process Google login. Please try again.' } });
      }
    } else {
      // Handle missing token or user info
      navigate('/login', { replace: true, state: { error: 'Google login failed. Missing information.' } });
    }
  }, [auth, location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4">
      <LoadingSpinner message="Authenticating with Google..." />
    </div>
  );
};

export default AuthCallbackPage;
