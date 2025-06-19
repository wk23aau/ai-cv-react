import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext'; // Import useAuth
import { User } from '../AuthContext'; // Import User type if not already available globally

// Placeholder for CV metadata type - ensure this matches your actual backend response structure
interface CVMeta {
  id: string | number;
  name: string;
  template_id?: string | number;
  created_at: string;
  updated_at: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth(); // Use AuthContext
  const { user: authUser, token: authToken, isLoading: isAuthLoading } = auth; // Destructure for convenience

  // Use auth.user for profile information directly, no separate user state needed here
  const [cvs, setCvs] = useState<CVMeta[]>([]);
  // isLoadingUser is now covered by auth.isLoading
  const [isLoadingCvs, setIsLoadingCvs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for profile update
  // Initialize with authUser data or empty strings if not available yet
  const [editUsername, setEditUsername] = useState(authUser?.username || '');
  const [editEmail, setEditEmail] = useState(authUser?.email || '');
  const [editPassword, setEditPassword] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Update form fields when authUser changes (e.g., after initial load)
  useEffect(() => {
    if (authUser) {
      setEditUsername(authUser.username);
      setEditEmail(authUser.email);
    }
  }, [authUser]);

  // fetchUserProfile is no longer needed as auth.user provides the profile
  // The AuthProvider handles fetching/initializing user data.

  const fetchUserCvs = useCallback(async () => {
    if (!authToken) { // Use authToken from context
      // This should ideally not happen if DashboardPage is protected by ProtectedRoute
      setError("Not authenticated to fetch CVs.");
      setIsLoadingCvs(false);
      return;
    }
    setIsLoadingCvs(true);
    setError(null);
    try {
      const response = await fetch('/api/cvs', {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: 'Failed to fetch CVs' }));
        throw new Error(errData.message);
      }
      const data: CVMeta[] = await response.json();
      setCvs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch CVs');
    } finally {
      setIsLoadingCvs(false);
    }
  }, [authToken]); // Depend on authToken

  useEffect(() => {
    // Fetch CVs only if authenticated and not already loading auth state
    if (!isAuthLoading && authToken) {
      fetchUserCvs();
    } else if (!isAuthLoading && !authToken) {
      // If auth is resolved and no token, might indicate an issue or user logged out
      // ProtectedRoute should handle redirection, but good to be defensive
      navigate('/login');
    }
  }, [isAuthLoading, authToken, fetchUserCvs, navigate]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken || !authUser) {
      setError("Not authenticated to update profile.");
      return;
    }
    setError(null);

    const updates: Partial<User & { password?: string }> = {};
    if (editUsername !== authUser.username) updates.username = editUsername;
    if (editEmail !== authUser.email) updates.email = editEmail;
    if (editPassword) updates.password = editPassword;

    if (Object.keys(updates).length === 0) {
        setIsEditingProfile(false);
        return;
    }

    try {
        const response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Failed to update profile");
        }
        const updatedUser = await response.json();
        // AuthProvider should ideally update its user state.
        // For now, we can manually update local display or rely on AuthProvider's next init.
        // A better approach would be for auth.login/auth.updateUser to handle this.
        // As a quick fix, we can update localStorage and trigger a re-init or state update in AuthContext.
        // For simplicity, we'll assume AuthContext might re-fetch or that a page reload would show changes.
        // Or, we can update the authUser in AuthContext if we add an updateUser method.
        // For now, just showing an alert and resetting form.
        alert("Profile updated successfully! The changes will be reflected (you may need to refresh or re-login to see them everywhere if AuthContext doesn't auto-update user details globally yet).");
        setEditPassword('');
        setIsEditingProfile(false);
        // Re-fetch user profile if AuthContext doesn't auto-update globally
        // This could be handled by adding an `updateUserContext` method to AuthContext
        // For now, the user object in the header (if any) might not update immediately.
        // The AuthProvider's user state needs to be updated.
        // A simple way: auth.initializeAuth(); // Re-trigger from localStorage
        // Or better: add a method to AuthContext to set the user.
        // auth.setUser(updatedUser); // If such a method existed
        localStorage.setItem('userInfo', JSON.stringify(updatedUser)); // Update local storage for next init
        auth.initializeAuth(); // Re-initialize to pick up changes (simple approach)


    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Could not update profile";
        setError(errorMsg);
        alert(`Error: ${errorMsg}`);
    }
  };

  const handleDeleteCv = async (cvId: string | number) => {
    if (!confirm("Are you sure you want to delete this CV? This action cannot be undone.")) return;
    if (!authToken) {
      setError("Not authenticated to delete CV.");
      return;
    }
    setError(null);
    try {
        const response = await fetch(`/api/cvs/${cvId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Failed to delete CV");
        }
        fetchUserCvs(); // Refresh CV list
        alert("CV deleted successfully.");
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Could not delete CV";
        setError(errorMsg);
        alert(`Error: ${errorMsg}`);
    }
  };

  // Use auth.isLoading for the main loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex justify-center items-center">
        <div className="text-sky-600 text-xl">Loading Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 bg-white rounded-lg shadow-md">Error: {error} <button onClick={() => { setError(null); fetchUserCvs(); /* fetchUserProfile(); */ }} className="ml-2 text-blue-500">Retry</button></div>;
  }

  if (!authUser) {
    // This case should ideally be handled by ProtectedRoute redirecting to login
    // but as a fallback:
    return <div className="p-8 text-center text-red-500">User not found. Please try logging in again. <Link to="/login" className="text-blue-500">Login</Link></div>;
  }


  return (
    // This page will be rendered within AppLayout (MainHeader, MainFooter)
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">My Dashboard</h1>
      <p className="text-lg text-slate-600 mb-10">Welcome back, {authUser?.username || 'User'}!</p>

      {/* My Profile Section */}
      <section className="mb-12 bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-slate-700">My Profile</h2>
            {!isEditingProfile && (
                 <button
                    onClick={() => { setIsEditingProfile(true); setEditUsername(authUser.username); setEditEmail(authUser.email); setEditPassword(''); setError(null); }}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded-lg text-sm shadow-sm hover:shadow-md transition-all"
                >
                    Edit Profile
                </button>
            )}
        </div>
        {!isEditingProfile && authUser && (
          <div className="space-y-2">
            <p><strong className="font-medium text-slate-600">Username:</strong> {authUser.username}</p>
            <p><strong className="font-medium text-slate-600">Email:</strong> {authUser.email}</p>
            <p><strong className="font-medium text-slate-600">Role:</strong> {authUser.isAdmin ? 'Admin' : 'User'}</p>
          </div>
        )}
        {isEditingProfile && authUser && (
            <form onSubmit={handleProfileUpdate} className="space-y-4 mt-4">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
                    <input type="text" id="username" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                    <input type="email" id="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">New Password (optional)</label>
                    <input type="password" id="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Leave blank to keep current password" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
                </div>
                <div className="flex gap-4 pt-2">
                    <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg text-sm shadow-sm hover:shadow-md transition-all">Save Changes</button>
                    <button type="button" onClick={() => { setIsEditingProfile(false); setEditPassword(''); setError(null); }} className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-medium py-2 px-4 rounded-lg text-sm shadow-sm hover:shadow-md transition-all">Cancel</button>
                </div>
            </form>
        )}
         {/* Placeholder text as per requirement, though current implementation is more functional */}
        <p className="text-sm text-slate-500 mt-2">
            Manage your personal information, security settings, and communication preferences here.
            (Current functionality allows username, email, and password updates.)
        </p>
      </section>

      {/* My CVs Section */}
      <section className="mb-12 bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-700">My CVs</h2>
            <Link
                to="/editor" // This is the "Create New CV" button
                className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded-lg text-sm shadow-sm hover:shadow-md transition-all"
            >
                + Create New CV
            </Link>
        </div>
        {isLoadingCvs ? (
            <p className="text-slate-600 text-center py-4">Loading your CVs...</p>
        ) : cvs.length === 0 ? (
          <p className="text-slate-600 text-center py-4">You haven't created any CVs yet. Click "Create New CV" to get started!</p>
        ) : (
          {/* Placeholder text as per requirement, though current implementation is more functional */}
          <p className="text-sm text-slate-500 mb-4">
            You will be able to manage your CVs here. (Current functionality allows creating, viewing, editing, and deleting CVs.)
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {cvs.map((cv) => (
                  <tr key={cv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{cv.name || 'Untitled CV'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(cv.updated_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button onClick={() => navigate(`/editor/${cv.id}`)} className="text-sky-600 hover:text-sky-800 transition-colors">Edit</button>
                      <button onClick={() => navigate(`/editor/${cv.id}`)} className="text-green-600 hover:text-green-800 transition-colors">View/Download</button>
                      <button onClick={() => handleDeleteCv(cv.id)} className="text-red-600 hover:text-red-800 transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
