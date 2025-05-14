import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { addNotify } from "../../store/slices/notifySlice";
import { HeadCell, RFIDData, RFIDHeadCell } from "../../model/tableModels/tableDataModels.model";
import axios from "axios";

// API call thực tế cho RFID
const fetchRFIDData = async (): Promise<RFIDData[]> => {
  try {
    // Không cần gửi token authentication
    const response = await axios.get("/api-nodejs/rfid/users");

    if (response.data.success) {
      // Chuyển đổi dữ liệu API sang định dạng RFIDData
      return response.data.data.map((item: any) => ({
        id: item._id || item.id || "",
        userid: item.userID || "",
        rfid: item.rfid || "",
        expTime: item.expireTime || "",
        faceAttendance: item.faceAttendance || "disabled", // Default value
        role: item.role || "unknown",
      }));
    } else {
      console.error("Failed to fetch RFID data:", response.data.message);
      return [];
    }
  } catch (error) {
    console.error("Error fetching RFID data:", error);
    return [];
  }
};

// Giả lập API call cho user search (có thể thay bằng API thật sau này)
const fetchUsers = (
  role: "teacher" | "student",
  keyword: string
): Promise<any[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const all = {
        teacher: [
          { id: "t1", userName: "Mr. John", phone: "0123456789" },
          { id: "t2", userName: "Ms. Alice", phone: "0987654321" },
        ],
        student: [
          { id: "s1", userName: "Student A", phone: "0112233445" },
          { id: "s2", userName: "Student B", phone: "0667788990" },
        ],
      };

      const filtered = all[role].filter(user =>
        user.userName.toLowerCase().includes(keyword.toLowerCase())
      );

      resolve(filtered);
    }, 500); // simulate API delay
  });
};

function useIdentifyManagementHook() {
  const dispatch = useDispatch<AppDispatch>();
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [users, setUsers] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rfid, setRfid] = useState("");
  const [isVideoValid, setIsVideoValid] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [fileToSend, setFileToSend] = useState<File | null>(null);
  const [initUserFile, setInitUserFile] = useState<File | null>(null);
  const batchYears = Array.from({ length: 5 }, (_, i) => {
    const startYear = 2022 + i;
    return `${startYear} - ${startYear + 3}`;
  });
  
  const [userMainData, setUserMainData] = useState<RFIDData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const headCellsData: RFIDHeadCell[] = [
    {
      id: "userid",
      numeric: false,
      disablePadding: true,
      label: "User Id",
    },
    {
      id: "role",
      numeric: false,
      disablePadding: false,
      label: "Role",
    },
    {
      id: "rfid",
      numeric: false,
      disablePadding: false,
      label: "RFID",
    },
    {
      id: "expTime",
      numeric: false,
      disablePadding: false,
      label: "Expired Time",
    },
    {
      id: "faceAttendance",
      numeric: false,
      disablePadding: false,
      label: "Face Attendance",
    }
  ];
  const isCheckBox = false;
  const tableTitle = "RFID Data";

  // Fetch RFID data from API when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchRFIDData();
        setUserMainData(data);
        setError(null);
      } catch (err) {
        console.error("Error in fetchRFIDData:", err);
        setError("Failed to load RFID data");
        dispatch(
          addNotify({
            type: "error",
            message: "Failed to load RFID data",
            duration: 3000,
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  const handleDeviceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDevice(event.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToSend(file);
    }
  };

  const handleSendToDevice = async () => {
    if (!selectedDevice || !fileToSend) return;

    const formData = new FormData();
    formData.append("deviceType", selectedDevice);
    formData.append("file", fileToSend);

    try {
      const res = await fetch("/api/send-to-device", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        dispatch(
          addNotify({
            type: "success",
            message: "File sent successfully!",
            duration: 3000,
          })
        );
      } else {
        dispatch(
          addNotify({
            type: "error",
            message: "Failed to send file.",
            duration: 3000,
          })
        );
      }
    } catch (err) {
      console.error(err);
      dispatch(
        addNotify({
          type: "error",
          message: "Error sending file.",
          duration: 3000,
        })
      );
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(role, searchKeyword).then(setUsers);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [role, searchKeyword]);

  const handleUserChange = (user: any) => {
    setSelectedUser(user);
    setTimeout(() => {
      rfidInputRef.current?.focus();
    }, 100);
  };

  const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRole(event.target.value as "teacher" | "student");
    setSelectedUser(null);
    setRfid("");
    setIsVideoValid(null);
    setSearchKeyword("");
  };

  const handleRFIDChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRfid(event.target.value);
  };

  const handleSearchInputChange = (_: any, value: string) => {
    setSearchKeyword(value);
  };

  // Refresh RFID data
  const refreshRFIDData = async () => {
    setLoading(true);
    try {
      const data = await fetchRFIDData();
      setUserMainData(data);
      setError(null);
      dispatch(
        addNotify({
          type: "success",
          message: "RFID data refreshed successfully",
          duration: 3000,
        })
      );
    } catch (err) {
      console.error("Error refreshing RFID data:", err);
      setError("Failed to refresh RFID data");
      dispatch(
        addNotify({
          type: "error",
          message: "Failed to refresh RFID data",
          duration: 3000,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    state: {
      role,
      users,
      selectedUser,
      rfid,
      isVideoValid,
      videoRef,
      selectedDevice,
      fileToSend,
      initUserFile,
      batchYears,
      headCellsData,
      userMainData,
      tableTitle,
      loading,
      error
    },
    handler: {
      handleRoleChange,
      handleUserChange,
      handleRFIDChange,
      handleSearchInputChange,
      handleDeviceChange,
      handleFileChange,
      handleSendToDevice,
      refreshRFIDData
    },
    rfidInputRef,
  };
}

export default useIdentifyManagementHook;
