import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentManagement from './pages/admin/StudentManagement';

// Layout components
import AdminLayout from './components/layouts/AdminLayout';
import StudentLayout from './components/layouts/StudentLayout';

// Auth protection wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const userString = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (!token || !userString) {
    return <Navigate to="/login" />;
  }
  
  try {
    const user = JSON.parse(userString);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" />;
    }
    
    return children;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/unauthorized" element={<div className="p-8 text-center">You don't have permission to access this page</div>} />
        
        {/* Admin routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<div>Admin Dashboard</div>} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="students/add" element={<div>Add Student</div>} />
          <Route path="students/edit/:id" element={<div>Edit Student</div>} />
          <Route path="*" element={<Navigate to="/admin/dashboard" />} />
        </Route>
        
        {/* Student routes */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute allowedRoles={['student', 'teacher']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="" element={<div>Student Dashboard</div>} />
          <Route path="profile" element={<div>Student Profile</div>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App; 