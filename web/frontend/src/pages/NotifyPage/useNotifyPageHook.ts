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
}

function useNotifyPageHook() {
  const dispatch = useAppDispatch();
  const role = useAppSelector(state => state.authUser.role);
  const [userMainData, setUserMainData] = useState<ExtendedNotifyProps[]>([]);
  const [filteredData, setFilteredData] = useState<ExtendedNotifyProps[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
          readStatus: notification.ReadStatus || false,
          senderInfo: notification.sender,
          archived: notification.Archived || false // Add archived field with default value
        })) as ExtendedNotifyProps[];
        
        setUserMainData(mappedNotifications);
        filterNotifications(category, mappedNotifications, query);
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

  // Search notifications
  const searchNotifications = (query: string) => {
    setSearchQuery(query);
    filterNotifications(activeCategory, userMainData, query);
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
        // Update local state to mark as read
        const updatedData = userMainData.map(notification => 
          notification.id === notificationId 
            ? { ...notification, readStatus: true } 
            : notification
        );
        setUserMainData(updatedData);
        filterNotifications(activeCategory, updatedData, searchQuery);
        
        // Decrement unread count if it was previously unread
        const wasUnread = userMainData.find(n => n.id === notificationId && !n.readStatus);
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
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
      // Assuming there's an API endpoint to archive notifications
      const response = await axios.patch(`http://fams.io.vn/api-nodejs/notifications/${notificationId}/archive`, {
        archived: archive
      });
      
      if (response.data && response.data.success) {
        // Update local state
        const updatedData = userMainData.map(notification => 
          notification.id === notificationId 
            ? { ...notification, archived: archive } 
            : notification
        );
        setUserMainData(updatedData);
        filterNotifications(activeCategory, updatedData, searchQuery);
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
    searchQuery
  };
  
  const handler = {
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    searchNotifications,
    setCurrentPage,
    filterNotifications,
    toggleArchive
  };

  return { state, handler };
}

export default useNotifyPageHook;
