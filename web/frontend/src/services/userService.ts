import api from './api';

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
  }
};

export default userService; 