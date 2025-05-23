import { useNavigate } from "react-router-dom";
import { removeTokens } from "../../services/tokenServices";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { handleLogout } from "../../store/slices/loginSlice";
import { useEffect, useState } from "react";
import { logout } from "../../store/slices/authSlice";
import axiosInstance from "../../services/axiosInstance";
import { fetchParentProfile } from "../../store/slices/parentSlice";

interface UserData {
  userId: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
  avatar?: string;
}

interface UserDetailsResponse {
  success: boolean;
  data: Array<{
    backup_email: string | null;
    _id: string;
    userId: string;
    email: string;
    password: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    avatar: string | null;
    username: string;
    id: string;
    details: {
      studentId?: number;
      teacherId?: number;
      fullName: string;
      dateOfBirth: string;
      gender: string;
      address: string;
      phone: string;
      // Other fields may exist but are not needed for this context
    }
  }>;
}

// Function to remove diacritics (accents) from Vietnamese characters
const removeDiacritics = (str: string): string => {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (match) => match === 'đ' ? 'd' : 'D');
};

// Function to format name as FirstNameLastNameInitials
const formatName = (fullName: string): string => {
  if (!fullName) return '';
  
  // Split the name into words
  const nameParts = fullName.trim().split(/\s+/);
  
  // If no name parts, return empty string
  if (nameParts.length === 0) return '';
  
  // Get first name (last word in Vietnamese names)
  const firstName = nameParts[nameParts.length - 1];
  
  // Get last name (all words except the last one)
  const lastName = nameParts.slice(0, nameParts.length - 1);
  
  // Create initials from last name
  const lastNameInitials = lastName.map(part => removeDiacritics(part.charAt(0))).join('');
  
  // Combine as FirstNameLastNameInitials (e.g., ThanhNTP)
  return removeDiacritics(firstName) + lastNameInitials;
};

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
  const [formattedName, setFormattedName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const role = useSelector((state: RootState) => state.authUser.role);
  
  // Fetch user details from API
  const fetchUserDetails = async (userId: string) => {
    try {
      // Check if we've recently fetched data to avoid unnecessary requests
      const cachedDataStr = localStorage.getItem('userCachedData');
      if (cachedDataStr) {
        const cachedData = JSON.parse(cachedDataStr);
        const now = new Date().getTime();
        // If data is fresh (less than 5 minutes old), skip API call
        if (now - cachedData.timestamp < 5 * 60 * 1000) {
          return;
        }
      }
      
      // Only set loading if we don't have cached data
      if (!formattedName) {
        setIsLoading(true);
      }
      
      const response = await axiosInstance.get<UserDetailsResponse>(`/users/details/${userId}`);
      
      if (response.data.success && response.data.data.length > 0) {
        const userData = response.data.data[0];
        const fullName = userData.details.fullName;
        const avatarUrl = userData.avatar;
        if(userData?.role === 'parent'){
          dispatch(fetchParentProfile(userId) as any);
        }
        // Set user data
        setUserFullName(fullName);
        
        // Format name as FirstNameLastNameInitials
        const formatted = formatName(fullName);
        setFormattedName(formatted);
        
        // Set avatar if available
        if (avatarUrl) {
          setUserAvatar(avatarUrl);
        }
        
        // Cache the data with timestamp
        const cacheData = {
          fullName,
          formattedName: formatted,
          avatar: avatarUrl,
          timestamp: new Date().getTime()
        };
        localStorage.setItem('userCachedData', JSON.stringify(cacheData));
        
        // Store formatted name in user object to avoid flicker on next load
        try {
          const userString = localStorage.getItem('user');
          if (userString) {
            const userData: UserData = JSON.parse(userString);
            userData.fullName = fullName;
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (error) {
          console.error("Error updating user data in localStorage:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get user info from localStorage - only run once on component mount
  useEffect(() => {
    try {
      // First try to get cached formatted data to prevent flicker
      const cachedDataStr = localStorage.getItem('userCachedData');
      const userString = localStorage.getItem('user');
      let userId = "";
      let shouldFetchFromAPI = true;
      
      if (userString) {
        const userData: UserData = JSON.parse(userString);
        userId = userData.userId;
        
        // Use available data immediately to prevent flicker
        if (userData.fullName) {
          setUserFullName(userData.fullName);
          const formatted = formatName(userData.fullName);
          setFormattedName(formatted);
        }
        
        if (userData.avatar) {
          setUserAvatar(userData.avatar);
        }
      }
      
      if (cachedDataStr) {
        const cachedData = JSON.parse(cachedDataStr);
        // Immediately set cached data to prevent flicker
        setUserFullName(cachedData.fullName || "");
        setFormattedName(cachedData.formattedName || "");
        if (cachedData.avatar) {
          setUserAvatar(cachedData.avatar);
        }
        
        const now = new Date().getTime();
        // If cached data is still fresh (less than 5 minutes old), delay API call
        if (now - cachedData.timestamp < 5 * 60 * 1000) {
          shouldFetchFromAPI = false;
          // Fetch latest data in the background after a short delay
          if (userId) {
            setTimeout(() => {
              fetchUserDetails(userId);
            }, 2000); // Delay API call to avoid visible UI changes
          }
        }
      } else if (userString) {
        // If no cached data but we have basic user info
        const userData: UserData = JSON.parse(userString);
        const fullName = userData.fullName || userData.name || userData.userId || "User";
        setUserFullName(fullName);
        
        // Generate a formatted name immediately if we have a fullName
        if (fullName && fullName !== "User") {
          const formatted = formatName(fullName);
          setFormattedName(formatted);
        }
        
        // Check if we have avatar stored somewhere
        const avatarUrl = userData.avatar;
        if (avatarUrl) {
          setUserAvatar(avatarUrl);
        }
      }
      
      // Fetch latest user details from API if we have a userId and should fetch
      if (userId && shouldFetchFromAPI) {
        fetchUserDetails(userId);
      }
    } catch (error) {
      console.error("Failed to get user info from localStorage:", error);
      setIsLoading(false);
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
    setFormattedName("");
    
    // Clear from Redux stores
    dispatch(handleLogout());
    dispatch(logout());
    
    // Clear any other related storage items
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    localStorage.removeItem('userAvatar');
    sessionStorage.removeItem('userAvatar');
    localStorage.removeItem('userCachedData');
    
    // Force reload after timeout to ensure clean state
    const reloadTimeout = setTimeout(() => {
      navigate("/login", {
        state: { message: "Đăng xuất thành công!" },
      });
      clearTimeout(reloadTimeout);
    }, 500);
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
        return navigate("/SystemManagement");
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
  
  const state = { navItems, userFullName, userAvatar, formattedName, role, isLoading };
  const handler = { handleOnNavigate };
  return { state, handler };
}

export default useNavBarHook;
