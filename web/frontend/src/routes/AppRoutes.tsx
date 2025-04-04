import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import React, { useEffect } from "react";
import LoginPage from "../pages/LoginPage/LoginPage";
import HomePage from "../pages/HomePage/HomePage";
import ProfilePage from "../pages/ProfilePage/ProfilePage";
import SchedulePage from "../pages/SchedulePage/SchedulePage";
import ClassPage from "../pages/ClassPage/ClassPage";
import authService from "../services/authService";
import tokenRefresher from "../services/tokenRefresher";

// Component to protect routes
const ProtectedRoute = ({ element }: { element: React.JSX.Element }) => {
  return authService.isAuthenticated() ? element : <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
  { path: "/", element: <ProtectedRoute element={<HomePage />} /> },
  { path: "/login", element: <LoginPage/> },
  { path: "/profile", element: <ProtectedRoute element={<ProfilePage />} /> },
  { path: "/schedule", element: <ProtectedRoute element={<SchedulePage />} /> },
  { path: "/class", element: <ProtectedRoute element={<ClassPage />} /> },
]);

export default function AppRoutes() {
  useEffect(() => {
    // Start token refresh mechanism if user is logged in
    if (authService.isAuthenticated()) {
      tokenRefresher.startTokenRefresh();
    }
    
    // Cleanup when component unmounts
    return () => {
      tokenRefresher.stopTokenRefresh();
    };
  }, []);
  
  return <RouterProvider router={router} />;
}