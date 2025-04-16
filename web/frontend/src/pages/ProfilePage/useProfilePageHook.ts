import { useEffect, useState } from "react";
import axios from "axios";

interface ProfileData {
  id: string;
  username: string;
  fullName: string;
  dob: string;
  gender: string;
  classId: string;
  address: string;
  phone: string;
  batch: string;
  avatarUrl: string;
}

function useProfilePageHook() {
  const profileDefault: ProfileData = {
    id: "A001",
    username: "Ahihi123",
    fullName: "Nguyễn Văn A",
    dob: "2003-04-01",
    gender: "Male",
    classId: "AI002",
    batch: "2025-2026",
    address: "Chung cư xã hội An Phú Thịnh",
    phone: "0123456789",
    avatarUrl:
      "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
  };
  const [profileData, setProfileData] = useState<ProfileData>(
    profileDefault
  );
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("/api/profile"); // Đổi lại endpoint nếu cần
      setProfileData(res.data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const toggleEdit = () => {
    setIsEditing(prev => !prev);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    state: {
      profileData,
      isEditing,
    },
    handler: {
      toggleEdit,
      setProfileData,
    },
  };
}

export default useProfilePageHook;
