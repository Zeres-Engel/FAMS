import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { username: 'Student' };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  
  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-600' : '';
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header/Navigation */}
      <header className="bg-blue-700 text-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Student Management System</h1>
            </div>
            <nav className="hidden md:flex space-x-4">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded hover:bg-blue-600 ${isActive('/dashboard')}`}
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/profile"
                className={`px-3 py-2 rounded hover:bg-blue-600 ${isActive('/dashboard/profile')}`}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded hover:bg-blue-600"
              >
                Logout
              </button>
            </nav>
            <div className="flex items-center md:hidden">
              <div className="mr-2">{user.username}</div>
              <div className="w-8 h-8 rounded-full bg-white text-blue-700 flex items-center justify-center">
                {user.username ? user.username[0].toUpperCase() : 'S'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            <Link
              to="/dashboard"
              className={`px-3 py-2 ${isActive('/dashboard') ? 'font-bold' : ''}`}
            >
              Dashboard
            </Link>
            <Link
              to="/dashboard/profile"
              className={`px-3 py-2 ${isActive('/dashboard/profile') ? 'font-bold' : ''}`}
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <Outlet />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-600">
          &copy; {new Date().getFullYear()} Student Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default StudentLayout; 