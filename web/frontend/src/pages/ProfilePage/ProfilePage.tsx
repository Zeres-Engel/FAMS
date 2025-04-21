import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Chip,
  Divider,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import React, { useRef, useState } from "react";
import useProfilePageHook from "./useProfilePageHook";
import LayoutComponent from "../../components/Layout/Layout";
import "./ProfilePage.scss";
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

function ProfilePage(): React.JSX.Element {
  const {
    state: { profileData, isEditing, loading, error },
    handler: { toggleEdit, setProfileData, updateProfile, uploadAvatar },
  } = useProfilePageHook();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profileData) return;
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  // Handle avatar change
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    console.log("Selected file:", file.name, file.type, file.size);
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus({
        success: false,
        message: "File size is too large. Maximum size is 5MB."
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadStatus({
        success: false,
        message: "Only image files are allowed."
      });
      return;
    }
    
    try {
      // Set loading status
      setUploadStatus({
        success: true,
        message: "Uploading your avatar..."
      });
      
      console.log("Starting avatar upload");
      
      // Upload avatar
      const result = await uploadAvatar(file);
      console.log("Upload result:", result);
      
      // Update status - ensure message property exists
      setUploadStatus({
        success: result.success,
        message: result.message || (result.success ? "Avatar uploaded successfully" : "Failed to upload avatar")
      });
      
      // Refresh profile data if successful
      if (result.success) {
        console.log("Avatar uploaded successfully", result.data?.avatarUrl ? `- URL: ${result.data.avatarUrl}` : '');
        
        // If the response includes a new avatar URL, update the profile data
        if (result.data?.avatarUrl) {
          setProfileData({
            ...profileData,
            avatarUrl: result.data.avatarUrl
          });
        }
      } else {
        console.error("Avatar upload failed:", result.message);
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      setUploadStatus({
        success: false,
        message: error.message || "Failed to upload avatar"
      });
    } finally {
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Click avatar to trigger file input
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Helper function to safely render field values
  const renderFieldValue = (key: keyof typeof profileData): React.ReactNode => {
    const value = profileData[key];
    
    // Handle undefined/null
    if (value === undefined || value === null) {
      return "N/A";
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return "Multiple items";
    }
    
    // Handle objects
    if (typeof value === 'object') {
      return "Object data";
    }
    
    // Default: return the value as string
    return String(value) || "N/A";
  };

  // Handle save or edit button click
  const handleEditOrSave = () => {
    if (isEditing) {
      // If currently editing, save changes
      updateProfile();
    } else {
      // If not editing, switch to edit mode
      toggleEdit();
    }
  };

  if (loading) {
    return (
      <LayoutComponent pageHeader="Profile Information">
        <Container
          sx={{
            minHeight: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Container>
      </LayoutComponent>
    );
  }

  if (error) {
    return (
      <LayoutComponent pageHeader="Profile Information">
        <Container
          sx={{
            minHeight: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Alert severity="error">{error}</Alert>
        </Container>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent pageHeader="Profile Information">
      <Container
        maxWidth="lg"
        sx={{
          minHeight: "80vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          display="flex"
          flexDirection={isMobile ? "column" : "row"}
          gap={4}
          width="100%"
          justifyContent="center"
          alignItems="flex-start"
        >
          {/* LEFT PANEL */}
          <Box
            flex={1}
            sx={{
              minWidth: isMobile ? "100%" : 300,
              bgcolor: "#fff",
              borderRadius: 4,
              boxShadow: 3,
              p: 4,
              textAlign: "center",
            }}
          >
            {/* Avatar with upload button overlay */}
            <Box
              sx={{
                width: isMobile ? 120 : 160,
                height: isMobile ? 120 : 160,
                borderRadius: "50%",
                overflow: "hidden",
                mx: "auto",
                mb: 2,
                position: "relative",
                "&:hover .avatar-overlay": {
                  opacity: 1,
                },
                cursor: "pointer",
              }}
              onClick={handleAvatarClick}
            >
              <img
                src={profileData.avatarUrl}
                alt="User Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <Box
                className="avatar-overlay"
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  opacity: 0,
                  transition: "opacity 0.3s",
                }}
              >
                <Tooltip title="Upload new avatar">
                  <IconButton color="primary" aria-label="upload picture" component="span" sx={{ color: "white" }}>
                    <PhotoCameraIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </Box>
            
            {/* Small instruction */}
            <Typography 
              variant="caption" 
              color="textSecondary" 
              sx={{ display: 'block', mb: 2 }}
            >
              Click on the avatar to upload a new photo
            </Typography>
            
            {/* Display upload status message if any */}
            {uploadStatus && (
              <Alert 
                severity={uploadStatus.success ? "success" : "error"} 
                sx={{ mb: 2 }}
                onClose={() => setUploadStatus(null)}
              >
                {uploadStatus.message}
              </Alert>
            )}
            
            <Typography variant="h6">{profileData.fullName}</Typography>
            <Typography color="textSecondary">ID: {profileData.userId}</Typography>
            
            {/* Display role separately from the role chip to avoid nesting issues */}
            <Box display="flex" alignItems="center" gap={1} my={1}>
              <Typography color="textSecondary">Role:</Typography>
              <Chip size="small" color="primary" label={profileData.role} />
            </Box>
            
            {/* Class display for teachers */}
            {profileData.role === "teacher" && profileData.classesList && profileData.classesList.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>Classes</Typography>
                <Box 
                  sx={{
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1, 
                    justifyContent: 'center',
                    flexDirection: 'row'
                  }}
                >
                  {profileData.classesList.map((cls: {classId: number, className: string, grade: string}) => (
                    <Chip 
                      key={cls.classId}
                      size="small"
                      label={cls.className}
                      color="info"
                      variant="outlined"
                      sx={{ minWidth: '60px' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Class display for students */}
            {profileData.role === "student" && profileData.className && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>Class</Typography>
                <Chip 
                  size="small"
                  label={profileData.className}
                  color="info"
                  variant="outlined"
                  sx={{ minWidth: '60px' }}
                />
              </Box>
            )}
          </Box>

          {/* RIGHT PANEL */}
          <Box
            flex={2}
            sx={{
              minWidth: isMobile ? "100%" : 500,
              bgcolor: "#fff",
              borderRadius: 4,
              boxShadow: 3,
              p: 4,
            }}
          >
            <Typography variant="h6" gutterBottom>Personal Information</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box
              component="form"
              display="flex"
              flexDirection="column"
              gap={2}
              sx={{ width: "100%" }}
            >
              {[
                { label: "User ID", key: "userId" },
                { label: "Full name", key: "fullName" },
                { label: "Email", key: "email" },
                { label: "Date Of Birth", key: "dateOfBirth" },
                { label: "Gender", key: "gender" },
                { label: "Address", key: "address" },
                { label: "Phone", key: "phone" },
              ].map(({ label, key }) => {
                if (key === 'classes') return null;
                
                return (
                  <Box
                    key={key}
                    display="flex"
                    flexDirection={isMobile ? "column" : "row"}
                    gap={2}
                    alignItems={isMobile ? "flex-start" : "center"}
                  >
                    <Box minWidth={isMobile ? "auto" : 120}>
                      <Typography fontWeight={600}>{label}:</Typography>
                    </Box>
                    <Box flex={1}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size="small"
                          name={key}
                          value={String(profileData[key as keyof typeof profileData] || "")}
                          onChange={handleChange}
                        />
                      ) : (
                        <Typography>
                          {renderFieldValue(key as keyof typeof profileData)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}

              {/* Show additional teacher fields */}
              {profileData.role === "teacher" && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Professional Information</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {[
                    { label: "Major", key: "major" },
                    { label: "Degree", key: "degree" },
                  ].map(({ label, key }) => {
                    if (Array.isArray(profileData[key as keyof typeof profileData])) return null;
                    
                    return (
                      <Box
                        key={key}
                        display="flex"
                        flexDirection={isMobile ? "column" : "row"}
                        gap={2}
                        alignItems={isMobile ? "flex-start" : "center"}
                      >
                        <Box minWidth={isMobile ? "auto" : 120}>
                          <Typography fontWeight={600}>{label}:</Typography>
                        </Box>
                        <Box flex={1}>
                          {isEditing ? (
                            <TextField
                              fullWidth
                              size="small"
                              name={key}
                              value={String(profileData[key as keyof typeof profileData] || "")}
                              onChange={handleChange}
                            />
                          ) : (
                            <Typography>
                              {renderFieldValue(key as keyof typeof profileData)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </>
              )}

              {/* Show student specific information */}
              {profileData.role === "student" && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Academic Information</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {[
                    { label: "Class", key: "className" },
                    { label: "Grade", key: "grade" },
                    { label: "Academic Year", key: "academicYear" },
                  ].map(({ label, key }) => (
                    <Box
                      key={key}
                      display="flex"
                      flexDirection={isMobile ? "column" : "row"}
                      gap={2}
                      alignItems={isMobile ? "flex-start" : "center"}
                    >
                      <Box minWidth={isMobile ? "auto" : 120}>
                        <Typography fontWeight={600}>{label}:</Typography>
                      </Box>
                      <Box flex={1}>
                        <Typography>
                          {renderFieldValue(key as keyof typeof profileData)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  
                  {/* Show parents information */}
                  {profileData.parents && profileData.parents.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Parents Information</Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      {profileData.parents.map((parent: {
                        parentId: number;
                        fullName: string;
                        career: string;
                        phone: string;
                        gender: boolean;
                        dateOfBirth?: string;
                        address?: string;
                        email?: string;
                        userId?: string;
                      }, index: number) => (
                        <Box 
                          key={parent.parentId}
                          sx={{ 
                            mb: 2, 
                            p: 2, 
                            borderRadius: 2, 
                            bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent'
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Parent {index + 1}: {parent.fullName} {parent.userId && `(ID: ${parent.userId})`}
                          </Typography>
                          <Box 
                            display="grid" 
                            gridTemplateColumns={isMobile ? "1fr" : "1fr 1fr"} 
                            gap={2}
                          >
                            <Box display="flex" gap={1}>
                              <Typography fontWeight={600}>Career:</Typography>
                              <Typography>{parent.career}</Typography>
                            </Box>
                            <Box display="flex" gap={1}>
                              <Typography fontWeight={600}>Phone:</Typography>
                              <Typography>{parent.phone}</Typography>
                            </Box>
                            <Box display="flex" gap={1}>
                              <Typography fontWeight={600}>Gender:</Typography>
                              <Typography>{parent.gender ? "Male" : "Female"}</Typography>
                            </Box>
                            
                            {/* Show optional fields if available */}
                            {parent.dateOfBirth && (
                              <Box display="flex" gap={1}>
                                <Typography fontWeight={600}>Date of Birth:</Typography>
                                <Typography>{parent.dateOfBirth}</Typography>
                              </Box>
                            )}
                            
                            {parent.address && (
                              <Box display="flex" gap={1}>
                                <Typography fontWeight={600}>Address:</Typography>
                                <Typography>{parent.address}</Typography>
                              </Box>
                            )}
                            
                            {parent.email && (
                              <Box display="flex" gap={1}>
                                <Typography fontWeight={600}>Email:</Typography>
                                <Typography>{parent.email}</Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </>
                  )}
                </>
              )}

              <Box textAlign="right" mt={2}>
                <Button variant="contained" onClick={handleEditOrSave}>
                  {isEditing ? "Save" : "Edit"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </LayoutComponent>
  );
}

export default ProfilePage;
