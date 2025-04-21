import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { addNotify } from "../../store/slices/notifySlice";
import { HeadCell, RFIDData, RFIDHeadCell } from "../../model/tableModels/tableDataModels.model";

// Giả lập API call
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
  const sampleRFIDData: RFIDData[] = [
    {
      id: "1",
      userid: "stu_001",
      rfid: "1234567890",
      expTime: "2025-12-31T23:59:59Z",
      faceAttendance: "enabled",
      role: "student",
    },
    {
      id: "2",
      userid: "tea_001",
      rfid: "0987654321",
      expTime: "2026-06-30T23:59:59Z",
      faceAttendance: "enabled",
      role: "teacher",
    },
    {
      id: "3",
      userid: "stu_002",
      rfid: "1122334455",
      expTime: "2025-09-01T00:00:00Z",
      faceAttendance: "disabled",
      role: "student",
    },
    {
      id: "4",
      userid: "tea_002",
      rfid: "6677889900",
      expTime: "2026-01-15T12:00:00Z",
      faceAttendance: "enabled",
      role: "teacher",
    },
    {
      id: "5",
      userid: "admin_001",
      rfid: "5555555555",
      expTime: "2027-01-01T00:00:00Z",
      faceAttendance: "enabled",
      role: "admin",
    },
  ];
  
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
    const [userMainData, setUserMainData] = useState<RFIDData[]>(sampleRFIDData);
    const headCellsData: RFIDHeadCell[] = [
      {
        id: "id",
        numeric: false,
        disablePadding: true,
        label: "ID",
      },
      {
        id: "userid",
        numeric: false,
        disablePadding: true,
        label: "User Id",
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
      tableTitle
    },
    handler: {
      handleRoleChange,
      handleUserChange,
      handleRFIDChange,
      handleSearchInputChange,
      handleDeviceChange,
      handleFileChange,
      handleSendToDevice,
    },
    rfidInputRef,
  };
}

export default useIdentifyManagementHook;
