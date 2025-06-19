import React, { useEffect, useState } from 'react'; // Removed FormEvent, added useState
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Removed Navigate
import { useAuth } from '../AuthContext';

const SignupPage: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Added useLocation
  const [error, setError] = useState<string | null>(null); // For potential errors if any logic was here

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

   useEffect(() => {
     // Display errors passed from other redirects if any
     if (location.state?.error && !error) {
       setError(location.state.error);
       navigate(location.pathname, { replace: true, state: { ...location.state, error: undefined } });
     }
   }, [location, navigate, error]);

  const handleGoogleSignUp = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 shadow-2xl rounded-xl p-8 border border-slate-700">
        <h2 className="text-4xl font-bold text-center text-sky-400 mb-8">
          Create Account
        </h2>
         {error && (
          <div className="bg-red-500/20 border border-red-700 text-red-300 p-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignUp}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-all duration-150 ease-in-out"
        >
          {/* You can add a Google icon here */}
          Sign up with Google
        </button>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-sky-400 hover:text-sky-300 transition-colors duration-150"
          >
            Log In
          </Link>
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

export default SignupPage;
