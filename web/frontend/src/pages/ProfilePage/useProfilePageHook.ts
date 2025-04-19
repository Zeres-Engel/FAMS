import { useEffect, useState } from "react";
import axiosInstance from "../../services/axiosInstance";

// Interfaces for API response
interface ApiUserDetailsResponse {
  success: boolean;
  data: {
    user: {
      backup_email: string | null;
      avatar: string | null;
      _id: string;
      userId: string;
      email: string;
      role: string;
      createdAt: string;
      updatedAt: string;
      isActive: boolean;
      id: string;
    };
    role: {
      type: string;
      teacher?: {
        _id: string;
        teacherId: number;
        userId: string;
        fullName: string;
        email: string;
        dateOfBirth: string;
        gender: boolean;
        address: string;
        phone: string;
        major: string;
        degree: string;
        weeklyCapacity: number;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        id: string;
      };
      student?: {
        _id: string;
        studentId: number;
        userId: string;
        fullName: string;
        email: string;
        dateOfBirth: string;
        gender: boolean;
        address: string;
        phone: string;
        batchId: number;
        classId: number;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        id: string;
      };
      class?: {
        _id: string;
        classId: number;
        className: string;
        grade: number;
        academicYear: string;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        id: string;
      };
      parents?: {
        _id: string;
        parentId: number;
        userId: string;
        fullName: string;
        career: string;
        phone: string;
        gender: boolean;
        dateOfBirth?: string;
        address?: string;
        email?: string;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        id: string;
      }[];
      classes?: {
        classId: number;
        className: string;
        grade: string;
      }[];
      homeroomClasses?: any[];
      teachingClasses?: any[];
      rfid?: string | null;
    };
  };
}

// Interface for representing class info
interface ClassInfo {
  classId: number;
  className: string;
  grade: string;
}

// Interface for parent info
interface ParentInfo {
  parentId: number;
  fullName: string;
  career: string;
  phone: string;
  gender: boolean;
  dateOfBirth?: string;
  address?: string;
  email?: string;
  userId?: string;
}

interface ProfileData {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phone: string;
  role: string;
  major?: string;
  degree?: string;
  avatarUrl: string;
  classes?: string; // Text representation of classes
  classesList?: ClassInfo[]; // Array of class objects
  
  // Student specific fields
  batchId?: number;
  classId?: number;
  className?: string;
  academicYear?: string;
  grade?: number | string;
  
  // Parents information
  parents?: ParentInfo[];
  
  // Parent specific fields
  career?: string;
  weeklyCapacity?: number;
}

function useProfilePageHook() {
  // Default values while loading
  const profileDefault: ProfileData = {
    id: "",
    userId: "",
    fullName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    phone: "",
    role: "",
    avatarUrl: "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
  };

  const [profileData, setProfileData] = useState<ProfileData>(profileDefault);

  const [profileData, setProfileData] = useState<ProfileData>(profileDefault);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserIdFromLocalStorage = (): string => {
    try {
      // Always clear any cache first to ensure fresh data
      console.log("Getting fresh userId from localStorage");
      
      // Try to get userId from localStorage 'user' object
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          const userData = JSON.parse(userString);
          console.log("Found user in localStorage:", userData);
          if (userData.userId) return userData.userId;
        } catch (e) {
          console.error("Error parsing user JSON:", e);
        }
      }
      
      // If not found, try to extract from token as fallback
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        console.log("Found access token, but no user data");
      }
      
      console.log('No userId found in localStorage');
      return "";
    } catch (error) {
      console.error("Failed to get userId from localStorage:", error);
      return "";
    }
  };

  const fetchProfile = async (forceUserId?: string) => {
    try {
      setLoading(true);
      
      // Get userId from parameter, URL, or localStorage
      let userId = forceUserId;
      
      // If no userId provided in params, check URL
      if (!userId) {
        const urlParams = new URLSearchParams(window.location.search);
        userId = urlParams.get('userId') || '';
      }
      
      // If still no userId, get from localStorage
      if (!userId) {
        userId = getUserIdFromLocalStorage();
      }
      
      // Fallback to a default user if no userId found
      if (!userId) {
        userId = "dunglv121"; // Default user for testing
        console.warn("No userId found, using default:", userId);
      }
      
      console.log("Fetching profile for userId:", userId);
      const response = await axiosInstance.get<ApiUserDetailsResponse>(`/users/details/${userId}`);
      
      if (response.data.success) {
        const { user, role } = response.data.data;
        
        // Format data based on user role
        if (role.type === "teacher" && role.teacher) {
          // Format classes as a readable string
          const classesStr = role.classes && role.classes.length > 0 
            ? role.classes.map((c: ClassInfo) => `${c.className} (${c.grade})`).join(", ")
            : "No classes assigned";
          
          // Format phone number - add leading zero if it's a 9-digit number without leading zero
          let formattedPhone = role.teacher.phone;
          if (formattedPhone && formattedPhone.length === 9 && !formattedPhone.startsWith('0')) {
            formattedPhone = '0' + formattedPhone;
          }
            
          setProfileData({
            id: user.id,
            userId: user.userId,
            fullName: role.teacher.fullName,
            email: user.email,
            dateOfBirth: new Date(role.teacher.dateOfBirth).toLocaleDateString(),
            gender: role.teacher.gender ? "Male" : "Female",
            address: role.teacher.address,
            phone: formattedPhone,
            role: user.role,
            major: role.teacher.major,
            degree: role.teacher.degree,
            avatarUrl: user.avatar || "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
            classes: classesStr,
            classesList: role.classes || []
          });
        } else if (role.type === "student" && role.student) {
          // Handle student data
          let formattedPhone = role.student.phone || '';
          if (formattedPhone && formattedPhone.length === 9 && !formattedPhone.startsWith('0')) {
            formattedPhone = '0' + formattedPhone;
          }
          
          // Format parents' phone numbers
          const formattedParents = role.parents?.map((parent: {
            parentId: number;
            fullName: string;
            career: string;
            phone: string;
            gender: boolean;
            dateOfBirth?: string;
            address?: string;
            email?: string;
            userId?: string;
          }) => {
            let parentPhone = parent.phone || '';
            if (parentPhone.length === 9 && !parentPhone.startsWith('0')) {
              parentPhone = '0' + parentPhone;
            }
            
            return {
              parentId: parent.parentId,
              fullName: parent.fullName,
              career: parent.career,
              phone: parentPhone,
              gender: parent.gender,
              // Add optional fields if they exist
              dateOfBirth: parent.dateOfBirth ? new Date(parent.dateOfBirth).toLocaleDateString() : undefined,
              address: parent.address || undefined,
              email: parent.email || undefined,
              userId: parent.userId || undefined
            };
          });
          
          // Get class info
          const classInfo = role.class ? {
            className: role.class.className,
            grade: role.class.grade,
            academicYear: role.class.academicYear
          } : null;
          
          setProfileData({
            id: user.id,
            userId: user.userId,
            fullName: role.student.fullName,
            email: user.email,
            dateOfBirth: new Date(role.student.dateOfBirth).toLocaleDateString(),
            gender: role.student.gender ? "Male" : "Female",
            address: role.student.address,
            phone: formattedPhone,
            role: user.role,
            avatarUrl: user.avatar || "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
            
            // Student specific info
            batchId: role.student.batchId,
            classId: role.student.classId,
            className: classInfo?.className || "",
            grade: classInfo?.grade || "",
            academicYear: classInfo?.academicYear || "",
            
            // Parents info
            parents: formattedParents || []
          });
        } else {
          // Handle other roles or cases where teacher/student data is missing
          setProfileData({
            id: user.id,
            userId: user.userId,
            fullName: user.userId,
            email: user.email,
            dateOfBirth: "",
            gender: "",
            address: "",
            phone: "",
            role: user.role,
            avatarUrl: user.avatar || "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
          });
        }
      } else {
        throw new Error("Failed to fetch profile data");
      }
    } catch (error: any) {
      console.error("Failed to fetch profile", error);
      setError(error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing((prev: boolean) => !prev);
  };

  // Function to update user profile
  const updateProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Extract userId from profileData
      const { userId, role } = profileData;
      
      if (!userId) {
        throw new Error("User ID is missing");
      }
      
      // Prepare request body based on user role
      let requestBody: any = {};
      
      if (role === "teacher") {
        // Split fullName into firstName and lastName if needed
        let firstName = "", lastName = "";
        if (profileData.fullName) {
          const nameParts = profileData.fullName.split(" ");
          if (nameParts.length > 1) {
            lastName = nameParts.pop() || "";
            firstName = nameParts.join(" ");
          } else {
            firstName = profileData.fullName;
          }
        }
        
        requestBody = {
          firstName,
          lastName,
          fullName: profileData.fullName,
          phone: profileData.phone?.replace(/^0/, ""), // Remove leading zero if present
          email: profileData.email,
          address: profileData.address,
          dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : undefined,
          gender: profileData.gender === "Male",
          major: profileData.major,
          degree: profileData.degree
        };
      } else if (role === "student") {
        // Split fullName into firstName and lastName
        let firstName = "", lastName = "";
        if (profileData.fullName) {
          const nameParts = profileData.fullName.split(" ");
          if (nameParts.length > 1) {
            lastName = nameParts.pop() || "";
            firstName = nameParts.join(" ");
          } else {
            firstName = profileData.fullName;
          }
        }
        
        requestBody = {
          firstName,
          lastName,
          email: profileData.email,
          phone: profileData.phone?.replace(/^0/, ""), // Remove leading zero if present
          address: profileData.address,
          dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : undefined,
          gender: profileData.gender === "Male",
          classId: profileData.classId
        };
      } else if (role === "parent") {
        requestBody = {
          fullName: profileData.fullName,
          phone: profileData.phone?.replace(/^0/, ""), // Remove leading zero if present
          career: profileData.career,
          gender: profileData.gender === "Male",
          // Add optional fields if they exist
          email: profileData.email,
          address: profileData.address,
          dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : undefined
        };
      }
      
      // Remove undefined fields from request body
      Object.keys(requestBody).forEach(key => 
        requestBody[key] === undefined && delete requestBody[key]
      );
      
      // Send update request
      const response = await axiosInstance.put(`/users/update/${userId}`, requestBody);
      
      if (response.data.success) {
        // Refresh profile data after update
        await fetchProfile(userId);
        setIsEditing(false);
      } else {
        throw new Error(response.data.message || "Update failed");
      }
    } catch (error: any) {
      console.error("Failed to update profile", error);
      setError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    
    // Also add a listener to handle navigation changes
    const handleLocationChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newUserId = urlParams.get('userId');
      if (newUserId) {
        fetchProfile(newUserId);
      }
    };
    
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return {
    state: {
      profileData,
      isEditing,
      loading,
      error
    },
    handler: {
      toggleEdit,
      setProfileData,
      fetchProfile,
      updateProfile
    },
  };
}

export default useProfilePageHook;
