import React, { useState, useRef, useEffect } from "react";
import "./NotifyPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import { 
  Container, 
  Grid as MuiGrid, 
  CircularProgress, 
  Typography, 
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  IconButton,
  Checkbox,
  Tooltip,
  Box,
  InputBase,
  Badge,
  Chip,
  Button,
  TextField,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Stack,
  SelectChangeEvent
} from "@mui/material";
import useNotifyPageHook from "./useNotifyPageHook";
import { 
  Inbox as InboxIcon, 
  Mail as MailIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  DeleteOutline as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
  FilterList as FilterIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UnreadIcon,
  Archive as ArchiveIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Send as SendIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Drafts as DraftsIcon,
  Save as SaveIcon,
  Outbox as OutboxIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Face as FaceIcon,
  SupervisorAccount as TeacherIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import axios from "axios";
import NotifyBar from "../../components/NotifyBar/NotifyBar";

// Alias Grid to avoid TypeScript errors with item prop
const Grid = MuiGrid;

// Interface for class data
interface ClassData {
  _id: string;
  className: string;
  grade: number;
  homeroomTeacherId: string;
  academicYear: string;
  createdAt: string;
  isActive: boolean;
  classId: number;
  id: string;
  studentNumber: number;
}

function NotifyPage(): React.JSX.Element {
  const { state, handler } = useNotifyPageHook();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSection, setSelectedSection] = useState('received'); // 'received' or 'sent'
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [draftMessages, setDraftMessages] = useState<any[]>([]);
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [showSuccessNotify, setShowSuccessNotify] = useState(false);
  const [notifyId, setNotifyId] = useState(0);
  const [editingDraft, setEditingDraft] = useState<any>({
    id: '',
    receiver: '',
    subject: '',
    message: '',
    sendDate: '',
    isDraft: true,
    isNew: false
  });

  // New states for enhanced receiver selection
  const [sendMode, setSendMode] = useState('all'); // 'user', 'class', 'student', 'teacher', 'all', 'admin'
  const [userIds, setUserIds] = useState('');
  const [studentIds, setStudentIds] = useState('');
  const [teacherIds, setTeacherIds] = useState('');
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [classOptions, setClassOptions] = useState<{label: string, value: string}[]>([]);
  const [selectedClass, setSelectedClass] = useState<{label: string, value: string} | null>(null);
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Get current user role from localStorage
  const getCurrentUserRole = (): string => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      return user.role?.toLowerCase() || 'student';
    }
    return 'student'; // Default to student if no role found
  };
  
  const [userRole, setUserRole] = useState<string>(getCurrentUserRole());

  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // Add a debouncing mechanism to prevent multiple API calls in short succession
  const [fetchTimeout, setFetchTimeout] = useState<any>(null);
  
  const debouncedFetchNotifications = (page = 1, limit = 10, category = selectedCategory, query = searchTerm) => {
    // Clear previous timeout if exists
    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
    }
    
    // Set a new timeout to delay the API call
    const timeout = setTimeout(() => {
      handler.fetchNotifications(page, limit, category, query);
    }, 300); // 300ms debounce time
    
    setFetchTimeout(timeout);
  };
  
  // Cleanup timeout when component unmounts
  useEffect(() => {
    return () => {
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
    };
  }, [fetchTimeout]);

  // Fetch classes when component mounts
  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://fams.io.vn/api-nodejs/classes');
        if (response.data.success) {
          const classes = response.data.data as ClassData[];
          setAllClasses(classes);
          
          // Extract and sort unique academic years
          const years = Array.from(new Set(classes.map(cls => cls.academicYear))).sort((a, b) => {
            // Sort by most recent year first
            const endYearA = parseInt(a.split('-')[1]);
            const endYearB = parseInt(b.split('-')[1]);
            return endYearB - endYearA;
          });
          
          setAcademicYears(years);
          if (years.length > 0) {
            setSelectedAcademicYear(years[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, []);

  // Update class options when academic year changes
  useEffect(() => {
    if (selectedAcademicYear) {
      const filteredClasses = allClasses.filter(cls => cls.academicYear === selectedAcademicYear);
      const options = filteredClasses.map(cls => ({
        label: cls.className,
        value: cls.classId.toString()
      }));
      
      // Sort by class name
      options.sort((a, b) => a.label.localeCompare(b.label));
      
      setClassOptions(options);
    } else {
      setClassOptions([]);
    }
    
    // Reset selected class when academic year changes
    setSelectedClass(null);
  }, [selectedAcademicYear, allClasses]);

  // Thêm useEffect để tải thông báo khi trang được tải lần đầu
  useEffect(() => {
    // Tải thông báo chỉ một lần duy nhất khi component mount
    debouncedFetchNotifications();
    
    // Cleanup khi component unmount
    return () => {};
  }, []);

  // Get available send modes based on user role
  const getRoleBasedSendModes = () => {
    switch(userRole) {
      case 'admin':
        return [
          { value: 'user', label: 'User', icon: <PersonIcon fontSize="small" sx={{ mr: 0.5 }} /> },
          { value: 'class', label: 'Class', icon: <SchoolIcon fontSize="small" sx={{ mr: 0.5 }} /> },
          { value: 'student', label: 'Students', icon: <FaceIcon fontSize="small" sx={{ mr: 0.5 }} /> },
          { value: 'teacher', label: 'Teachers', icon: <TeacherIcon fontSize="small" sx={{ mr: 0.5 }} /> },
          { value: 'all', label: 'All Users', icon: <GroupIcon fontSize="small" sx={{ mr: 0.5 }} /> }
        ];
      case 'teacher':
        return [
          { value: 'class', label: 'Class', icon: <SchoolIcon fontSize="small" sx={{ mr: 0.5 }} /> },
          { value: 'student', label: 'Students', icon: <FaceIcon fontSize="small" sx={{ mr: 0.5 }} /> },
          { value: 'admin', label: 'Admin', icon: <AdminIcon fontSize="small" sx={{ mr: 0.5 }} /> }
        ];
      case 'student':
      default:
        return [
          { value: 'teacher', label: 'Teachers', icon: <TeacherIcon fontSize="small" sx={{ mr: 0.5 }} /> }
        ];
    }
  };

  // Check if current user role has access to the current send mode
  useEffect(() => {
    // Refresh user role on component mount
    setUserRole(getCurrentUserRole());
    
    // Get available send modes for this user role
    const availableModes = getRoleBasedSendModes().map(mode => mode.value);
    
    // If current sendMode is not available for this role, reset to first available option
    if (!availableModes.includes(sendMode) && availableModes.length > 0) {
      setSendMode(availableModes[0]);
    }
  }, [userRole]);

  const handleCategoryClick = (category: string, section = selectedSection) => {
    setSelectedCategory(category);
    setSelectedSection(section);
    
    // Clear any selected notification
    setSelectedNotification(null);
    setIsComposing(false);
    
    if (section === 'sent') {
      // For Draft category, we use local state, no need for API call
      if (category === 'draft') {
        handler.switchViewMode('sent');
        return;
      }
      
      // Chuyển sang chế độ xem thông báo đã gửi
      handler.switchViewMode('sent');
      // Only fetch for sent notifications if needed
      debouncedFetchNotifications(1, 10, 'sent', searchTerm);
    } else {
      // Chuyển sang chế độ xem thông báo đã nhận
      handler.switchViewMode('received');
      // Lọc thông báo theo category
      debouncedFetchNotifications(1, 10, category, searchTerm);
    }
  };

  const handleSelectNotification = (id: string) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter((item: string) => item !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const handleViewNotification = async (notification: any) => {
    // If we're already composing, save the current draft before viewing
    if (isComposing && editingDraft.id) {
      handleSaveDraftChanges();
    }
    
    // Gọi API để đánh dấu thông báo đã đọc
    if (!notification.readStatus) {
      try {
        await handler.markAsRead(notification.id);
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    
    setSelectedNotification(notification);
    setIsComposing(false);
  };

  const handleCloseNotification = () => {
    // If we're composing, save the draft before closing
    if (isComposing && editingDraft.id) {
      handleSaveDraftChanges();
    }
    
    setSelectedNotification(null);
    setIsComposing(false);
  };

  const handleSelectAll = () => {
    const currentList = selectedSection === 'received' 
      ? state.userMainData 
      : selectedCategory === 'draft' ? draftMessages : sentMessages;
      
    if (selectedNotifications.length === currentList.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(currentList.map((notification: any) => notification.id));
    }
  };

  const handleMarkAsRead = () => {
    if (selectedNotifications.length > 0 && selectedSection === 'received') {
      selectedNotifications.forEach((id: string) => {
        handler.markAsRead(id);
      });
      setSelectedNotifications([]);
    }
  };

  const handleMarkAllAsRead = () => {
    if (selectedSection === 'received') {
      handler.markAllAsRead();
    }
  };

  const handleRefresh = () => {
    debouncedFetchNotifications(1, 10, selectedCategory, searchTerm);
  };

  const handleCreateNewDraft = () => {
    // If we're already composing, save the current draft first
    if (isComposing && editingDraft.id) {
      handleSaveDraftChanges();
    }
    
    // Create a new empty draft
    const newDraft = {
      id: `draft-${Date.now()}`,
      receiver: '',
      subject: '',
      message: '',
      sendDate: new Date().toISOString(),
      readStatus: true,
      senderInfo: { FullName: 'Me (Draft)' },
      isDraft: true,
      isNew: true
    };
    
    // Add to drafts list
    setDraftMessages([newDraft, ...draftMessages]);
    
    // Automatically switch to drafts section and select the new draft
    setSelectedSection('sent');
    setSelectedCategory('draft');
    setSelectedNotification(newDraft);
    setEditingDraft(newDraft);
    setIsComposing(true);
    
    // Get available send modes for this user
    const availableModes = getRoleBasedSendModes();
    
    // Reset send mode to first available option for this user role
    if (availableModes.length > 0) {
      setSendMode(availableModes[0].value);
    }
    
    // Reset other form fields
    setUserIds('');
    setStudentIds('');
    setTeacherIds('');
    setSelectedClass(null);
    setSelectedAcademicYear(academicYears.length > 0 ? academicYears[0] : '');
  };

  const handleEditDraft = (draft: any) => {
    setSelectedNotification(draft);
    setEditingDraft(draft);
    setIsComposing(true);
    
    // Attempt to parse the receiver to determine the send mode
    const receiver = draft.receiver || '';
    if (receiver.includes(',')) {
      setSendMode('user');
      setUserIds(receiver);
    } else if (receiver === 'students') {
      setSendMode('student');
    } else if (receiver === 'teachers') {
      setSendMode('teacher');
    } else if (receiver === 'all') {
      setSendMode('all');
    } else if (receiver.startsWith('class:')) {
      setSendMode('class');
      const classId = receiver.split(':')[1];
      const classOption = classOptions.find(option => option.value === classId);
      if (classOption) {
        setSelectedClass(classOption);
      }
      
      // Try to find the academic year for this class
      const classData = allClasses.find(cls => cls.classId.toString() === classId);
      if (classData) {
        setSelectedAcademicYear(classData.academicYear);
      }
    }
  };

  const handleSaveDraftChanges = () => {
    if (!editingDraft.id) return;
    
    // Determine receiver based on send mode
    let receiver = '';
    switch (sendMode) {
      case 'user':
        receiver = userIds;
        break;
      case 'class':
        receiver = selectedClass ? `class:${selectedClass.value}` : '';
        break;
      case 'student':
        receiver = 'students';
        break;
      case 'teacher':
        receiver = 'teachers';
        break;
      case 'all':
      default:
        receiver = 'all';
        break;
    }
    
    const message = messageRef.current?.value || editingDraft.message;
    
    // Only save if at least one field has content
    if (receiver || message) {
      const updatedDraft = {
        ...editingDraft,
        receiver,
        message,
        sendDate: new Date().toISOString(),
        isNew: false
      };
      
      // Update in drafts list
      setDraftMessages(draftMessages.map(draft => 
        draft.id === updatedDraft.id ? updatedDraft : draft
      ));
      
      setSelectedNotification(updatedDraft);
      setEditingDraft(updatedDraft);
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    setDraftMessages(draftMessages.filter((draft: any) => draft.id !== draftId));
    if (selectedNotification && selectedNotification.id === draftId) {
      setSelectedNotification(null);
      setIsComposing(false);
    }
  };

  const handleSendMessage = async () => {
    // Check if message exists
    if (!messageRef.current?.value && !editingDraft.message) {
      alert('Please enter a message');
      return;
    }
    
    // Prepare message content
    const message = messageRef.current?.value || editingDraft.message;
    const subject = 'New Notification'; // Default subject
    
    setLoading(true);
    
    try {
      let response;
      let sendSuccess = false;
      
      // Handle different send modes
      switch (sendMode) {
        case 'user':
          // Send to individual users
          if (userIds) {
            const userIdList = userIds.split(',').map(id => id.trim()).filter(id => id);
            
            if (userIdList.length === 1) {
              // Single recipient
              response = await handler.sendNotificationToUser(
                userIdList[0],
                message,
                subject
              );
              sendSuccess = response?.success;
            } else if (userIdList.length > 1) {
              // Multiple recipients
              response = await handler.sendNotificationToUsers(
                userIdList,
                message,
                subject
              );
              sendSuccess = response?.success;
            }
          } else {
            // Default to sending to self if no user IDs specified
            const userJson = localStorage.getItem('user');
            if (userJson) {
              const user = JSON.parse(userJson);
              if (user.userId) {
                response = await handler.sendNotificationToUser(
                  user.userId,
                  message,
                  subject
                );
                sendSuccess = response?.success;
              }
            }
          }
          break;
          
        case 'student':
          // For teacher role: Send to specific students if IDs provided
          if (userRole === 'teacher' && studentIds) {
            const studentIdList = studentIds.split(',').map(id => id.trim()).filter(id => id);
            
            if (studentIdList.length >= 1) {
              response = await handler.sendNotificationToUsers(
                studentIdList,
                message,
                subject
              );
              sendSuccess = response?.success;
            }
          } else {
            // Admin role or no specific students: Send to all students
            response = await handler.sendNotificationToAllStudents(
              message,
              subject
            );
            sendSuccess = response?.success;
          }
          break;
          
        case 'teacher':
          // For student role: Send to specific teachers if IDs provided
          if (userRole === 'student' && teacherIds) {
            const teacherIdList = teacherIds.split(',').map(id => id.trim()).filter(id => id);
            
            if (teacherIdList.length >= 1) {
              response = await handler.sendNotificationToUsers(
                teacherIdList,
                message,
                subject
              );
              sendSuccess = response?.success;
            }
          } else {
            // Default: Send to all teachers
            response = await handler.sendNotificationToAllTeachers(
              message,
              subject
            );
            sendSuccess = response?.success;
          }
          break;
          
        case 'class':
          // Send to class
          if (selectedClass) {
            response = await handler.sendNotificationToClass(
              parseInt(selectedClass.value),
              message,
              subject
            );
            sendSuccess = response?.success;
          }
          break;
          
        case 'all':
        default:
          // Send to all users
          response = await handler.sendNotificationToAllUsers(
            message,
            subject
          );
          sendSuccess = response?.success;
          break;
      }
      
      // Show success message
      if (sendSuccess) {
        // Clear form
        setIsComposing(false);
        setSelectedNotification(null);
        
        // Remove from drafts if it was a draft
        if (editingDraft.id && editingDraft.id.startsWith('draft-')) {
          setDraftMessages(draftMessages.filter((draft: any) => draft.id !== editingDraft.id));
        }
        
        // Reset editing draft
        setEditingDraft({
          id: '',
          receiver: '',
          subject: '',
          message: '',
          sendDate: '',
          isDraft: true,
          isNew: false
        });
        
        // Show success notification using NotifyBar
        setNotifyId(prev => prev + 1);
        setShowSuccessNotify(true);
        
        // Refresh notification list
        debouncedFetchNotifications();
      } else {
        alert('Failed to send notification. Please try again.');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('An error occurred while sending the notification.');
    } finally {
      setLoading(false);
    }
  };

  const getReceiverDisplay = (receiver: string) => {
    if (!receiver) return '(No recipient)';
    
    if (receiver.includes(',')) {
      return `Multiple Users (${receiver.split(',').length})`;
    } else if (receiver === 'students') {
      return 'All Students';
    } else if (receiver === 'teachers') {
      return 'All Teachers';
    } else if (receiver === 'all') {
      return 'All Users';
    } else if (receiver.startsWith('class:')) {
      const classId = receiver.split(':')[1];
      const classOption = classOptions.find(option => option.value === classId);
      return classOption ? `Class: ${classOption.label}` : `Class: ${classId}`;
    }
    
    return receiver;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationPreview = (message: string) => {
    return message.length > 80 ? `${message.substring(0, 80)}...` : message;
  };

  // Determine which list to show based on the selected section and category
  const getCurrentNotificationList = () => {
    if (selectedSection === 'received') {
      if (selectedCategory === 'unread') {
        return state.filteredData.filter((item: any) => !item.readStatus);
      } else if (selectedCategory === 'read') {
        return state.filteredData.filter((item: any) => item.readStatus);
      } else {
        // For "all" category
        return state.filteredData;
      }
    } else if (selectedSection === 'sent') {
      if (selectedCategory === 'draft') {
        // For drafts, use the local drafts list
        return draftMessages;
      } else {
        // For sent messages
        return state.sentNotifications;
      }
    }
    
    // Default case
    return [];
  };

  const currentNotificationList = getCurrentNotificationList();
  
  // Update delete notification handler to use English
  const handleDeleteNotification = async () => {
    // Confirm with user in English
    if (selectedNotifications.length > 0 && window.confirm('Are you sure you want to delete the selected notifications?')) {
      try {
        // Show loading
        setLoading(true);
        
        // Process each selected notification
        for (const notificationId of selectedNotifications) {
          // Call API to delete notification
          const result = await handler.deleteNotification(notificationId);
          if (!result.success) {
            console.error(`Could not delete notification ${notificationId}: ${result.error}`);
          }
        }
        
        // Refresh notification list after deletion
        debouncedFetchNotifications();
        
        // Clear selection
        setSelectedNotifications([]);
        
        // Close notification details if being displayed
        setSelectedNotification(null);
      } catch (error) {
        console.error('Error deleting notifications:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <LayoutComponent pageHeader="Notifications">
      <Container maxWidth={false} className="notify-page-container">
        {state.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {state.error}
          </Alert>
        )}
            
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }} className="notify-page-grid">
          {/* Left Sidebar - Categories */}
          <Box sx={{ width: { xs: '100%', md: '20%', lg: '15%' }, pr: { md: 2 }, mb: { xs: 2, md: 0 } }} className="notify-sidebar-container">
            <Box className="compose-btn-container">
              <Button
                variant="contained"
                fullWidth
                startIcon={<AddIcon />}
                onClick={handleCreateNewDraft}
                className="compose-btn"
              >
                New Notify
              </Button>
            </Box>
            
            <Paper elevation={2} className="notify-sidebar">
              <List>
                {/* Menu toàn cục */}
                <ListItemButton 
                  selected={selectedCategory === 'all'}
                  onClick={() => handleCategoryClick('all', 'all')}
                >
                  <ListItemIcon>
                    <InboxIcon />
                  </ListItemIcon>
                  <ListItemText primary="All" />
                  <Badge badgeContent={state.unreadCount} color="primary" />
                </ListItemButton>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Received Notifications Section */}
                <ListItem>
                  <Typography variant="h6" className="sidebar-section-title">Received</Typography>
                </ListItem>
                <ListItemButton 
                  selected={selectedSection === 'received' && selectedCategory === 'unread'}
                  onClick={() => handleCategoryClick('unread', 'received')}
                >
                  <ListItemIcon>
                    <UnreadIcon />
                  </ListItemIcon>
                  <ListItemText primary="Unread" />
                  <Badge badgeContent={state.unreadCount} color="primary" />
                </ListItemButton>
                <ListItemButton 
                  selected={selectedSection === 'received' && selectedCategory === 'read'}
                  onClick={() => handleCategoryClick('read', 'received')}
                >
                  <ListItemIcon>
                    <CheckCircleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Read" />
                </ListItemButton>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Sent Notifications Section */}
                <ListItem>
                  <Typography variant="h6" className="sidebar-section-title">Sent</Typography>
                </ListItem>
                <ListItemButton 
                  selected={selectedSection === 'sent' && selectedCategory === 'sent'}
                  onClick={() => handleCategoryClick('sent', 'sent')}
                >
                  <ListItemIcon>
                    <SendIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sent" />
                </ListItemButton>
                <ListItemButton 
                  selected={selectedSection === 'sent' && selectedCategory === 'draft'}
                  onClick={() => handleCategoryClick('draft', 'sent')}
                >
                  <ListItemIcon>
                    <DraftsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Drafts" />
                  <Badge badgeContent={draftMessages.length} color="primary" />
                </ListItemButton>
              </List>
            </Paper>
          </Box>
          
          {/* Middle Column - Notification List */}
          <Box sx={{ 
            width: { 
              xs: '100%', 
              md: selectedNotification ? '30%' : '80%', 
              lg: selectedNotification ? '30%' : '85%' 
            },
            pr: { md: selectedNotification ? 2 : 0 },
            transition: 'width 0.3s ease-in-out'
          }} className="notify-list-container">
            <Paper elevation={2} className="notify-content">
              {/* Toolbar */}
              <Box className="notify-toolbar">
                <Box className="toolbar-left">
                  <Checkbox 
                    indeterminate={selectedNotifications.length > 0 && selectedNotifications.length < currentNotificationList.length}
                    checked={selectedNotifications.length > 0 && selectedNotifications.length === currentNotificationList.length}
                    onChange={handleSelectAll}
                  />
                  <Tooltip title="Refresh">
                    <IconButton onClick={handleRefresh} disabled={selectedSection !== 'received'}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  {selectedSection === 'received' && (
                    <Tooltip title="Mark as read">
                      <IconButton 
                        onClick={handleMarkAsRead}
                        disabled={selectedNotifications.length === 0}
                      >
                        <MarkReadIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete">
                    <IconButton 
                      disabled={selectedNotifications.length === 0}
                      onClick={() => {
                        if (selectedSection === 'sent' && selectedCategory === 'draft') {
                          selectedNotifications.forEach((id: string) => handleDeleteDraft(id));
                          setSelectedNotifications([]);
                        } else {
                          // Sử dụng hàm xóa thông báo
                          handleDeleteNotification();
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box className="toolbar-right">
                  <Paper className="search-box">
                    <IconButton size="small">
                      <SearchIcon />
                    </IconButton>
                    <InputBase
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    />
                  </Paper>
                  <Tooltip title="Filter">
                    <IconButton>
                      <FilterIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              <Divider />
              
              {/* Notification List */}
              {(selectedSection === 'received' && state.loading) ? (
                <Box className="loading-container">
                  <CircularProgress />
                </Box>
              ) : currentNotificationList.length === 0 ? (
                <Box className="empty-container">
                  <EmailIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {selectedSection === 'received' 
                      ? 'No notifications found' 
                      : selectedCategory === 'draft' 
                        ? 'No drafts found' 
                        : 'No sent notifications found'}
                  </Typography>
                </Box>
              ) : (
                <List className="notify-list">
                  {currentNotificationList.map((notification: any) => (
                    <ListItem 
                      key={notification.id}
                      disablePadding
                      className={`notify-item ${notification.readStatus ? 'read' : 'unread'} ${selectedNotification?.id === notification.id ? 'selected' : ''} ${notification.isDraft ? 'draft' : ''} ${notification.isSent ? 'sent' : ''}`}
                      secondaryAction={
                        <Box className="notification-actions">
                          {notification.isDraft && (
                            <Tooltip title="Edit Draft">
                              <IconButton 
                                size="small" 
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  handleEditDraft(notification);
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Typography variant="body2" className="notification-date">
                            {formatDate(notification.sendDate)}
                          </Typography>
                        </Box>
                      }
                    >
                      <ListItemButton onClick={() => handleViewNotification(notification)}>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={selectedNotifications.includes(notification.id)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              e.stopPropagation();
                              handleSelectNotification(notification.id);
                            }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          />
                          {notification.isDraft && (
                            <DraftsIcon color="action" fontSize="small" className="draft-icon" />
                          )}
                          {notification.type === 'sent' && !notification.isDraft && (
                            <SendIcon color="primary" fontSize="small" className="sent-icon" />
                          )}
                          {notification.type === 'received' && !notification.readStatus && (
                            <UnreadIcon color="primary" fontSize="small" className="unread-icon" />
                          )}
                        </ListItemIcon>
                        <Box className="notification-content">
                          <Box className="notification-header">
                            <Typography 
                              variant="subtitle1" 
                              className={
                                notification.isDraft 
                                  ? 'draft-subject' 
                                  : notification.type === 'sent'
                                    ? 'sent-subject' 
                                    : notification.readStatus 
                                      ? 'read-subject' 
                                      : 'unread-subject'
                              }
                            >
                              {notification.isDraft 
                                ? (notification.subject || '(No subject)') 
                                : notification.subject
                                  ? notification.subject
                                  : notification.senderInfo?.FullName || `User ${notification.sender}`
                              }
                            </Typography>
                            {notification.isDraft && (
                              <Chip size="small" label="Draft" color="default" className="draft-chip" />
                            )}
                            {notification.type === 'sent' && !notification.isDraft && (
                              <Chip size="small" label="Sent" color="success" className="sent-chip" />
                            )}
                            {notification.type === 'received' && !notification.readStatus && (
                              <Chip size="small" label="New" color="primary" className="new-chip" />
                            )}
                            {notification.type === 'received' && notification.readStatus && (
                              <Chip size="small" label="Read" color="default" className="received-chip" />
                            )}
                          </Box>
                          <Typography 
                            variant="body2" 
                            className="notification-message"
                          >
                            {notification.isDraft 
                              ? `To: ${getReceiverDisplay(notification.receiver)} - ${getNotificationPreview(notification.message || '(No content)')}` 
                              : notification.type === 'sent'
                                ? `To: ${notification.receiverInfo?.userId || notification.receiver} - ${getNotificationPreview(notification.message)}`
                                : getNotificationPreview(notification.message)
                            }
                          </Typography>
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Box>
          
          {/* Right Column - Notification Detail or Compose */}
          {(selectedNotification || isComposing) && (
            <Box sx={{ width: { xs: '100%', md: '50%', lg: '55%' } }} className="notify-detail-container">
              <Paper elevation={2} className="notify-detail">
                <Box className="detail-header">
                  <Box className="header-left">
                    <Typography variant="h6" className="detail-subject">
                      {isComposing 
                        ? 'New Notification'
                        : selectedNotification?.isDraft 
                          ? `Draft: ${selectedNotification.subject || '(No subject)'}`
                          : selectedNotification?.isSent
                            ? `Sent: ${selectedNotification.subject || '(No subject)'}`
                            : `Message from ${selectedNotification?.senderInfo?.FullName || `User ${selectedNotification?.sender}`}`
                      }
                    </Typography>
                  </Box>
                  <Box className="header-right">
                    {selectedNotification?.isDraft && !isComposing && (
                      <Tooltip title="Edit Draft">
                        <IconButton onClick={() => handleEditDraft(selectedNotification)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Close">
                      <IconButton onClick={handleCloseNotification}>
                        <CloseIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Divider />
                
                {isComposing ? (
                  <Box className="compose-content" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Send Mode Selection */}
                    <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                      <Typography variant="subtitle1" sx={{ mb: 1 }}>Send to:</Typography>
                      <RadioGroup 
                        row 
                        value={sendMode} 
                        onChange={(e) => setSendMode(e.target.value)}
                      >
                        {getRoleBasedSendModes().map((mode) => (
                          <FormControlLabel 
                            key={mode.value}
                            value={mode.value} 
                            control={<Radio />} 
                            label={<Box sx={{ display: 'flex', alignItems: 'center' }}>{mode.icon}{mode.label}</Box>} 
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>

                    {/* Dynamic Receiver Input Fields */}
                    {sendMode === 'user' && (
                      <TextField
                        margin="normal"
                        label="User IDs (comma-separated)"
                        fullWidth
                        variant="outlined"
                        value={userIds}
                        onChange={(e) => setUserIds(e.target.value)}
                        placeholder="E.g. user1, user2, user3"
                        helperText="Enter multiple user IDs separated by commas"
                        sx={{ mb: 2 }}
                      />
                    )}

                    {sendMode === 'student' && userRole === 'teacher' && (
                      <TextField
                        margin="normal"
                        label="Student IDs (comma-separated)"
                        fullWidth
                        variant="outlined"
                        value={studentIds}
                        onChange={(e) => setStudentIds(e.target.value)}
                        placeholder="E.g. student1, student2, student3"
                        helperText="Enter multiple student IDs separated by commas"
                        sx={{ mb: 2 }}
                      />
                    )}

                    {sendMode === 'teacher' && userRole === 'student' && (
                      <TextField
                        margin="normal"
                        label="Teacher IDs (comma-separated)"
                        fullWidth
                        variant="outlined"
                        value={teacherIds}
                        onChange={(e) => setTeacherIds(e.target.value)}
                        placeholder="E.g. teacher1, teacher2, teacher3"
                        helperText="Enter multiple teacher IDs separated by commas"
                        sx={{ mb: 2 }}
                      />
                    )}

                    {sendMode === 'class' && (
                      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel>Academic Year</InputLabel>
                          <Select
                            value={selectedAcademicYear}
                            label="Academic Year"
                            onChange={(e) => setSelectedAcademicYear(e.target.value)}
                          >
                            {academicYears.map((year) => (
                              <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel>Class</InputLabel>
                          <Select
                            label="Class"
                            value={selectedClass?.value || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              const option = classOptions.find(opt => opt.value === value);
                              setSelectedClass(option || null);
                            }}
                            disabled={!selectedAcademicYear || classOptions.length === 0}
                          >
                            {classOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>
                    )}

                    {/* Message Field */}
                    <TextField
                      margin="normal"
                      label="Message"
                      fullWidth
                      multiline
                      rows={16}
                      variant="outlined"
                      defaultValue={editingDraft.message}
                      inputRef={messageRef}
                      className="compose-message"
                      placeholder="Enter your message here..."
                      sx={{ flex: 1, mb: 3 }}
                      onChange={(e) => {
                        // Force re-render on message change to update disabled status of Send button
                        setEditingDraft({...editingDraft, message: e.target.value});
                      }}
                    />

                    {/* Responsive Send button area */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end',
                      position: 'sticky',
                      bottom: '0',
                      backgroundColor: 'white',
                      p: 2,
                      mt: 1,
                      width: '100%',
                      boxShadow: '0px -2px 4px rgba(0,0,0,0.1)',
                      zIndex: 5,
                      minHeight: '64px', // Ensure minimum height for the button area
                      maxHeight: '80px'   // Prevent excessive height
                    }}>
                      <Button
                        onClick={handleSendMessage}
                        variant="contained"
                        color="primary"
                        startIcon={<SendIcon />}
                        disabled={!messageRef.current?.value && !editingDraft.message}
                        size="medium"
                        sx={{
                          width: { xs: '100%', sm: 'auto' },
                          height: { xs: '40px', sm: '36px' },
                          fontSize: '14px',
                          px: 2
                        }}
                      >
                        Send
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box className="detail-content">
                    <Box className="detail-info">
                      <Box className="sender-info">
                        <Avatar className="sender-avatar">
                          {selectedNotification.isDraft 
                            ? 'D'
                            : selectedNotification.type === 'sent'
                              ? 'S'
                              : selectedNotification.senderInfo?.FullName 
                                ? selectedNotification.senderInfo.FullName.charAt(0) 
                                : selectedNotification.sender.charAt(0)
                          }
                        </Avatar>
                        <Box className="sender-details">
                          <Typography variant="subtitle1" className="sender-name">
                            {selectedNotification.isDraft 
                              ? 'Draft Message'
                              : selectedNotification.type === 'sent'
                                ? 'Sent by you'
                                : selectedNotification.senderInfo?.FullName || `User ${selectedNotification.sender}`
                            }
                          </Typography>
                          <Typography variant="body2" className="send-to">
                            {selectedNotification.type === 'sent' 
                              ? `To: ${selectedNotification.receiverInfo?.userId || selectedNotification.receiver}` 
                              : selectedNotification.type === 'received'
                                ? `From: ${selectedNotification.senderInfo?.userId || selectedNotification.sender}`
                                : `To: ${getReceiverDisplay(selectedNotification.receiver)}`
                            }
                          </Typography>
                          <Box className="time-info">
                            <AccessTimeIcon fontSize="small" />
                            <Typography variant="body2">
                              {selectedNotification.isDraft 
                                ? `Saved on ${formatDate(selectedNotification.sendDate)} at ${formatTime(selectedNotification.sendDate)}`
                                : selectedNotification.type === 'sent'
                                  ? `Sent on ${formatDate(selectedNotification.sendDate)} at ${formatTime(selectedNotification.sendDate)}`
                                  : `${formatDate(selectedNotification.sendDate)} at ${formatTime(selectedNotification.sendDate)}`
                              }
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box className="message-content">
                      <Typography variant="body1">
                        {selectedNotification.message || '(No content)'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </Box>
      </Container>
      {showSuccessNotify && (
        <NotifyBar
          notifyType="success"
          notifyContent="Notification has been sent successfully"
          title="Success"
          duration={3000}
          notifyID={notifyId}
        />
      )}
    </LayoutComponent>
  );
}

export default NotifyPage;
