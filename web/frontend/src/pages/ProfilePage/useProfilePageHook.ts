import { useEffect, useState } from "react";
import axiosInstance from "../../services/axiosInstance";
import userService from "../../services/userService";

// Interfaces for API response
interface ApiUserDetailsResponse {
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
      children?:any;
      studentId?: number;
      teacherId?: number;
      parentId?: number;
      fullName: string;
      dateOfBirth: string;
      gender: string;
      address: string;
      phone: string;
      batchId?: number;
      academicYear?: string;
      classes?: Array<{
        classId: number;
        className: string;
        grade: number;
        academicYear: string;
        isHomeroom?: boolean;
      }>;
      parents?: Array<{
        parentId: number;
        fullName: string;
        phone: string;
        gender: string;
        career: string;
        email: string;
        backup_email: string | null;
        relationship: string;
      }>;
      major?: string;
      degree?: string;
      weeklyCapacity?: number;
    };
  }>;
  count: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Interface for representing class info
interface ClassInfo {
  classId: number;
  className: string;
  grade: number | string;
  academicYear?: string;
  isHomeroom?: boolean;
}

// Interface for parent info
interface ParentInfo {
  parentId: number;
  fullName: string;
  career: string;
  phone: string;
  gender: boolean | string;
  dateOfBirth?: string;
  address?: string;
  email?: string;
  userId?: string;
  relationship?: string;
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
  classesByYear?: Record<string, ClassInfo[]>;
}

// Import or re-define the AvatarUploadResponse interface
interface AvatarUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    userId: string;
    avatar: string;
    avatarUrl: string;
  };
  code?: string;
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
    avatarUrl:
      "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
  };

  const [profileData, setProfileData] = useState<ProfileData>(profileDefault);
  const [fakeProfileData, setFakeProfileData] = useState<any>(profileDefault);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserIdFromLocalStorage = (): string => {
    try {
      // Always clear any cache first to ensure fresh data
      console.log("Getting fresh userId from localStorage");

      // Try to get userId from localStorage 'user' object
      const userString = localStorage.getItem("user");
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
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        console.log("Found access token, but no user data");
      }

      console.log("No userId found in localStorage");
      return "";
    } catch (error) {
      console.error("Failed to get userId from localStorage:", error);
      return "";
    }
  };

  const fetchProfile = async (forceUserId?: string) => {
    try {
      setLoading(true);
      // const fakeParentData = {
      //   id: "quanttpr1",
      //   userId: "quanttpr1",
      //   fullName: "Trần Thị Quân",
      //   email: "tranthiquan343@gmail.com",
      //   dateOfBirth: "1980-01-01",
      //   gender: "Female",
      //   address: "123 Đường ABC, Quận 1, TP.HCM",
      //   phone: "0123456789",
      //   role: "parent",
      //   avatarUrl:
      //     "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
      //   students: [
      //     {
      //       studentId: "hungdnst2",
      //       fullName: "Đặng Ngọc Hưng",
      //       classHistory: [
      //         { className: "12A1", grade: 12, academicYear: "2024-2025" },
      //         { className: "11A1", grade: 11, academicYear: "2023-2024" },
      //         { className: "10A1", grade: 10, academicYear: "2022-2023" },
      //       ],
      //       email: "hungdnstudent2@fams.edu.vn",
      //       phone: "0935694245",
      //       dateOfBirth: "1/28/2007",
      //     },
      //     {
      //       studentId: "thanhnpst1",
      //       fullName: "Nguyễn Phước Thành",
      //       classHistory: [
      //         { className: "12A1", grade: 12, academicYear: "2024-2025" },
      //         { className: "11A1", grade: 11, academicYear: "2023-2024" },
      //         { className: "10A1", grade: 10, academicYear: "2022-2023" },
      //       ],
      //       email: "thanhnpstudent1@fams.edu.vn",
      //       phone: "0908812966",
      //       dateOfBirth: "11/1/2007",
      //     },
      //   ],
      // };
      // Get userId from parameter, URL, or localStorage
      let userId = forceUserId;

      // If no userId provided in params, check URL
      if (!userId) {
        const urlParams = new URLSearchParams(window.location.search);
        userId = urlParams.get("userId") || "";
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
      const response = await axiosInstance.get<ApiUserDetailsResponse>(
        `/users/details/${userId}`
      );

      if (
        response.data.success &&
        response.data.data &&
        response.data.data.length > 0
      ) {
        const userData = response.data.data[0];
        const userDetails = userData.details;

        // Format data based on user role
        if (userData.role === "teacher") {
          // Group classes by academic year
          const classesByYear: Record<string, ClassInfo[]> = {};

          if (userDetails.classes && userDetails.classes.length > 0) {
            userDetails.classes.forEach(
              (c: {
                classId: number;
                className: string;
                grade: number | string;
                academicYear: string;
                isHomeroom?: boolean;
              }) => {
                if (!classesByYear[c.academicYear]) {
                  classesByYear[c.academicYear] = [];
                }
                classesByYear[c.academicYear].push({
                  classId: c.classId,
                  className: c.className,
                  grade: c.grade,
                  academicYear: c.academicYear,
                  isHomeroom: c.isHomeroom || false,
                });
              }
            );
          }

          // Get the most recent academic year
          const sortedYears = Object.keys(classesByYear).sort((a, b) =>
            b.localeCompare(a)
          );
          const mostRecentYear =
            sortedYears.length > 0 ? sortedYears[0] : "2024-2025";

          // Format classes as a readable string
          const classesStr =
            userDetails.classes && userDetails.classes.length > 0
              ? userDetails.classes
                  .map(
                    (c: { className: string; grade: number | string }) =>
                      `${c.className} (${c.grade})`
                  )
                  .join(", ")
              : "No classes assigned";

          // Format phone number - add leading zero if it's a 9-digit number without leading zero
          let formattedPhone = userDetails.phone;
          if (
            formattedPhone &&
            formattedPhone.length === 9 &&
            !formattedPhone.startsWith("0")
          ) {
            formattedPhone = "0" + formattedPhone;
          }

          setProfileData({
            id: userData.id,
            userId: userData.userId,
            fullName: userDetails.fullName,
            email: userData.email,
            dateOfBirth: new Date(userDetails.dateOfBirth).toLocaleDateString(),
            gender: userDetails.gender,
            address: userDetails.address,
            phone: formattedPhone,
            role: userData.role,
            major: userDetails.major,
            degree: userDetails.degree,
            weeklyCapacity: userDetails.weeklyCapacity,
            academicYear: mostRecentYear,
            avatarUrl:
              userData.avatar ||
              "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
            classes: classesStr,
            classesByYear,
            classesList:
              userDetails.classes?.map(
                (c: {
                  classId: number;
                  className: string;
                  grade: number | string;
                  academicYear: string;
                  isHomeroom?: boolean;
                }) => ({
                  classId: c.classId,
                  className: c.className,
                  grade: c.grade,
                  academicYear: c.academicYear,
                  isHomeroom: c.isHomeroom || false,
                })
              ) || [],
          });
        } else if (userData.role === "student") {
          // Handle student data
          let formattedPhone = userDetails.phone || "";
          if (
            formattedPhone &&
            formattedPhone.length === 9 &&
            !formattedPhone.startsWith("0")
          ) {
            formattedPhone = "0" + formattedPhone;
          }

          // Format parents' phone numbers
          const formattedParents = userDetails.parents?.map(
            (parent: {
              parentId: number;
              fullName: string;
              career: string;
              phone: string;
              gender: string;
              email: string;
              backup_email: string | null;
              relationship: string;
            }) => {
              let parentPhone = parent.phone || "";
              if (
                parentPhone &&
                parentPhone.length === 9 &&
                !parentPhone.startsWith("0")
              ) {
                parentPhone = "0" + parentPhone;
              }

              return {
                parentId: parent.parentId,
                fullName: parent.fullName,
                career: parent.career,
                phone: parentPhone,
                gender: parent.gender === "Male",
                email: parent.email || undefined,
              };
            }
          );

          // Get current class info (assuming the last class in the array is the current one)
          const currentClass =
            userDetails.classes && userDetails.classes.length > 0
              ? userDetails.classes[userDetails.classes.length - 1]
              : null;

          setProfileData({
            id: userData.id,
            userId: userData.userId,
            fullName: userDetails.fullName,
            email: userData.email,
            dateOfBirth: new Date(userDetails.dateOfBirth).toLocaleDateString(),
            gender: userDetails.gender,
            address: userDetails.address,
            phone: formattedPhone,
            role: userData.role,
            avatarUrl:
              userData.avatar ||
              "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",

            // Student specific info
            batchId: userDetails.batchId,
            classId: currentClass?.classId,
            className: currentClass?.className || "",
            grade: currentClass?.grade || "",
            academicYear: currentClass?.academicYear || "",

            // Class history for students
            classesList:
              userDetails.classes?.map(
                (c: {
                  classId: number;
                  className: string;
                  grade: number | string;
                  academicYear: string;
                }) => ({
                  classId: c.classId,
                  className: c.className,
                  grade: c.grade,
                  academicYear: c.academicYear,
                })
              ) || [],

            // Parents info with relationship
            parents:
              formattedParents?.map((parent: ParentInfo) => ({
                ...parent,
                relationship:
                  userDetails.parents?.find(
                    (p: { parentId: number; relationship: string }) =>
                      p.parentId === parent.parentId
                  )?.relationship || undefined,
              })) || [],
          });
        } else {
          // Handle other roles or cases where teacher/student data is missing
          setProfileData({
            id: userData.id,
            userId: userData.userId,
            fullName: userDetails.fullName || userData.userId,
            email: userData.email,
            dateOfBirth: userDetails.dateOfBirth
              ? new Date(userDetails.dateOfBirth).toLocaleDateString()
              : "",
            gender: userDetails.gender || "",
            address: userDetails.address || "",
            phone: userDetails.phone || "",
            role: userData.role,
            avatarUrl:
              userData.avatar ||
              "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
          });
        }
        if (userData.role === "parent") {
          setProfileData({
            id: userData.id,
            userId: userData.userId,
            fullName: userDetails.fullName || userData.userId,
            email: userData.email,
            dateOfBirth: userDetails.dateOfBirth
              ? new Date(userDetails.dateOfBirth).toLocaleDateString()
              : "",
            gender: userDetails.gender || "",
            address: userDetails.address || "",
            phone: userDetails.phone || "",
            role: userData.role,
            avatarUrl:
              userData.avatar ||
              "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
          });
          console.log(response.data.data[0].details.children);
          
          setFakeProfileData(response.data.data[0].details.children);
          setLoading(false);
          return;
        }
      } else {
        setError("No profile data found");
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch profile data"
      );
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
        let firstName = "",
          lastName = "";
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
          dateOfBirth: profileData.dateOfBirth
            ? new Date(profileData.dateOfBirth).toISOString().split("T")[0]
            : undefined,
          gender: profileData.gender === "Male",
          major: profileData.major,
          degree: profileData.degree,
        };
      } else if (role === "student") {
        // Split fullName into firstName and lastName
        let firstName = "",
          lastName = "";
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
          dateOfBirth: profileData.dateOfBirth
            ? new Date(profileData.dateOfBirth).toISOString().split("T")[0]
            : undefined,
          gender: profileData.gender === "Male",
          classId: profileData.classId,
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
          dateOfBirth: profileData.dateOfBirth
            ? new Date(profileData.dateOfBirth).toISOString().split("T")[0]
            : undefined,
        };
      }

      // Remove undefined fields from request body
      Object.keys(requestBody).forEach(
        key => requestBody[key] === undefined && delete requestBody[key]
      );

      // Send update request
      const response = await axiosInstance.put(
        `/users/update/${userId}`,
        requestBody
      );

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

  // Add avatar upload functionality
  const uploadAvatar = async (file: File): Promise<AvatarUploadResponse> => {
    try {
      setLoading(true);
      setError(null);

      const { userId } = profileData;

      if (!userId) {
        throw new Error("User ID is missing");
      }

      console.log("Uploading avatar for user:", userId);

      // Use userService to upload avatar
      const response = await userService.uploadAvatar(file);
      console.log("Upload response:", response);

      if (response.success) {
        // Update the profile data with new avatar URL
        const avatarUrl = response.data?.avatarUrl;

        if (!avatarUrl) {
          console.warn("Avatar URL not found in response:", response);
        }

        // Update profile data with new avatar URL
        setProfileData({
          ...profileData,
          avatarUrl: avatarUrl || profileData.avatarUrl, // Keep existing URL if new one not available
        });

        // Ensure response has a message
        if (!response.message) {
          response.message = "Avatar uploaded successfully";
        }

        return response;
      } else {
        console.error("Avatar upload failed:", response.message);

        // Create a new response with a guaranteed message
        const errorResponse: AvatarUploadResponse = {
          success: false,
          message: response.message || "Avatar upload failed",
        };
        throw new Error(errorResponse.message);
      }
    } catch (error: any) {
      console.error("Failed to upload avatar", error);
      setError(error.message || "Failed to upload avatar");
      return {
        success: false,
        message: error.message || "Failed to upload avatar",
      };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Also add a listener to handle navigation changes
    const handleLocationChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newUserId = urlParams.get("userId");
      if (newUserId) {
        fetchProfile(newUserId);
      }
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  return {
    state: {
      profileData,
      isEditing,
      loading,
      error,
      fakeProfileData,
    },
    handler: {
      toggleEdit,
      setProfileData,
      fetchProfile,
      updateProfile,
      uploadAvatar,
    },
  };
}

export default useProfilePageHook;
