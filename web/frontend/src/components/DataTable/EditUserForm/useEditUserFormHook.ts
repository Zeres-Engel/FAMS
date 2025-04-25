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

  // Function to fetch class suggestions
  const fetchClassSuggestions = async (searchQuery = "", grade = selectedGrade) => {
    if (grade === "") {
      setClassOptions([]);
      return;
    }

    setLoading(true);
    try {
      // Include grade in the search query when available
      const response = await axiosInstance.get(
        `/classes?grade=${grade || ""}&search=${searchQuery}&homeroomTeacherd=&academicYear=${currentAcademicYear}`
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

  // Fetch class suggestions when search term changes
  useEffect(() => {
    fetchClassSuggestions(debouncedSearchTerm);
  }, [debouncedSearchTerm, selectedGrade, currentAcademicYear]);

  // Initialize class search when grade is selected (used when form opens)
  const initializeClassSearch = (grade: string) => {
    if (grade) {
      setSelectedGrade(grade);
      // Fetch classes for this grade with empty search term to get all classes
      fetchClassSuggestions("", grade);
    }
  };

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
        // Extract classIds for the API request - đảm bảo không có giá trị null/undefined
        userData.classIds = userData.classId
          .filter((cls: any) => cls && (typeof cls === 'object' ? cls.classId : cls))
          .map((cls: any) => 
            typeof cls === 'object' && cls.classId ? Number(cls.classId) : Number(cls)
          );
        
        // Log để debug
        console.log("Processed classIds for API:", userData.classIds);
      }
      
      console.log("Sending update request:", userData);
      const response = await axiosInstance.put(`/users/update/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  // Hàm làm sạch dữ liệu học sinh
  const cleanStudentData = async (userId: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/users/clean-student/${userId}`);
      console.log("Clean student data response:", response.data);
      return {
        success: true,
        message: "Data cleaned successfully",
        details: response.data
      };
    } catch (error) {
      console.error("Error cleaning student data:", error);
      return {
        success: false,
        message: "Failed to clean student data"
      };
    } finally {
      setLoading(false);
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
      uploadAvatar,
      initializeClassSearch,
      fetchClassSuggestions,
      cleanStudentData
    },
  };
}

export default useEditUserFormHook;
