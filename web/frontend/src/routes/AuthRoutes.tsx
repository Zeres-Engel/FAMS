import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router";
import { RootState } from "../store/store";

interface AuthWrapperProps {
  element: React.JSX.Element;
  mode: "private" | "guest" | "admin";
}

const authUser = () => {
  const accessToken = sessionStorage.getItem("accessToken");
  return !!accessToken;
};

export default function AuthWrapper({ element, mode }: AuthWrapperProps) {
  const role = useSelector((state: RootState) => state.authUser.role);
  const location = useLocation();
  if (location.pathname === "/" && authUser()) {
    if (role === "admin") return <Navigate to="/AdminHomePage" replace />;
    return <Navigate to="/UserHomePage" replace />;
  }

  if (mode === "private") {
    return authUser() ? (
      element
    ) : (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, message: "You need to login again to continue" }}
      />
    );
  }

  if (mode === "admin") {
    return authUser() && role === "admin" ? (
      element
    ) : (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, message: "You need to login again to continue" }}
      />
    );
  }

  if (mode === "guest") {
    return authUser() ? <Navigate to="/" replace /> : element;
  }

  return null;
}
