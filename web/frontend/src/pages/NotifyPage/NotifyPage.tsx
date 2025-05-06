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
  Group as GroupIcon
} from '@mui/icons-material';
import axios from "axios";

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
  const [sendMode, setSendMode] = useState('all'); // 'user', 'class', 'student', 'teacher', 'all'
  const [userIds, setUserIds] = useState('');
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [classOptions, setClassOptions] = useState<{label: string, value: string}[]>([]);
  const [selectedClass, setSelectedClass] = useState<{label: string, value: string} | null>(null);
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(false);

  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

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

  const handleCategoryClick = (category: string, section = selectedSection) => {
    setSelectedCategory(category);
    setSelectedSection(section);
    
    if (section === 'received') {
      // Fetch notifications for received section
      handler.fetchNotifications();
    } else {
      // For sent section, we use local state
      // No need to fetch from API
    }
  };

  const handleSelectNotification = (id: string) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter((item: string) => item !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const handleViewNotification = (notification: any) => {
    // If we're already composing, save the current draft before viewing
    if (isComposing && editingDraft.id) {
      handleSaveDraftChanges();
    }
    
    setSelectedNotification(notification);
    setIsComposing(false);
    
    if (selectedSection === 'received' && !notification.readStatus) {
      handler.markAsRead(notification.id);
    }
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
    if (selectedSection === 'received') {
      handler.fetchNotifications();
    }
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
    
    // Reset send mode to default
    setSendMode('all');
    setUserIds('');
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

  const handleSendMessage = () => {
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
    
    // Only send if essential fields are filled
    if (!receiver || !message) return;
    
    // Create a sent message copy for the sent folder
    const sentMessage = {
      id: `sent-${Date.now()}`,
      receiver,
      message,
      sendDate: new Date().toISOString(),
      readStatus: true,
      senderInfo: { FullName: 'Me' },
      isSent: true
    };
    
    setSentMessages([sentMessage, ...sentMessages]);
    
    // Send the notification through the API
    handler.createNotification(receiver, message);
    
    // Delete the draft if it was saved
    if (editingDraft.id && !editingDraft.isNew) {
      handleDeleteDraft(editingDraft.id);
    }
    
    // Reset state
    setSelectedNotification(sentMessage);
    setIsComposing(false);
    setEditingDraft({
      id: '',
      receiver: '',
      message: '',
      sendDate: '',
      isDraft: true,
      isNew: false
    });
    
    // Switch to sent section
    setSelectedSection('sent');
    setSelectedCategory('sent');
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
      return state.userMainData;
    } else if (selectedCategory === 'draft') {
      return draftMessages;
    } else {
      return sentMessages;
    }
  };

  const currentNotificationList = getCurrentNotificationList();
  
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
                {/* Received Notifications Section */}
                <ListItem>
                  <Typography variant="h6" className="sidebar-section-title">Received</Typography>
                </ListItem>
                <ListItemButton 
                  selected={selectedSection === 'received' && selectedCategory === 'all'}
                  onClick={() => handleCategoryClick('all', 'received')}
                >
                  <ListItemIcon>
                    <InboxIcon />
                  </ListItemIcon>
                  <ListItemText primary="All" />
                  <Badge badgeContent={state.totalItems} color="primary" />
                </ListItemButton>
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
                <ListItemButton 
                  selected={selectedSection === 'received' && selectedCategory === 'archive'}
                  onClick={() => handleCategoryClick('archive', 'received')}
                >
                  <ListItemIcon>
                    <ArchiveIcon />
                  </ListItemIcon>
                  <ListItemText primary="Archive" />
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
                  <Badge badgeContent={sentMessages.length} color="primary" />
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
                          {notification.isSent && (
                            <SendIcon color="primary" fontSize="small" className="sent-icon" />
                          )}
                          {selectedSection === 'received' && !notification.readStatus && (
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
                                  : notification.isSent 
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
                            {notification.isSent && (
                              <Chip size="small" label="Sent" color="success" className="sent-chip" />
                            )}
                            {selectedSection === 'received' && !notification.readStatus && (
                              <Chip size="small" label="New" color="primary" className="new-chip" />
                            )}
                          </Box>
                          <Typography 
                            variant="body2" 
                            className="notification-message"
                          >
                            {notification.isDraft 
                              ? `To: ${getReceiverDisplay(notification.receiver)} - ${getNotificationPreview(notification.message || '(No content)')}` 
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
          {selectedNotification && (
            <Box sx={{ width: { xs: '100%', md: '50%', lg: '55%' } }} className="notify-detail-container">
              <Paper elevation={2} className="notify-detail">
                <Box className="detail-header">
                  <Box className="header-left">
                    <Typography variant="h6" className="detail-subject">
                      {isComposing 
                        ? 'New Notification'
                        : selectedNotification.isDraft 
                          ? `Draft: ${selectedNotification.subject || '(No subject)'}`
                          : selectedNotification.isSent
                            ? `Sent: ${selectedNotification.subject || '(No subject)'}`
                            : `Message from ${selectedNotification.senderInfo?.FullName || `User ${selectedNotification.sender}`}`
                      }
                    </Typography>
                  </Box>
                  <Box className="header-right">
                    {selectedNotification.isDraft && !isComposing && (
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
                  // Enhanced Compose Interface with Multiple Receiver Options
                  <Box className="compose-content">
                    {/* Send Mode Selection */}
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>Send to:</Typography>
                      <RadioGroup 
                        row 
                        value={sendMode} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendMode(e.target.value)}
                      >
                        <FormControlLabel 
                          value="user" 
                          control={<Radio />} 
                          label={<Box sx={{ display: 'flex', alignItems: 'center' }}><PersonIcon fontSize="small" sx={{ mr: 0.5 }} />User</Box>} 
                        />
                        <FormControlLabel 
                          value="class" 
                          control={<Radio />} 
                          label={<Box sx={{ display: 'flex', alignItems: 'center' }}><SchoolIcon fontSize="small" sx={{ mr: 0.5 }} />Class</Box>} 
                        />
                        <FormControlLabel 
                          value="student" 
                          control={<Radio />} 
                          label={<Box sx={{ display: 'flex', alignItems: 'center' }}><FaceIcon fontSize="small" sx={{ mr: 0.5 }} />All Students</Box>} 
                        />
                        <FormControlLabel 
                          value="teacher" 
                          control={<Radio />} 
                          label={<Box sx={{ display: 'flex', alignItems: 'center' }}><TeacherIcon fontSize="small" sx={{ mr: 0.5 }} />All Teachers</Box>} 
                        />
                        <FormControlLabel 
                          value="all" 
                          control={<Radio />} 
                          label={<Box sx={{ display: 'flex', alignItems: 'center' }}><GroupIcon fontSize="small" sx={{ mr: 0.5 }} />All Users</Box>} 
                        />
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserIds(e.target.value)}
                        placeholder="E.g. user1, user2, user3"
                        helperText="Enter multiple user IDs separated by commas"
                      />
                    )}
                    
                    {sendMode === 'class' && (
                      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel>Academic Year</InputLabel>
                          <Select
                            value={selectedAcademicYear}
                            label="Academic Year"
                            onChange={(e: SelectChangeEvent) => setSelectedAcademicYear(e.target.value)}
                          >
                            {academicYears.map((year: string) => (
                              <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel>Class</InputLabel>
                          <Select
                            label="Class"
                            value={selectedClass?.value || ''}
                            onChange={(e: SelectChangeEvent) => {
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
                    />
                    
                    <Box className="compose-actions">
                      <Button 
                        onClick={handleSendMessage} 
                        variant="contained" 
                        color="primary"
                        startIcon={<SendIcon />}
                        disabled={
                          (sendMode === 'user' && !userIds) ||
                          (sendMode === 'class' && !selectedClass) ||
                          !messageRef.current?.value
                        }
                      >
                        Send
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  // View Message Interface
                  <Box className="detail-content">
                    <Box className="detail-info">
                      <Box className="sender-info">
                        <Avatar className="sender-avatar">
                          {selectedNotification.isDraft 
                            ? 'D'
                            : selectedNotification.isSent
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
                              : selectedNotification.isSent
                                ? 'Sent by you'
                                : selectedNotification.senderInfo?.FullName || `User ${selectedNotification.sender}`
                            }
                          </Typography>
                          <Typography variant="body2" className="send-to">
                            To: {getReceiverDisplay(selectedNotification.receiver)}
                          </Typography>
                          <Box className="time-info">
                            <AccessTimeIcon fontSize="small" />
                            <Typography variant="body2">
                              {selectedNotification.isDraft 
                                ? `Saved on ${formatDate(selectedNotification.sendDate)} at ${formatTime(selectedNotification.sendDate)}`
                                : selectedNotification.isSent
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
    </LayoutComponent>
  );
}

export default NotifyPage;
