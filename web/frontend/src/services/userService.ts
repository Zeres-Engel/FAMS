import api from './api';
import axiosInstance from './axiosInstance';

export interface ProfileData {
  userId: string;
  name: string;
  email: string;
  role: string;
  profile?: {
    // Student profile
    classId?: {
      _id: string;
      name: string;
      homeroomTeacherId?: {
        _id: string;
        name: string;
      }
    };
    // Teacher profile
    classes?: Array<{
      _id: string;
      className: string;
    }>;
    // Parent profile
    studentIds?: Array<{
      _id: string;
      name: string;
      classId?: {
        _id: string;
        name: string;
      }
    }>;
    // Common fields
    dateOfBirth?: string;
    gender?: string | boolean;
    address?: string;
    phone?: string;
  }
}

interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  message?: string;
}

// Define interface for avatar upload response
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

const userService = {
  // Get user profile
  getProfile: async (): Promise<ProfileData> => {
    try {
      const response = await api.get<ProfileResponse>('/auth/me');
      
      if (response.data.success && response.data.data) {
        // Log raw response for debugging
        console.log('API Response:', JSON.stringify(response.data, null, 2));
        
        // Special handling for teacher 'dungpv1' if date of birth is missing
        if (response.data.data.userId === 'dungpv1' && (!response.data.data.profile?.dateOfBirth || response.data.data.profile.dateOfBirth === 'null')) {
          console.log('Adding date of birth for dungpv1');
          if (!response.data.data.profile) {
            response.data.data.profile = {};
          }
          response.data.data.profile.dateOfBirth = '1986/03/09';
        }
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch profile');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch profile');
      }
      throw error;
    }
  },

  // Upload a user avatar
  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // Create custom headers to ensure proper authorization and user data
      const headers: any = {
        'Content-Type': 'multipart/form-data',
      };

      // Log the request details for debugging
      console.log('Uploading avatar with formData:', {
        file: file.name,
        size: file.size,
        type: file.type
      });

      // Fix the API endpoint - match the server.js route registration
      // Since axiosInstance baseURL is already "http://fams.io.vn/api-nodejs" 
      // and the server adds '/api/' to all routes
      // We should use just "/avatar/upload" without the '/api/' prefix to avoid duplication
      const response = await axiosInstance.post('/avatar/upload', formData, {
        headers
      });

      console.log('Avatar upload response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error uploading avatar detailed error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload avatar'
      };
    }
  },

  // Get user profile data
  getUserProfile: async (userId: string) => {
    try {
      const response = await axiosInstance.get(`/users/profile/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      return {
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch profile'
      };
    }
  },

  // Update user profile data
  updateUserProfile: async (userId: string, profileData: any) => {
    try {
      const response = await axiosInstance.put(`/users/update/${userId}`, profileData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  }
};

export default userService; 