import { useEffect, useRef, useState } from "react";

// Giả lập API
const mockUsers = {
  teacher: [
    { id: "t1", userName: "Mr. John", phone: "0123456789" },
    { id: "t2", userName: "Ms. Alice", phone: "0987654321" },
  ],
  student: [
    { id: "s1", userName: "Student A", phone: "0112233445" },
    { id: "s2", userName: "Student B", phone: "0667788990" },
  ],
};

function useIdentifyManagementHook() {
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [users, setUsers] = useState<any[]>([]);
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

  useEffect(() => {
    setUsers(mockUsers[role]);
  }, [role]);

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
  };

  const handleRFIDChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRfid(event.target.value);
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
          isValid ? "✅ Video hợp lệ!" : "❌ Video không hợp lệ, vui lòng quay lại."
        );
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
      isRecording
    },
    handler: {
      handleRoleChange,
      handleUserChange,
      handleRFIDChange,
      handleStartVideo: startCountdownAndRecord
    },
    rfidInputRef,
  };
}

export default useIdentifyManagementHook;
