import React, { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '../../services/analyticsService'; // Added import

// Placeholder for getAuthToken - should be from a shared auth context/service
const getAuthToken = (): string | null => {
  // console.warn("AdminDashboardPage: Using placeholder getAuthToken.");
  return localStorage.getItem('userToken');
};

interface AdminUserView {
  id: string | number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  is_active: boolean; // Added is_active field
}

interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  pageViews: number;
  averageSessionDuration: string;
  mostVisitedPages?: { path: string; visits: number }[];
  trafficSources?: { direct: number; organicSearch: number; referral: number };
}

const AdminDashboardPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true); // Renamed
  const [usersError, setUsersError] = useState<string | null>(null); // Renamed

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const fetchAllUsers = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUsersError("Admin actions require authentication (users)."); // Specific error
      setIsLoadingUsers(false);
      return;
    }
    setIsLoadingUsers(true);
    try {
      // This API endpoint (/api/admin/users) is conceptual and needs to be implemented in the backend
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 403) throw new Error('Access Denied: You do not have permission to view users.');
        throw new Error('Failed to fetch users list');
      }
      // Mocking is_active for now as backend doesn't support it
      const data: any[] = await response.json();
      const usersWithActiveStatus = data.map(user => ({
        ...user,
        is_active: true, // Mocking all users as active initially
      }));
      setUsers(usersWithActiveStatus);
      trackEvent('Admin', 'admin_view_users_success', 'User list successfully fetched');
    } catch (err) {
      console.error("Error fetching users:", err);
      const message = err instanceof Error ? err.message : 'Could not fetch users';
      setUsersError(message);
      trackEvent('Admin', 'admin_view_users_failed', message);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchAnalyticsData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setAnalyticsError("Admin actions require authentication (analytics).");
      setIsAnalyticsLoading(false);
      return;
    }
    setIsAnalyticsLoading(true);
    try {
      const response = await fetch('/api/admin/analytics/overview', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 403) throw new Error('Access Denied: You do not have permission to view analytics.');
        throw new Error('Failed to fetch analytics data');
      }
      const data: AnalyticsData = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching analytics data:", err);
      setAnalyticsError(err instanceof Error ? err.message : 'Could not fetch analytics');
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
    fetchAnalyticsData();
  }, [fetchAllUsers, fetchAnalyticsData]);

  const handleToggleAdminStatus = async (userId: string | number, currentIsAdmin: boolean) => {
    trackEvent('Admin', 'admin_toggle_admin_status_click', `User ID: ${userId} - Current Admin: ${currentIsAdmin}`); // Added event tracking
    // Placeholder for API call: PUT /api/admin/users/:userId/toggle-admin
    alert(`Placeholder: Toggle admin status for user ${userId} to ${!currentIsAdmin}. API call not implemented.`);
    // On success, call fetchAllUsers() to refresh the list.
  };

  const handleToggleUserActiveStatus = async (userId: string | number, currentIsActive: boolean, username: string) => {
    const newActiveState = !currentIsActive;
    trackEvent('Admin', 'admin_toggle_user_active_status_click', `User: ${username} (${userId}) - New Status: ${newActiveState ? 'Active' : 'Inactive'}`);

    // Placeholder: API call would happen here.
    // For now, just show an alert and update local state for UI demo.
    alert(`Placeholder: User '${username}' (ID: ${userId}) ${newActiveState ? 'activated' : 'deactivated'}. API call not implemented.`);

    // Update local state to reflect the change immediately for UI
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, is_active: newActiveState } : user
      )
    );
    // In a real app, you'd likely call fetchAllUsers() or update based on API response.
  };

  // Main loading state can check both, or handle them separately in JSX
  if (isLoadingUsers && isAnalyticsLoading) {
    return <div className="p-8 text-center">Loading dashboard data...</div>;
  }

  // Display errors first if any critical data failed to load
  // For simplicity, we show users error first, but this could be combined
  if (usersError && !users.length) { // Show critical error if users list failed and is empty
    return <div className="p-8 text-center text-red-500">Error loading users: {usersError}</div>;
  }


  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Admin Dashboard</h1>

      {/* Analytics Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-slate-700 mb-6">Site Analytics Overview</h2>
        {isAnalyticsLoading && <p className="text-slate-500">Loading analytics data...</p>}
        {analyticsError && <p className="text-red-500">Error loading analytics: {analyticsError}</p>}
        {analyticsData && !isAnalyticsLoading && !analyticsError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-slate-500 text-sm font-medium">Total Visits</h3>
              <p className="text-3xl font-semibold text-slate-800">{analyticsData.totalVisits}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-slate-500 text-sm font-medium">Unique Visitors</h3>
              <p className="text-3xl font-semibold text-slate-800">{analyticsData.uniqueVisitors}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-slate-500 text-sm font-medium">Page Views</h3>
              <p className="text-3xl font-semibold text-slate-800">{analyticsData.pageViews}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-slate-500 text-sm font-medium">Avg. Session</h3>
              <p className="text-3xl font-semibold text-slate-800">{analyticsData.averageSessionDuration}</p>
            </div>
          </div>
        )}
      </section>

      {/* User Management Section */}
      <section>
        <h2 className="text-2xl font-semibold text-slate-700 mb-6">User Management</h2>
        {isLoadingUsers && <p className="text-slate-500">Loading users...</p>}
        {usersError && <p className="text-red-500">Error: {usersError}</p>}
        {!isLoadingUsers && !usersError && users.length === 0 && (
          <p className="text-slate-600">No users found.</p>
        )}
        {!isLoadingUsers && users.length > 0 && (
          <div className="overflow-x-auto bg-white p-6 rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Username</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Is Admin?</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th> {/* Added Status column */}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.is_admin ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"> {/* Status cell */}
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleToggleAdminStatus(user.id, user.is_admin)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                      >
                        {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                      <button
                        onClick={() => handleToggleUserActiveStatus(user.id, user.is_active, user.username)}
                        className={`${
                          user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                        } transition-colors duration-150`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
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

export default AdminDashboardPage;
