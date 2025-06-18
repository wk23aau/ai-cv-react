import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Placeholder for getAuthToken - should be from a shared auth context/service
const getAuthToken = (): string | null => {
  // console.warn("DashboardPage: Using placeholder getAuthToken.");
  return localStorage.getItem('userToken');
};

// Placeholder for user type - replace with actual type from your types.ts
interface UserProfile {
  id: string | number;
  username: string;
  email: string;
  // Add other fields as necessary
}

// Placeholder for CV metadata type
interface CVMeta {
  id: string | number;
  name: string;
  template_id?: string | number;
  created_at: string;
  updated_at: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cvs, setCvs] = useState<CVMeta[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingCvs, setIsLoadingCvs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for profile update
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setIsLoadingUser(true);
    try {
      const response = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch user profile');
      const data: UserProfile = await response.json();
      setUser(data);
      setEditUsername(data.username);
      setEditEmail(data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch profile');
    } finally {
      setIsLoadingUser(false);
    }
  }, [navigate]);

  const fetchUserCvs = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return; // Should be handled by ProtectedRoute, but good check
    setIsLoadingCvs(true);
    try {
      const response = await fetch('/api/cvs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch CVs');
      const data: CVMeta[] = await response.json();
      setCvs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch CVs');
    } finally {
      setIsLoadingCvs(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
    fetchUserCvs();
  }, [fetchUserProfile, fetchUserCvs]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !user) return;

    const updates: Partial<UserProfile & { password?: string }> = {};
    if (editUsername !== user.username) updates.username = editUsername;
    if (editEmail !== user.email) updates.email = editEmail;
    if (editPassword) updates.password = editPassword;

    if (Object.keys(updates).length === 0) {
        setIsEditingProfile(false);
        return;
    }

    // console.log("Updating profile with:", updates); // Placeholder for API call
    // TODO: Implement API call to PUT /api/users/me
    try {
        const response = await fetch('/api/users/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Failed to update profile");
        }
        const updatedUser = await response.json();
        setUser(updatedUser);
        setEditUsername(updatedUser.username);
        setEditEmail(updatedUser.email);
        setEditPassword(''); // Clear password field
        setIsEditingProfile(false);
        alert("Profile updated successfully!"); // Replace with better notification
    } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update profile");
        alert(`Error: ${err instanceof Error ? err.message : "Could not update profile"}`);
    }
  };

  const handleDeleteCv = async (cvId: string | number) => {
    if (!confirm("Are you sure you want to delete this CV? This action cannot be undone.")) return;
    const token = getAuthToken();
    if (!token) return;
    try {
        const response = await fetch(`/api/cvs/${cvId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || "Failed to delete CV");
        }
        // Refresh CV list
        fetchUserCvs();
        alert("CV deleted successfully.");
    } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete CV");
        alert(`Error: ${err instanceof Error ? err.message : "Could not delete CV"}`);
    }
  };


  if (isLoadingUser || isLoadingCvs) {
    return <div className="p-8 text-center">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">User Dashboard</h1>

      {/* User Profile Section */}
      <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-slate-700 mb-4">My Profile</h2>
        {user && !isEditingProfile && (
          <div>
            <p className="mb-2"><strong className="font-medium text-slate-600">Username:</strong> {user.username}</p>
            <p className="mb-4"><strong className="font-medium text-slate-600">Email:</strong> {user.email}</p>
            <button
                onClick={() => setIsEditingProfile(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md text-sm"
            >
                Edit Profile
            </button>
          </div>
        )}
        {isEditingProfile && user && (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
                    <input type="text" id="username" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                    <input type="email" id="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">New Password (optional)</label>
                    <input type="password" id="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Leave blank to keep current password" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="flex gap-4">
                    <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md text-sm">Save Changes</button>
                    <button type="button" onClick={() => { setIsEditingProfile(false); setEditPassword(''); /* Reset fields if needed */ }} className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-medium py-2 px-4 rounded-md text-sm">Cancel</button>
                </div>
            </form>
        )}
      </section>

      {/* Saved CVs Section */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-700">My CVs</h2>
            <Link
                to="/editor"
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md text-sm"
            >
                + Create New CV
            </Link>
        </div>
        {cvs.length === 0 ? (
          <p className="text-slate-600">You haven't created any CVs yet.</p>
        ) : (
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
                  <tr key={cv.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{cv.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(cv.updated_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onClick={() => navigate(`/editor/${cv.id}`)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                      {/* Placeholder for Download - PDF generation logic is in EditorPage */}
                      <button onClick={() => alert('Download functionality to be implemented from EditorPage.')} className="text-green-600 hover:text-green-900">Download</button>
                      <button onClick={() => handleDeleteCv(cv.id)} className="text-red-600 hover:text-red-900">Delete</button>
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
