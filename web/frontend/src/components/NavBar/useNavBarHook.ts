import { useNavigate } from "react-router";
import { removeTokens } from "../../services/tokenServices";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { handleLogout } from "../../store/slices/loginSlice";
import { useEffect, useState } from "react";
import { logout } from "../../store/slices/authSlice";

interface UserData {
  userId: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
}

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
  const [userFullName, setUserFullName] = useState<string>("");
  const [userAvatar, setUserAvatar] = useState<string>("");
  
  const role = useSelector((state: RootState) => state.authUser.role);
  
  // Get user info from localStorage
  useEffect(() => {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const userData: UserData = JSON.parse(userString);
        setUserFullName(userData.fullName || userData.name || userData.userId || "User");
        
        // Check if we have avatar stored somewhere
        const avatarUrl = localStorage.getItem('userAvatar');
        if (avatarUrl) {
          setUserAvatar(avatarUrl);
        }
      }
    } catch (error) {
      console.error("Failed to get user info from localStorage:", error);
    }
  }, []);
  
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
    // Make sure to clear all storage
    removeTokens(); // This now also removes 'user' from localStorage
    
    // Clear user info from memory
    setUserFullName("");
    setUserAvatar("");
    
    // Clear from Redux stores
    dispatch(handleLogout());
    dispatch(logout());
    
    // Clear any other related storage items
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    localStorage.removeItem('userAvatar');
    sessionStorage.removeItem('userAvatar');
    
    // Force reload after timeout to ensure clean state
    const reloadTimeout = setTimeout(() => {
      navigate("/login", {
        state: { message: "Đăng xuất thành công!" },
      });
      clearTimeout(reloadTimeout);
    }, 100);
  };
  
  const handleOnNavigate = (onNav: string) => {
    switch (onNav) {
      case "HomePage":
      case "HomePage Admin":
        return navigate("/");
      case "Profile":
        return navigate("/profile");
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
  
  const state = { navItems, userFullName, userAvatar };
  const state = { navItems,role };
  const handler = { handleOnNavigate };
  return { state, handler };
}

export default useNavBarHook;
