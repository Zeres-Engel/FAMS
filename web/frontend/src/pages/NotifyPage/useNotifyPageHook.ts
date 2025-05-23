import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import axios from "axios";
import {
  HeadCell,
  NotifyHeadCell,
  NotifyProps,
} from "../../model/tableModels/tableDataModels.model";

// Cấu hình axios interceptor để gửi token xác thực trong mỗi request
const api = axios.create({
  baseURL: 'http://fams.io.vn/api-nodejs'
});

// Thêm interceptor để gửi token trong header của mỗi request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('Request headers:', config.headers);
    console.log('Token from localStorage:', token);
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

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
    } else if (category === 'all') {
      // Nếu là "all", hiển thị cả tin đã gửi và đã nhận
      filtered = [...userMainData, ...sentNotifications];
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
      
      // API URL for received notifications - Đảm bảo URL chính xác 
      const apiUrl = `/notifications/my-notifications?page=${page}&limit=${limit}${category ? `&category=${category}` : ''}${query ? `&search=${query}` : ''}`;
      
      const response = await api.get(apiUrl);
      
      if (response.data && response.data.success) {
        const { notifications, unreadCount, totalItems, totalPages, currentPage } = response.data.data;
        
        // Phân loại thông báo thành "đã nhận" và "đã gửi"
        const receivedNotifications: ExtendedNotifyProps[] = [];
        const sentNotifications: ExtendedNotifyProps[] = [];
        
        // Map API response to match our NotifyProps interface
        notifications.forEach((notification: any) => {
          const mappedNotification = {
            id: notification.NotificationID.toString(),
            message: notification.Message,
            sender: notification.SenderID,
            receiver: notification.ReceiverID,
            sendDate: notification.SentDate,
            readStatus: notification.ReadStatus || false,
            senderInfo: notification.sender,
            receiverInfo: notification.receiver,
            title: notification.Title || 'Thông báo mới',
            archived: notification.Archived || false,
            type: notification.type // 'received' hoặc 'sent'
          } as ExtendedNotifyProps;
          
          // Phân loại theo loại thông báo
          if (notification.type === 'sent') {
            sentNotifications.push(mappedNotification);
          } else {
            receivedNotifications.push(mappedNotification);
          }
        });
        
        // Cập nhật các state
        setUserMainData(receivedNotifications);
        setSentNotifications(sentNotifications);
        
        // Filtering based on view mode, category and search query
        if (viewMode === 'sent') {
          setFilteredData(sentNotifications);
        } else {
          if (query) {
            filterNotifications(category, receivedNotifications, query);
          } else {
            setFilteredData(receivedNotifications);
          }
        }
        
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

  // Fetch sent notifications
  const fetchSentNotifications = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      
      // API URL for sent notifications - sử dụng api instance
      const apiUrl = `/notifications/sent-notifications?page=${page}&limit=${limit}`;
      
      const response = await api.get(apiUrl);
      
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
      console.log("viewNotificationDetails - Viewing notification with ID:", notificationId);
      
      // First mark as read
      const markResult = await markAsRead(notificationId);
      console.log("viewNotificationDetails - Mark as read result:", markResult);
      
      // Then optionally fetch the notification details if needed
      const response = await api.get(`/notifications/${notificationId}`);
      console.log("viewNotificationDetails - Fetch details response:", response.data);
      
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
      const response = await api.post('/notifications', {
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
      const response = await api.post('/notifications/send-to-users', {
        userIds,
        message,
        title
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to send notification to users" };
    } catch (err: any) {
      console.error("Error sending notification to users:", err);
      // Kiểm tra lỗi quyền hạn
      if (err.response?.status === 403) {
        const errorMessage = err.response.data?.message || 'Bạn không có quyền gửi thông báo cho một số người dùng';
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
          error: 'PERMISSION_DENIED'
        };
      }
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
      const response = await api.post('/notifications/send-to-class', {
        classId,
        message,
        title
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to send notification to class" };
    } catch (err: any) {
      console.error("Error sending notification to class:", err);
      // Kiểm tra lỗi quyền hạn
      if (err.response?.status === 403) {
        const errorMessage = err.response.data?.message || 'Bạn không có quyền gửi thông báo cho lớp học';
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
          error: 'PERMISSION_DENIED'
        };
      }
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
      const response = await api.post('/notifications/send-all-students', {
        message,
        title
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to send notification to all students" };
    } catch (err: any) {
      console.error("Error sending notification to all students:", err);
      // Kiểm tra lỗi quyền hạn
      if (err.response?.status === 403) {
        const errorMessage = err.response.data?.message || 'Bạn không có quyền gửi thông báo cho tất cả học sinh';
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
          error: 'PERMISSION_DENIED'
        };
      }
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
      const response = await api.post('/notifications/send-all-teachers', {
        message,
        title
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to send notification to all teachers" };
    } catch (err: any) {
      console.error("Error sending notification to all teachers:", err);
      // Kiểm tra lỗi quyền hạn
      if (err.response?.status === 403) {
        const errorMessage = err.response.data?.message || 'Bạn không có quyền gửi thông báo cho tất cả giáo viên';
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
          error: 'PERMISSION_DENIED'
        };
      }
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
      const response = await api.post('/notifications/send-all-parents', {
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
      
      const response = await api.post('/notifications/send-to-user', {
        userId,
        message,
        title: title || 'Thông báo mới'
      });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: 'Đã gửi thông báo thành công',
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Không thể gửi thông báo',
          error: 'API_ERROR'
        };
      }
    } catch (err: any) {
      console.error("Error sending notification to user:", err);
      // Kiểm tra lỗi quyền hạn
      if (err.response?.status === 403) {
        setError(err.response.data?.message || 'Bạn không có quyền gửi thông báo cho người dùng này');
        return {
          success: false,
          message: err.response.data?.message || 'Bạn không có quyền gửi thông báo cho người dùng này',
          error: 'PERMISSION_DENIED'
        };
      }
      return {
        success: false,
        message: err.response?.data?.message || 'Không thể gửi thông báo',
        error: 'REQUEST_ERROR'
      };
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      setLoading(true);
      console.log("FE markAsRead - Sending request for ID:", notificationId);
      
      const response = await api.patch(`/notifications/${notificationId}/mark-as-read`);
      console.log("FE markAsRead - Response:", response.data);
      
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
        
        return { success: true, message: 'Notification marked as read' };
      } else {
        console.error("FE markAsRead - Failed:", response.data);
        setError("Could not mark notification as read");
        return { success: false, error: "Could not mark notification as read", details: response.data };
      }
    } catch (err) {
      console.error("FE markAsRead - Error:", err);
      setError("Could not mark notification as read");
      return { success: false, error: "Could not mark notification as read", details: err };
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const response = await api.patch('/notifications/mark-all-as-read');
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
      const response = await api.patch(`/notifications/${notificationId}/archive`, {
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
      // Khi chuyển sang xem thông báo đã gửi, sử dụng danh sách sentNotifications
      setFilteredData(sentNotifications);
      setActiveCategory('sent');
    } else {
      // Khi chuyển sang xem thông báo đã nhận, sử dụng danh sách userMainData (đã nhận)
      setFilteredData(userMainData);
      setActiveCategory('all');
    }
  };

  // Thêm hàm xóa thông báo
  const deleteNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.delete(`/notifications/${notificationId}`);
      
      if (response.data && response.data.success) {
        // Cập nhật danh sách thông báo sau khi xóa
        const updatedMainData = userMainData.filter((notification: ExtendedNotifyProps) => notification.id !== notificationId);
        setUserMainData(updatedMainData);
        
        const updatedSentData = sentNotifications.filter((notification: ExtendedNotifyProps) => notification.id !== notificationId);
        setSentNotifications(updatedSentData);
        
        // Nếu đang xem loại thông báo nào, cập nhật filteredData cho loại đó
        if (viewMode === 'sent') {
          setFilteredData(updatedSentData);
        } else {
          setFilteredData(updatedMainData);
        }
        
        // Giảm số lượng thông báo chưa đọc nếu xóa 1 thông báo chưa đọc
        const deletedItem = userMainData.find((notification: ExtendedNotifyProps) => notification.id === notificationId);
        if (deletedItem && !deletedItem.readStatus) {
          setUnreadCount((prev: number) => Math.max(0, prev - 1));
        }
        
        // Refresh danh sách sau khi xóa - không cần gọi fetchNotifications vì chúng ta đã cập nhật state
        // Nhưng phải gọi để đồng bộ với backend trong trường hợp xóa vĩnh viễn
        fetchNotifications(currentPage);
        
        return { success: true, message: 'Notification successfully deleted' };
      } else {
        setError("Could not delete notification");
        return { success: false, error: "Could not delete notification" };
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      setError("Error deleting notification. Please try again later.");
      return { success: false, error: "Error deleting notification" };
    } finally {
      setLoading(false);
    }
  };

  // Gửi thông báo cho tất cả người dùng
  const sendNotificationToAllUsers = async (message: string, title?: string) => {
    try {
      setLoading(true);
      const response = await api.post('/notifications/send-all-users', {
        message,
        title
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, error: "Failed to send notification to all users" };
    } catch (err: any) {
      console.error("Error sending notification to all users:", err);
      // Kiểm tra lỗi quyền hạn
      if (err.response?.status === 403) {
        const errorMessage = err.response.data?.message || 'Bạn không có quyền gửi thông báo cho tất cả người dùng';
        setError(errorMessage);
        return {
          success: false,
          message: errorMessage,
          error: 'PERMISSION_DENIED'
        };
      }
      setError("Failed to send notification to all users. Please try again later.");
      return { success: false, error: "Failed to send notification to all users" };
    } finally {
      setLoading(false);
    }
  };

  // Debug notification issues (admin only)
  const debugNotification = async (notificationId: string) => {
    try {
      console.log("debugNotification - Sending request for ID:", notificationId);
      const response = await api.get(`/notifications/debug-notification/${notificationId}`);
      console.log("DEBUG NOTIFICATION RESULT:", response.data);
      return response.data;
    } catch (err) {
      console.error("Error in debug notification:", err);
      return { 
        success: false, 
        error: "Không thể debug thông báo. Có thể bạn không có quyền admin." 
      };
    }
  };

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    state: {
      userMainData,
      filteredData,
      sentNotifications,
      loading,
      error,
      unreadCount,
      currentPage,
      totalPages,
      totalItems,
      activeCategory,
      searchQuery,
      viewMode,
      headCellsData,
      isCheckBox,
      tableTitle
    },
    handler: {
      fetchNotifications,
      fetchSentNotifications,
      viewNotificationDetails,
      searchNotifications,
      createNotification,
      sendNotificationToUsers,
      sendNotificationToClass,
      sendNotificationToAllStudents,
      sendNotificationToAllTeachers,
      sendNotificationToAllParents,
      sendNotificationToUser,
      markAsRead,
      markAllAsRead,
      toggleArchive,
      switchViewMode,
      filterNotifications,
      deleteNotification,
      sendNotificationToAllUsers,
      debugNotification
    }
  };
}

export default useNotifyPageHook;
