import { useEffect, useState } from "react";
import axios from "axios";

interface Parent {
  name: string;
  job: string;
  phone: string;
  email: string;
  gender: string;
}

interface ProfileData {
  username: string;
  fullName: string;
  dob: string;
  gender: string;
  classId?: string;
  batch?: string;
  address: string;
  phone: string;
  avatarUrl: string;
  role?: "admin" | "supervisor" | "teacher" | "student";
  skills?: string[];
  teachingClasses?: string[];
  parents?: Parent[];
  degree?: string; // ← Thêm dòng này
}


function useProfilePageHook() {
  const profileDefault: ProfileData = {
    username: "Ahihi123",
    fullName: "Nguyễn Văn A",
    dob: "2003-04-01",
    gender: "Male",
    address: "Chung cư xã hội An Phú Thịnh",
    phone: "0123456789",
    avatarUrl:
      "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg",
    role: "teacher",
  
    skills: ["AI", "Machine Learning", "Python"],
    teachingClasses: ["AI101", "CS102"],
    degree: "Master of Science in AI", // ← Thêm dòng này
  
    classId: "AI002",
    batch: "2025-2026",
    parents: [
      {
        name: "Nguyễn Văn B",
        gender: "Male",
        job: "Engineer",
        phone: "0987654321",
        email: "father@example.com",
      },
      {
        name: "Trần Thị C",
        gender: "Female",
        job: "Teacher",
        phone: "0123456789",
        email: "mother@example.com",
      },
    ],
  };

  const [profileData, setProfileData] = useState<ProfileData>(profileDefault);
  const [isEditing, setIsEditing] = useState(false);

  // const fetchProfile = async () => {
  //   try {
  //     const res = await axios.get("/api/profile");
  //     setProfileData(res.data);
  //   } catch (error) {
  //     console.error("Failed to fetch profile", error);
  //   }
  // };

  const toggleEdit = () => {
    setIsEditing(prev => !prev);
  };

  // useEffect(() => {
  //   fetchProfile();
  // }, []);

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
