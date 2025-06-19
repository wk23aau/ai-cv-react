import React, { useEffect, useState } from 'react'; // Added useState
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null); // Keep error for callback errors
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Keep for messages like from signup

  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [auth.isAuthenticated, navigate, from]);

  useEffect(() => {
     // Display errors passed from AuthCallbackPage or other redirects
     if (location.state?.error && !error) {
       setError(location.state.error);
       // Clear the error from location state so it doesn't reappear on refresh
       navigate(location.pathname, { replace: true, state: { ...location.state, error: undefined } });
     }
     if (location.state?.message && !successMessage) {
       setSuccessMessage(location.state.message);
       navigate(location.pathname, { replace: true, state: { ...location.state, message: undefined } });
     }
   }, [location, navigate, error, successMessage]);


  const handleGoogleSignIn = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = '/api/auth/google';
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex justify-center items-center">
        <div className="text-sky-400 text-xl">Loading...</div>
      </div>
    );
  }
  // No need for the auth.isAuthenticated redirect here as useEffect handles it.

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 shadow-2xl rounded-xl p-8 border border-slate-700">
        <h2 className="text-4xl font-bold text-center text-sky-400 mb-8">
          Log In
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-red-700 text-red-300 p-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}
        {successMessage && !error && (
          <div className="bg-green-500/20 border border-green-700 text-green-300 p-3 rounded-md mb-6 text-sm">
            {successMessage}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-all duration-150 ease-in-out"
        >
          {/* You can add a Google icon here */}
          Sign in with Google
        </button>

        <p className="mt-8 text-center text-sm text-slate-400">
          {/* Link to signup can be removed if Google is the only way */}
          {/* Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-sky-400 hover:text-sky-300 transition-colors duration-150"
          >
            Sign Up
          </Link> */}
        </p>
        <p className="mt-2 text-center text-xs text-slate-500">
          <Link to="/" className="hover:text-sky-400 transition-colors duration-150">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
