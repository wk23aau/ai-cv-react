import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import MainFooter from './MainFooter'; // Assuming MainFooter can be reused

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-slate-800 text-white shadow-md">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/admin/dashboard" className="text-xl font-bold hover:text-slate-300">
            Admin Panel
          </Link>
          <div className="space-x-4">
            <Link to="/admin/dashboard" className="hover:text-slate-300">Dashboard</Link>
            {/* Placeholder for future admin links */}
            <Link to="/admin/settings" className="hover:text-slate-300">Settings (Placeholder)</Link>
            <Link to="/" className="hover:text-slate-300">Back to Site</Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <Outlet /> {/* Child routes will render here */}
      </main>

      <MainFooter /> {/* Or a specific AdminFooter if preferred */}
    </div>
  );
};

export default AdminLayout;
