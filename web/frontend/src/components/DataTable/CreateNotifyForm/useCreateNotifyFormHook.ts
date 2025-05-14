import { useState } from "react";
import axios from "axios";

export type ReceiverOptionType =
  | "specific"
  | "class"
  | "user"
  | "all-students"
  | "all-teachers"
  | "all-system";

type Option = {
  label: string;
  value: string;
};

export default function useCreateNotifyFormHook(role: string) {
  const [message, setMessage] = useState("");
  const [receiverOption, setReceiverOption] = useState<ReceiverOptionType>("user");
  const [classIDs, setClassIDs] = useState<string[]>([]);
  const [userIDs, setUserIDs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fake data - bạn có thể fetch từ API
  const classOptions: Option[] = [
    { label: "Class 10A1", value: "class10a1" },
    { label: "Class 11B2", value: "class11b2" },
    { label: "Class 12C3", value: "class12c3" },
  ];

  const userOptions: Option[] = [
    { label: "User 001", value: "user001" },
    { label: "User 002", value: "user002" },
    { label: "User 003", value: "user003" },
  ];

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      // Ensure we have at least one user ID, otherwise default to 'admin'
      const users = userIDs.length > 0 ? userIDs : ['admin'];
      
      // Use the new simplified API endpoint for sending to multiple users
      const response = await axios.post('http://fams.io.vn/api-nodejs/notifications/send-to-users', {
        userIds: users,
        message
      });
      
      if (response.data && response.data.success) {
        setSuccess(true);
        // Reset form
        setMessage("");
        setUserIDs([]);
        setClassIDs([]);
      } else {
        setError("Failed to send notification");
      }
    } catch (err) {
      console.error("Error sending notification:", err);
      setError("An error occurred while sending the notification");
    } finally {
      setLoading(false);
    }
  };

  return {
    state: {
      message,
      receiverOption,
      classIDs,
      userIDs,
      classOptions,
      userOptions,
      loading,
      error,
      success
    },
    handler: {
      setMessage,
      setReceiverOption,
      setClassIDs,
      setUserIDs,
      handleSubmit,
    },
  };
}
