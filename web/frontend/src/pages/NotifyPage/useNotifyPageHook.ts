import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import axios from "axios";
import {
  HeadCell,
  NotifyHeadCell,
  NotifyProps,
} from "../../model/tableModels/tableDataModels.model";

// Extend NotifyProps interface locally to ensure type safety
interface ExtendedNotifyProps extends NotifyProps {
  readStatus: boolean;
  senderInfo?: {
    FullName?: string;
    [key: string]: any;
  };
  archived: boolean;
  title?: string;
}

function useNotifyPageHook() {
  const dispatch = useAppDispatch();
  const role = useAppSelector((state: any) => state.authUser.role);
  const [userMainData, setUserMainData] = useState<ExtendedNotifyProps[]>([]);
  const [filteredData, setFilteredData] = useState<ExtendedNotifyProps[]>([]);
  const [sentNotifications, setSentNotifications] = useState<ExtendedNotifyProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'received' | 'sent'>('received');

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

  // Filter notifications based on category
  const filterNotifications = (category: string, data: ExtendedNotifyProps[], query = '') => {
    setActiveCategory(category);
    
    let filtered = [...data];
    
    // Filter by category
    if (category === 'unread') {
      filtered = filtered.filter(item => !item.readStatus);
    } else if (category === 'read') {
      filtered = filtered.filter(item => item.readStatus);
    } else if (category === 'archive') {
      filtered = filtered.filter(item => item.archived); // Assuming there's an archived property
    } else if (category === 'sent') {
      filtered = sentNotifications;
      setViewMode('sent');
      return filtered;
    }
    
    if (category !== 'sent') {
      setViewMode('received');
    }
    
    // Filter by search query if provided
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(item => 
        item.message.toLowerCase().includes(lowerQuery) || 
        (item.senderInfo?.FullName && item.senderInfo.FullName.toLowerCase().includes(lowerQuery))
      );
    }
    
    setFilteredData(filtered);
    return filtered;
  };

  // Fetch notifications from API
  const fetchNotifications = async (page = 1, limit = 10, category = activeCategory, query = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      
      // API URL for received notifications
      const apiUrl = `http://fams.io.vn/api-nodejs/notifications/my-notifications?page=${page}&limit=${limit}&category=${category}`;
      
      const response = await axios.get(apiUrl);
      
      if (response.data && response.data.success) {
        const { notifications, unreadCount, totalItems, totalPages, currentPage } = response.data.data;
        
        // Map API response to match our NotifyProps interface
        const mappedNotifications = notifications.map((notification: any) => ({
          id: notification.NotificationID.toString(),
          message: notification.Message,
          sender: notification.SenderID,
          receiver: notification.ReceiverID,
          sendDate: notification.SentDate,
          readStatus: notification.ReadStatus || false,
          senderInfo: notification.sender,
          title: notification.Title || 'Thông báo mới',
          archived: notification.Archived || false
        })) as ExtendedNotifyProps[];
        
        setUserMainData(mappedNotifications);
        
        // Filtering based on category and search query
        if (query) {
          filterNotifications(category, mappedNotifications, query);
        } else {
          setFilteredData(mappedNotifications);
        }
        
        setUnreadCount(unreadCount);
        setTotalItems(totalItems);
        setTotalPages(totalPages);
        setCurrentPage(currentPage);
        
        // If we're in the sent view mode, also fetch sent notifications
        if (viewMode === 'sent' || category === 'sent') {
          fetchSentNotifications();
        }
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

  // Fetch sent notifications
  const fetchSentNotifications = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      
      // API URL for sent notifications
      const apiUrl = `http://fams.io.vn/api-nodejs/notifications/sent-notifications?page=${page}&limit=${limit}`;
      
      const response = await axios.get(apiUrl);
      
      if (response.data && response.data.success) {
        const { notifications, totalItems, totalPages, currentPage } = response.data.data;
        
        // Map API response
        const mappedNotifications = notifications.map((notification: any) => ({
          id: notification.NotificationID.toString(),
          message: notification.Message,
          sender: notification.SenderID,
          receiver: notification.ReceiverID,
          sendDate: notification.SentDate,
          readStatus: true, // Sent messages are considered "read" by the sender
          receiverInfo: notification.receiver,
          title: notification.Title || 'Thông báo đã gửi',
          archived: false
        })) as ExtendedNotifyProps[];
        
        setSentNotifications(mappedNotifications);
        
        // If we're in sent view, update the filtered data
        if (viewMode === 'sent' || activeCategory === 'sent') {
          setFilteredData(mappedNotifications);
          setTotalItems(totalItems);
          setTotalPages(totalPages);
          setCurrentPage(currentPage);
        }
      }
    } catch (err) {
      console.error("Error fetching sent notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // View notification details - Marks as read when viewing
  const viewNotificationDetails = async (notificationId: string) => {
    try {
      // First mark as read
      await markAsRead(notificationId);
      
      // Then optionally fetch the notification details if needed
      const response = await axios.get(`http://fams.io.vn/api-nodejs/notifications/${notificationId}`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      console.error("Error viewing notification details:", err);
      return null;
    }
  };

  // Search notifications
  const searchNotifications = (query: string) => {
    setSearchQuery(query);
    if (viewMode === 'sent') {
      const filtered = sentNotifications.filter((item: ExtendedNotifyProps) => 
        item.message.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      filterNotifications(activeCategory, userMainData, query);
    }
  };

  // Create a new notification for a specific user
  const createNotification = async (receiverId: string, message: string, title?: string) => {
    try {
      setLoading(true);
      const response = await axios.post('http://fams.io.vn/api-nodejs/notifications', {
        receiverId,
        message,
        title
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
  
  // Gửi thông báo cho nhiều người dùng
  const sendNotificationToUsers = async (userIds: string[], message: string, title?: string) => {
    try {
      setLoading(true);
      const response = await axios.post('http://fams.io.vn/api-nodejs/notifications/send-to-users', {
        userIds,
        message,
        title
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to send notification to users" };
    } catch (err) {
      console.error("Error sending notification to users:", err);
      setError("Failed to send notification to users. Please try again later.");
      return { success: false, error: "Failed to send notification to users" };
    } finally {
      setLoading(false);
    }
  };
  
  // Gửi thông báo cho một lớp cụ thể
  const sendNotificationToClass = async (classId: number, message: string, title?: string) => {
    try {
      setLoading(true);
      const response = await axios.post('http://fams.io.vn/api-nodejs/notifications/send-to-class', {
        classId,
        message,
        title
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to send notification to class" };
    } catch (err) {
      console.error("Error sending notification to class:", err);
      setError("Failed to send notification to class. Please try again later.");
      return { success: false, error: "Failed to send notification to class" };
    } finally {
      setLoading(false);
    }
  };
  
  // Gửi thông báo cho tất cả học sinh
  const sendNotificationToAllStudents = async (message: string, title?: string) => {
    try {
      setLoading(true);
      const response = await axios.post('http://fams.io.vn/api-nodejs/notifications/send-all-students', {
        message,
        title
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to send notification to all students" };
    } catch (err) {
      console.error("Error sending notification to all students:", err);
      setError("Failed to send notification to all students. Please try again later.");
      return { success: false, error: "Failed to send notification to all students" };
    } finally {
      setLoading(false);
    }
  };
  
  // Gửi thông báo cho tất cả giáo viên
  const sendNotificationToAllTeachers = async (message: string, title?: string) => {
    try {
      setLoading(true);
      const response = await axios.post('http://fams.io.vn/api-nodejs/notifications/send-all-teachers', {
        message,
        title
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to send notification to all teachers" };
    } catch (err) {
      console.error("Error sending notification to all teachers:", err);
      setError("Failed to send notification to all teachers. Please try again later.");
      return { success: false, error: "Failed to send notification to all teachers" };
    } finally {
      setLoading(false);
    }
  };
  
  // Gửi thông báo cho tất cả phụ huynh
  const sendNotificationToAllParents = async (message: string, title?: string) => {
    try {
      setLoading(true);
      const response = await axios.post('http://fams.io.vn/api-nodejs/notifications/send-all-parents', {
        message,
        title
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to send notification to all parents" };
    } catch (err) {
      console.error("Error sending notification to all parents:", err);
      setError("Failed to send notification to all parents. Please try again later.");
      return { success: false, error: "Failed to send notification to all parents" };
    } finally {
      setLoading(false);
    }
  };
  
  // Gửi thông báo cho một người dùng cụ thể
  const sendNotificationToUser = async (userId: string, message: string, title?: string) => {
    try {
      setLoading(true);
      const response = await axios.post('http://fams.io.vn/api-nodejs/notifications/send-to-user', {
        userId,
        message,
        title
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to send notification to user" };
    } catch (err) {
      console.error("Error sending notification to user:", err);
      setError("Failed to send notification to user. Please try again later.");
      return { success: false, error: "Failed to send notification to user" };
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
        // Update local state to mark as read
        const updatedData = userMainData.map((notification: ExtendedNotifyProps) => 
          notification.id === notificationId 
            ? { ...notification, readStatus: true } 
            : notification
        );
        setUserMainData(updatedData);
        
        // If in received view, update filtered data accordingly
        if (viewMode === 'received') {
          filterNotifications(activeCategory, updatedData, searchQuery);
        }
        
        // Decrement unread count if it was previously unread
        const wasUnread = userMainData.find((n: ExtendedNotifyProps) => n.id === notificationId && !n.readStatus);
        if (wasUnread) {
          setUnreadCount((prev: number) => Math.max(0, prev - 1));
        }
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
        // Update local state to mark all as read
        const updatedData = userMainData.map(notification => ({ 
          ...notification, 
          readStatus: true 
        }));
        setUserMainData(updatedData);
        filterNotifications(activeCategory, updatedData, searchQuery);
        setUnreadCount(0);
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
  
  // Archive/Unarchive notification
  const toggleArchive = async (notificationId: string, archive: boolean) => {
    try {
      setLoading(true);
      // Sử dụng API endpoint mới để lưu trữ thông báo
      const response = await axios.patch(`http://fams.io.vn/api-nodejs/notifications/${notificationId}/archive`, {
        archived: archive
      });
      
      if (response.data && response.data.success) {
        // Update local state
        const updatedData = userMainData.map((notification: ExtendedNotifyProps) => 
          notification.id === notificationId 
            ? { ...notification, archived: archive } 
            : notification
        );
        setUserMainData(updatedData);
        filterNotifications(activeCategory, updatedData, searchQuery);
        
        // Nếu đang xem danh mục archive và bỏ lưu trữ một thông báo, cần xóa nó khỏi danh sách
        if (activeCategory === 'archive' && !archive) {
          setFilteredData((prev: ExtendedNotifyProps[]) => prev.filter((item: ExtendedNotifyProps) => item.id !== notificationId));
        }
      } else {
        setError(`Failed to ${archive ? 'archive' : 'unarchive'} notification`);
      }
    } catch (err) {
      console.error(`Error ${archive ? 'archiving' : 'unarchiving'} notification:`, err);
      setError(`Failed to ${archive ? 'archive' : 'unarchive'} notification`);
    } finally {
      setLoading(false);
    }
  };

  // Switch between received and sent views
  const switchViewMode = (mode: 'received' | 'sent') => {
    setViewMode(mode);
    if (mode === 'sent') {
      fetchSentNotifications();
    } else {
      fetchNotifications(1, 10, 'all');
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const state = { 
    headCellsData, 
    userMainData: filteredData, // Use filtered data instead of all data
    tableTitle, 
    isCheckBox, 
    role,
    loading,
    error,
    unreadCount,
    totalItems,
    totalPages,
    currentPage,
    activeCategory,
    searchQuery,
    viewMode,
    sentNotifications
  };
  
  const handler = {
    fetchNotifications,
    fetchSentNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    searchNotifications,
    setCurrentPage,
    filterNotifications,
    toggleArchive,
    sendNotificationToUsers,
    sendNotificationToClass,
    sendNotificationToAllStudents,
    sendNotificationToAllTeachers,
    sendNotificationToAllParents,
    sendNotificationToUser,
    viewNotificationDetails,
    switchViewMode
  };

  return { state, handler };
}

export default useNotifyPageHook;
