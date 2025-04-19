import { useNavigate } from "react-router";
import { removeTokens } from "../../services/tokenServices";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { handleLogout } from "../../store/slices/loginSlice";
import { useEffect, useState } from "react";
import { logout } from "../../store/slices/authSlice";

function useNavBarHook() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [navItems, setNavItems] = useState<string[]>([
    "HomePage",
    "Profile",
    "Schedule",
    "Class",
    "Attendance",
    "Notify",
    "Logout",
  ]);
  const role = useSelector((state: RootState) => state.authUser.role);
  useEffect(() => {
    if (role === "admin") {
      setNavItems([
        "HomePage Admin",
        "Profile",
        "System Management",
        "User Management",
        "Schedule Management",
        "Class Management",
        "Attendance Management",
        "Notify Management",
        "Logout",
      ]);
    } else {
      setNavItems([
        "HomePage",
        "Profile",
        "Schedule",
        "Class",
        "Attendance",
        "Notify",
        "Logout",
      ]);
    }
  }, [role]);
  const handleLogoutRequest = () => {
    removeTokens();
    dispatch(handleLogout());
    dispatch(logout());
    navigate("/login", {
      state: { message: "Đăng xuất thành công!" },
    });
  };
  const handleOnNavigate = (onNav: string) => {
    switch (onNav) {
      case "HomePage":
      case "HomePage Admin":
        return navigate("/");
      case "Profile":
        return navigate("/Profile");
      case "User Management":
        return navigate("/UserManagement");
      case "System Management":
        return navigate("/IdentifyManagement");
      case "Schedule":
        return navigate("/Schedule");
      case "Schedule Management":
        return navigate("/ScheduleManagement");
      case "Class":
        return navigate("/Class");
      case "Class Management":
        return navigate("/ClassManagement");
      case "Attendance":
        return navigate("/Attendance");
      case "Attendance Management":
        return navigate("/AttendanceManagement");
      case "Notify":
        return navigate("/Notify");
      case "Notify Management":
        return navigate("/NotifyManagement");
      default:
        return handleLogoutRequest();
    }
  };
  const state = { navItems,role };
  const handler = { handleOnNavigate };
  return { state, handler };
}
export default useNavBarHook;
