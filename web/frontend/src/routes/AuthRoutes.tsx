import { Navigate } from "react-router";
// Hàm kiểm tra user có đăng nhập không
const authUser = () => {
  return document.cookie.includes("jwtToken");
};

// Component bảo vệ route
export default function AuthRoute({ element }: { element: React.JSX.Element }) {
  return authUser() ? element : <Navigate to="/login" replace />;
}
// khoong cos thaamr quyeefn quay ve page nao do
// set logout
