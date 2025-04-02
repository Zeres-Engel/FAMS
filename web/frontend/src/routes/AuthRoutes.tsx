import React from "react";
import { Navigate } from "react-router-dom";
// Hàm kiểm tra user có đăng nhập không
const authUser = () => {
  return document.cookie.includes("jwtToken");
};

// Component bảo vệ route
export default function AuthRoute({ element }: { element: React.ReactNode }) {
  return authUser() ? element : <Navigate to="/login" replace />;
}