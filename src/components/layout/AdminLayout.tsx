import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import MainFooter from './MainFooter'; // Assuming MainFooter can be reused

const AdminLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <header className="bg-slate-800 text-white shadow-md">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <NavLink to="/admin/dashboard" className="text-xl font-bold hover:text-slate-300">
            Admin Panel
          </NavLink>
          <div className="space-x-4">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 ${
                  isActive ? 'bg-slate-900' : ''
                }`
              }
            >
              Dashboard
            </NavLink>
            {/* Add more admin navigation links here as needed */}
            {/* Example:
            <NavLink
              to="/admin/settings" // Assuming a future settings page
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 ${
                  isActive ? 'bg-slate-900' : ''
                }`
              }
            >
              Settings
            </NavLink>
            */}
            <NavLink
              to="/" // Link back to the main site
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700"
            >
              Back to Site
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        {/* Child route components will be rendered here */}
        <Outlet />
      </main>

      <MainFooter /> {/* Reusing MainFooter, or use a specific AdminFooter */}
    </div>
  );
};

export default AdminLayout;
