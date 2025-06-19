import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';

interface AdminUserView {
  id: string | number;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

interface SiteAnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  averageSessionDuration: string; // e.g., "5m 30s"
  newUsers: number;
}

interface GASettingsData {
  measurementId: string;
  propertyId: string;
}

const AdminDashboardPage: React.FC = () => {
  const { token, isLoading: isAuthLoading, user } = useAuth();
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<Record<string, boolean>>({}); // To track loading per user action
  const [analyticsData, setAnalyticsData] = useState<SiteAnalyticsData | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [gaMeasurementIdInput, setGaMeasurementIdInput] = useState('');
  const [gaPropertyIdInput, setGaPropertyIdInput] = useState('');
  const [isGASettingsLoading, setIsGASettingsLoading] = useState(true); // To load initial settings
  const [isGASaving, setIsGASaving] = useState(false); // For save operation
  const [gaSettingsError, setGaSettingsError] = useState<string | null>(null);
  const [gaSettingsSuccess, setGaSettingsSuccess] = useState<string | null>(null);

  const fetchAllUsers = useCallback(async () => {
    console.log('[AdminDashboard] Event: fetchAllUsers triggered.');
    if (!token) {
      setUsersError("Admin actions require an active session. Please login again.");
      setIsUsersLoading(false);
      return;
    }
    setIsUsersLoading(true);
    try {
      // This API endpoint (/api/admin/users) is conceptual and needs to be implemented in the backend
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 403) throw new Error('Access Denied: You do not have permission to view users.');
        throw new Error('Failed to fetch users list');
      }
      const data: AdminUserView[] = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsersError(err instanceof Error ? err.message : 'Could not fetch users');
    } finally {
      setIsUsersLoading(false);
    }
  }, [token]);

  const fetchAnalyticsData = useCallback(async () => {
    console.log('[AdminDashboard] Event: fetchAnalyticsData triggered.');
    if (!token) {
      setAnalyticsError("Authentication required to fetch analytics.");
      setIsAnalyticsLoading(false);
      return;
    }

    setIsAnalyticsLoading(true);
    setAnalyticsError(null);

    try {
      const response = await fetch('/api/admin/analytics/overview', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Failed to fetch analytics. Status: ${response.status} ${response.statusText || ''}`.trim()
        }));
        throw new Error(errorData.message || 'Could not fetch site analytics.');
      }

      const data: SiteAnalyticsData = await response.json();
      setAnalyticsData(data);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred while fetching site analytics.";
      setAnalyticsError(errorMsg);
      setAnalyticsData(null); // Clear any old data
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, [token]); // Keep token in dependency array

  const fetchGASettings = useCallback(async () => {
    console.log('[AdminDashboard] Event: fetchGASettings triggered.');
    if (!token) {
      setGaSettingsError("Authentication required to fetch GA settings.");
      setIsGASettingsLoading(false);
      return;
    }

    setIsGASettingsLoading(true);
    setGaSettingsError(null);
    setGaSettingsSuccess(null); // Clear previous success messages

    try {
      const response = await fetch('/api/admin/settings/ga', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Failed to fetch GA settings. Status: ${response.status} ${response.statusText || ''}`.trim()
        }));
        throw new Error(errorData.message || 'Could not retrieve GA settings.');
      }

      const data = await response.json();
      setGaMeasurementIdInput(data.measurementId || '');
      setGaPropertyIdInput(data.propertyId || '');

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred while fetching GA settings.";
      setGaSettingsError(errorMsg);
    } finally {
      setIsGASettingsLoading(false);
    }
  }, [token]);

  const handleSaveGASettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(`[AdminDashboard] Event: handleSaveGASettings triggered with Measurement ID: ${gaMeasurementIdInput}, Property ID: ${gaPropertyIdInput}`);
    if (!token) {
      setGaSettingsError("Authentication required to save GA settings.");
      return;
    }

    setIsGASaving(true);
    setGaSettingsError(null);
    setGaSettingsSuccess(null);

    try {
      const response = await fetch('/api/admin/settings/ga', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          measurementId: gaMeasurementIdInput,
          propertyId: gaPropertyIdInput,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Failed to save GA settings. Status: ${response.status} ${response.statusText || ''}`.trim()
        }));
        throw new Error(errorData.message || 'Could not save GA settings.');
      }

      const data = await response.json();
      setGaSettingsSuccess(data.message || "GA settings saved successfully!");
      // Optionally, re-fetch to confirm, or trust the save.
      // fetchGASettings();

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred while saving GA settings.";
      setGaSettingsError(errorMsg);
    } finally {
      setIsGASaving(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for authentication to resolve
    }
    if (token && user?.isAdmin) {
      fetchAllUsers();
      fetchAnalyticsData();
      fetchGASettings(); // Call to fetch GA settings
    } else {
      // Handle non-admin or no token cases for GA settings as well
      if (!user || !user.isAdmin) {
          setUsersError('Access Denied: You do not have permission to view users.');
          setAnalyticsError('Access Denied: You do not have permission to view analytics.');
          setGaSettingsError('Access Denied: You do not have permission to configure GA settings.');
      } else if (!token && !isAuthLoading) { // Auth loaded, but no token
          setUsersError('Authentication token not found. Please log in.');
          setAnalyticsError('Authentication token not found. Please log in.');
          setGaSettingsError('Authentication token not found. Please log in.');
      }
      setIsUsersLoading(false);
      setIsAnalyticsLoading(false);
      setIsGASettingsLoading(false); // Ensure GA loading is also false
    }
  }, [token, user, isAuthLoading, fetchAllUsers, fetchAnalyticsData, fetchGASettings]); // Add fetchGASettings

  const handleToggleAdminStatus = async (userId: string | number, currentIsAdmin: boolean) => {
    console.log(`[AdminDashboard] Event: handleToggleAdminStatus for user ID: ${userId} - Feature currently disabled.`);
    // alert("Toggling admin status is temporarily disabled."); // Or setActionError
    // No API call or state changes related to this action should occur.
  };

  const handleToggleUserActiveStatus = async (userId: string | number, currentIsActive: boolean) => {
    console.log(`[AdminDashboard] Event: handleToggleUserActiveStatus triggered for user ID: ${userId}, to set active: ${!currentIsActive}`);
    if (!token) {
      setActionError("Authentication required to perform this action.");
      return;
    }
    setActionError(null);
    setIsActionLoading(prev => ({ ...prev, [`active_${userId}`]: true }));

    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No 'Content-Type' needed if no body
        },
        // No body needed for this specific backend implementation of toggle
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Operation failed. Status: ${response.status} ${response.statusText || ''}`.trim()
        }));
        throw new Error(errorData.message || `Failed to toggle active status for user ${userId}.`);
      }

      const data = await response.json();
      // console.log(data.message); // Optional: log success message from backend

      await fetchAllUsers(); // Refresh users list
      // Success alert removed, list refresh is the feedback
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred while toggling active status.';
      setActionError(errorMsg);
      // Error alert removed, actionError state will display it
    } finally {
      setIsActionLoading(prev => ({ ...prev, [`active_${userId}`]: false }));
    }
  };

  if (isAuthLoading) {
    return <div className="p-8 text-center text-slate-600">Loading authentication...</div>;
  }

  const accessDenied = (!user || !user.isAdmin) || (usersError && usersError.startsWith("Access Denied"));
  if (accessDenied) {
      const accessDeniedMessage = (usersError && usersError.startsWith("Access Denied"))
                                 ? usersError
                                 : "Access Denied: You must be an administrator to view this page.";
      return <div className="p-8 text-center text-red-500">{accessDeniedMessage}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>

      <section className="p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold text-slate-700 mb-6">User Management</h2>
        {actionError && <div className="my-2 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md">{actionError}</div>}
        {isUsersLoading && <div className="p-4 text-center text-slate-500">Loading users...</div>}
        {!isUsersLoading && usersError && <div className="p-4 text-center text-red-500">Error: {usersError}</div>}
        {!isUsersLoading && !usersError && users.length === 0 && (
          <p className="text-slate-600">No users found.</p>
        )}
        {!isUsersLoading && !usersError && users.length > 0 && (
          <div className="overflow-x-auto"> {/* Wrapper for table responsiveness */}
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Username</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Is Admin?</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Active?</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((userRow) => ( // Renamed user to userRow to avoid conflict with user from useAuth
                  <tr key={userRow.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{userRow.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{userRow.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{userRow.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{userRow.is_admin ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{userRow.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(userRow.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        className="text-slate-400 opacity-70 cursor-not-allowed" // Visually indicate disabled
                        disabled // Disable the button
                        title="Admin status toggling is temporarily disabled" // Tooltip
                      >
                        {userRow.is_admin ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleToggleUserActiveStatus(userRow.id, userRow.is_active)}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        disabled={isActionLoading[`active_${userRow.id}`]}
                      >
                        {isActionLoading[`active_${userRow.id}`] ? 'Processing...' : (userRow.is_active ? 'Deactivate' : 'Activate')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8 p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold text-slate-700 mb-4">Site Analytics Overview</h2>
        {isAnalyticsLoading && <div className="text-center text-slate-500 py-4">Loading analytics data...</div>}
        {!isAnalyticsLoading && analyticsError && (
          <div className="p-4 text-center text-red-500 bg-red-50 border border-red-200 rounded-md">
            Error: {analyticsError}
            <button
              onClick={fetchAnalyticsData}
              className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Retry
            </button>
          </div>
        )}
        {!isAnalyticsLoading && !analyticsError && analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-slate-700">Total Visits</h3>
              <p className="text-3xl text-sky-600">{analyticsData.totalVisits.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-slate-700">Unique Visitors</h3>
              <p className="text-3xl text-sky-600">{analyticsData.uniqueVisitors.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-slate-700">Page Views</h3>
              <p className="text-3xl text-sky-600">{analyticsData.pageViews.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-slate-700">Avg. Session Duration</h3>
              <p className="text-3xl text-sky-600">{analyticsData.averageSessionDuration}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-slate-700">New Users</h3>
              <p className="text-3xl text-sky-600">{analyticsData.newUsers.toLocaleString()}</p>
            </div>
          </div>
        )}
        {!isAnalyticsLoading && !analyticsError && !analyticsData && (
          <p className="text-slate-500">No analytics data available at the moment.</p>
        )}
      </section>

      <section className="p-6 bg-white shadow-lg rounded-lg"> {/* Removed mb-8 for the last section */}
        <h2 className="text-2xl font-semibold text-slate-700 mb-4">Google Analytics Configuration</h2>
        {isGASettingsLoading && <div className="text-center text-slate-500 py-4">Loading GA settings...</div>}
        {!isGASettingsLoading && gaSettingsError && !isGASaving && ( // Don't show loading error if currently saving
          <div className="p-3 mb-4 text-center text-red-600 bg-red-100 border border-red-300 rounded-md">
            Error loading settings: {gaSettingsError}
            <button
              onClick={fetchGASettings}
              className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Retry Load
            </button>
          </div>
        )}
        {!isGASettingsLoading && (
          <form onSubmit={handleSaveGASettings} className="space-y-6">
            <div>
              <label htmlFor="gaMeasurementId" className="block text-sm font-medium text-slate-700">
                GA Measurement ID (e.g., G-XXXXXXXXXX)
              </label>
              <input
                type="text"
                id="gaMeasurementId"
                name="gaMeasurementId"
                value={gaMeasurementIdInput}
                onChange={(e) => setGaMeasurementIdInput(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="G-XXXXXXXXXX"
              />
            </div>
            <div>
              <label htmlFor="gaPropertyId" className="block text-sm font-medium text-slate-700">
                GA Property ID (e.g., UA-XXXXXXXXX-X)
              </label>
              <input
                type="text"
                id="gaPropertyId"
                name="gaPropertyId"
                value={gaPropertyIdInput}
                onChange={(e) => setGaPropertyIdInput(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="UA-XXXXXXXXX-X"
              />
            </div>

            {/* Display saving error or success messages */}
            {isGASaving && <div className="text-slate-600">Saving settings...</div>}
            {!isGASaving && gaSettingsError && (
              <div className="p-3 text-red-700 bg-red-100 border border-red-300 rounded-md">
                Error saving settings: {gaSettingsError}
              </div>
            )}
            {!isGASaving && gaSettingsSuccess && (
              <div className="p-3 text-green-700 bg-green-100 border border-green-300 rounded-md">
                {gaSettingsSuccess}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isGASaving || isGASettingsLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
              >
                {isGASaving ? 'Saving...' : 'Save GA Settings'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default AdminDashboardPage;
