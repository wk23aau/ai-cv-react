import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import analyticsService from './services/analyticsService'; // Import analyticsService

// 1. Define User Interface
export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin?: boolean; // Optional, as it might not always be present or needed everywhere
}

// 2. Define AuthContextType Interface
export interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean; // For initial auth state loading and during login/signup
  isAuthenticated: boolean; // Derived from token presence
  isAdmin: boolean; // Derived from user object
  logout: () => void;
  initializeAuth: () => void; // To check localStorage on app load
  handleGoogleLogin: (token: string, user: User) => void; // New method
}

// 3. Create AuthContext
// Providing a default placeholder for context methods to satisfy TypeScript
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Implement AuthProvider (Initial structure, functions to be filled in)
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true until initializeAuth runs

  const isAuthenticated = !!token;
  const isAdminUser = !!(user && user.isAdmin);

  const initializeAuth = () => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      const storedUserInfo = localStorage.getItem('userInfo');

      if (storedToken) {
        setToken(storedToken);
        if (storedUserInfo) {
          const parsedUser: User = JSON.parse(storedUserInfo);
          setUser(parsedUser);
          if (parsedUser && parsedUser.id) {
            analyticsService.setUserId(parsedUser.id); // Set GA User-ID on initialization
          } else {
            console.warn("AuthContext: User ID not available for GA User-ID tracking during init.");
          }
        }
      }
    } catch (error) {
      console.error("AuthContext: Error during initialization", error);
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      analyticsService.setUserId(null); // Clear GA User-ID on error
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    analyticsService.setUserId(null); // Clear GA User-ID on logout
    console.log("AuthContext: User logged out");
    // Potentially redirect or update other app state as needed
  };

  // Call initializeAuth on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Helper for error state if we were to manage it globally in context
  // For now, errors are thrown and handled by components
  const [_, setError] = useState<string | null>(null);

  const handleGoogleLogin = (newToken: string, newUser: User) => {
    setIsLoading(true);
    try {
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('userInfo', JSON.stringify(newUser));
      console.log("AuthContext: User logged in with Google", newUser);
      if (newUser && newUser.id) { // Ensure user and user.id are available
         analyticsService.setUserId(newUser.id); // Set GA User-ID
      } else {
         console.warn("AuthContext: User ID not available for GA User-ID tracking after Google login.");
      }
    } catch (error) {
      console.error("AuthContext: Error during Google login processing", error);
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      analyticsService.setUserId(null); // Clear GA User-ID on error
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    token,
    user,
    isLoading,
    isAuthenticated: !!token, // Derived from token presence
    isAdmin: !!(user && user.isAdmin), // Derived from user object
    logout,
    initializeAuth,
    handleGoogleLogin, // Ensure this is part of the context
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. Create useAuth Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
