import { useState, useEffect } from 'react';
import userService, { ProfileData } from '../../services/userService';

function useProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await userService.getProfile();
        
        // Debug log to see the raw data
        console.log('Raw profile data:', data);
        console.log('Date of birth:', data.profile?.dateOfBirth);
        console.log('Date of birth type:', data.profile?.dateOfBirth ? typeof data.profile.dateOfBirth : 'undefined');
        
        setProfileData(data);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  return {
    profileData,
    isLoading,
    error
  };
}

export default useProfilePage; 