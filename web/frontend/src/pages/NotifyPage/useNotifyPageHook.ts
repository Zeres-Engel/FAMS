import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import axios from "axios";
import {
  HeadCell,
  NotifyHeadCell,
  NotifyProps,
} from "../../model/tableModels/tableDataModels.model";

function useNotifyPageHook() {
  const dispatch = useAppDispatch();
  const role = useAppSelector(state => state.authUser.role);
  const [userMainData, setUserMainData] = useState<NotifyProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const headCellsData: NotifyHeadCell[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: true,
      label: "ID",
    },
    {
      id: "sendDate",
      numeric: false,
      disablePadding: false,
      label: "Send Date",
    },
    {
      id: "message",
      numeric: false,
      disablePadding: true,
      label: "Message",
    },
    {
      id: "sender",
      numeric: false,
      disablePadding: false,
      label: "Sender",
    },
    {
      id: "receiver",
      numeric: false,
      disablePadding: false,
      label: "Receiver",
    },
  ];
  
  const isCheckBox = false;
  const tableTitle = "Notifications";

  // Fetch notifications from API
  const fetchNotifications = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://fams.io.vn/api-nodejs/notifications/my-notifications?page=${page}&limit=${limit}`);
      
      if (response.data && response.data.success) {
        const { notifications, unreadCount, totalItems, totalPages, currentPage } = response.data.data;
        
        // Map API response to match our NotifyProps interface
        const mappedNotifications = notifications.map((notification: any) => ({
          id: notification.NotificationID.toString(),
          message: notification.Message,
          sender: notification.SenderID,
          receiver: notification.ReceiverID,
          sendDate: notification.SentDate,
          readStatus: notification.ReadStatus,
          senderInfo: notification.sender
        }));
        
        setUserMainData(mappedNotifications);
        setUnreadCount(unreadCount);
        setTotalItems(totalItems);
        setTotalPages(totalPages);
        setCurrentPage(currentPage);
      } else {
        setError("Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to fetch notifications. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Create a new notification
  const createNotification = async (receiverId: string, message: string) => {
    try {
      setLoading(true);
      const response = await axios.post('http://fams.io.vn/api-nodejs/notifications', {
        receiverId,
        message
      });

      if (response.data && response.data.success) {
        // Refresh the notifications list after creating a new one
        fetchNotifications();
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to create notification" };
    } catch (err) {
      console.error("Error creating notification:", err);
      setError("Failed to create notification. Please try again later.");
      return { success: false, error: "Failed to create notification" };
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      setLoading(true);
      const response = await axios.patch(`http://fams.io.vn/api-nodejs/notifications/${notificationId}/mark-as-read`);
      if (response.data && response.data.success) {
        fetchNotifications(currentPage);
      } else {
        setError("Failed to mark notification as read");
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError("Failed to mark notification as read");
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const response = await axios.patch('http://fams.io.vn/api-nodejs/notifications/mark-all-as-read');
      if (response.data && response.data.success) {
        fetchNotifications(currentPage);
      } else {
        setError("Failed to mark all notifications as read");
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      setError("Failed to mark all notifications as read");
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const state = { 
    headCellsData, 
    userMainData, 
    tableTitle, 
    isCheckBox, 
    role,
    loading,
    error,
    unreadCount,
    totalItems,
    totalPages,
    currentPage
  };
  
  const handler = {
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    setCurrentPage
  };

  return { state, handler };
}

export default useNotifyPageHook;
