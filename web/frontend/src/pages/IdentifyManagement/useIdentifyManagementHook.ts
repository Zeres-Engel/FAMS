import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { addNotify } from "../../store/slices/notifySlice";

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

  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [users, setUsers] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rfid, setRfid] = useState("");
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isVideoValid, setIsVideoValid] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const [videoMessage, setVideoMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [fileToSend, setFileToSend] = useState<File | null>(null);
  const [initUserFile, setInitUserFile] = useState<File | null>(null);
  const [selectedBatchYear, setSelectedBatchYear] = useState("");
  const batchYears = Array.from({ length: 5 }, (_, i) => {
    const startYear = 2022 + i;
    return `${startYear} - ${startYear + 3}`;
  });

  const handleBatchYearChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedBatchYear(event.target.value);
  };

  const handleInitFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setInitUserFile(file);
    }
  };

  const handleInitUserSubmit = async () => {
    if (!initUserFile || !selectedBatchYear) return;

    const formData = new FormData();
    formData.append("file", initUserFile);
    formData.append("batchYear", selectedBatchYear);

    try {
      const res = await fetch("/api/init-users", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        dispatch(
          addNotify({
            type: "success",
            message: "User data initialized successfully!",
            duration: 3000,
          })
        );
        setInitUserFile(null);
        setSelectedBatchYear("");
      } else {
        dispatch(
          addNotify({
            type: "error",
            message: "Failed to initialize user data.",
            duration: 3000,
          })
        );
      }
    } catch (err) {
      console.error(err);
      dispatch(
        addNotify({
          type: "error",
          message: "Error initializing user data.",
          duration: 3000,
        })
      );
    }
  };

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

  const fakeVerifyVideo = (blob: Blob): Promise<boolean> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const result = Math.random() > 0.3;
        resolve(result);
      }, 1500);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      setIsRecording(true);

      mediaRecorder.ondataavailable = e => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        const videoBlob = new Blob(chunks, { type: "video/webm" });
        setVideoMessage("🎉 Video quay xong. Đang kiểm tra...");

        const isValid = await fakeVerifyVideo(videoBlob);
        setVideoMessage(
          isValid
            ? "✅ Video hợp lệ!"
            : "❌ Video không hợp lệ, vui lòng quay lại."
        );
        setIsVideoValid(isValid);
      };

      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
      }, 10000);
    } catch (err) {
      console.error("Error accessing camera", err);
      setIsVideoLoading(false);
      setIsVideoValid(false);
    }
  };

  const startCountdownAndRecord = async () => {
    setVideoMessage(null);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          setCountdown(null);
          setVideoMessage("🎥 Bắt đầu quay!");
          startRecording();
        }
        return (prev || 1) - 1;
      });
    }, 1000);
  };

  return {
    state: {
      role,
      users,
      selectedUser,
      rfid,
      isVideoLoading,
      isVideoValid,
      videoRef,
      videoMessage,
      countdown,
      isRecording,
      selectedDevice,
      fileToSend,
      initUserFile,
      selectedBatchYear,
      batchYears,
    },
    handler: {
      handleRoleChange,
      handleUserChange,
      handleRFIDChange,
      handleSearchInputChange,
      handleStartVideo: startCountdownAndRecord,
      handleDeviceChange,
      handleFileChange,
      handleSendToDevice,
      handleInitFileChange,
      handleInitUserSubmit,
      handleBatchYearChange,
    },
    rfidInputRef,
  };
}

export default useIdentifyManagementHook;
