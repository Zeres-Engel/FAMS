import { useEffect, useState } from "react";
import { AddUserForm, EditUserForm, ClassID } from "../../../model/tableModels/tableDataModels.model";
import { RootState } from "../../../store/store";
import { useSelector } from "react-redux";
import { UserData } from "../../../model/userModels/userDataModels.model";
import axiosInstance from "../../../services/axiosInstance";

interface ClassOption {
  _id: string;
  className: string;
  grade: number;
  academicYear: string;
  homeroomTeacherId: string;
  classId: number;
}

function useEditUserFormHook() {
  // State for class search and suggestions
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>("10");
  
  // Grade options
  const gradeOptions = [10, 11, 12];
  
  // Current academic year (fixed)
  const currentAcademicYear = "2024-2025";

  // Simple debounce implementation
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Fetch class suggestions when search term changes
  useEffect(() => {
    const fetchClassSuggestions = async () => {
      if (debouncedSearchTerm === "" && !selectedGrade) {
        setClassOptions([]);
        return;
      }

      setLoading(true);
      try {
        // Include grade in the search query when available
        const response = await axiosInstance.get(
          `/classes?grade=${selectedGrade || ""}&search=${debouncedSearchTerm}&homeroomTeacherd=&academicYear=${currentAcademicYear}`
        );
        
        console.log("Class search results:", response.data);
        
        // Use all classes from response (up to a reasonable limit)
        const suggestedClasses = response.data.data.slice(0, 10);
        setClassOptions(suggestedClasses);
      } catch (error) {
        console.error("Error fetching class suggestions:", error);
        setClassOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClassSuggestions();
  }, [debouncedSearchTerm, selectedGrade, currentAcademicYear]);

  // Delete avatar function
  const deleteAvatar = async (userId: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.delete(`/avatar/${userId}`);
      console.log("Avatar deletion response:", response.data);
      return {
        success: true,
        message: "Avatar deleted successfully"
      };
    } catch (error) {
      console.error("Error deleting avatar:", error);
      return {
        success: false,
        message: "Failed to delete avatar"
      };
    } finally {
      setLoading(false);
    }
  };

  // Upload avatar function
  const uploadAvatar = async (userId: string, file: File) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await axiosInstance.post(`/avatar/admin/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log("Avatar upload response:", response.data);
      return {
        success: true,
        message: "Avatar uploaded successfully",
        avatarUrl: response.data.data?.avatarUrl || null
      };
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return {
        success: false,
        message: "Failed to upload avatar"
      };
    } finally {
      setLoading(false);
    }
  };

  // Update user function
  const updateUser = async (userId: string, userData: any) => {
    try {
      // Format class IDs for API if needed
      if (userData.classId && Array.isArray(userData.classId)) {
        // Extract classIds for the API request
        userData.classIds = userData.classId.map((cls: any) => 
          typeof cls === 'object' && cls.classId ? Number(cls.classId) : Number(cls)
        );
      }
      
      console.log("Sending update request:", userData);
      const response = await axiosInstance.put(`/users/update/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  return {
    state: {
      classOptions,
      loading,
      gradeOptions,
      currentAcademicYear,
      selectedGrade
    },
    handler: {
      setSearchTerm,
      updateUser,
      setSelectedGrade,
      deleteAvatar,
      uploadAvatar
    },
  };
}

export default useEditUserFormHook;
