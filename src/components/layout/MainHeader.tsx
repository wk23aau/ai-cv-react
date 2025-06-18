import React from 'react';
import { Link } from 'react-router-dom';

const MainHeader: React.FC = () => {
  return (
    <header className="bg-slate-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold">JD2CV</Link>
        <nav>
          <Link to="/editor" className="px-3 py-2 hover:bg-slate-700 rounded">Editor</Link>
          <Link to="/dashboard" className="px-3 py-2 hover:bg-slate-700 rounded">Dashboard</Link>
          {/* Add more links like Features, Templates, Login, Sign Up as needed */}
          <Link to="/login" className="px-3 py-2 hover:bg-slate-700 rounded">Login</Link>
          <Link to="/signup" className="px-3 py-2 hover:bg-slate-700 rounded">Sign Up</Link>
        </nav>
      </div>
    </header>
  );
};

export default MainHeader;
