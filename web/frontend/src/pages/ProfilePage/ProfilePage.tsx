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
            
            {/* Display role centered */}
            <Box display="flex" alignItems="center" justifyContent="center" gap={1} my={2}>
              <Chip 
                size="small" 
                color={profileData.role === "teacher" ? "secondary" : "primary"} 
                label={profileData.role} 
                sx={{ 
                  px: 2,
                  ...(profileData.role === "teacher" && {
                    backgroundColor: "#673ab7"
                  })
                }} 
              />
            </Box>
            
            {/* Class display for teachers */}
            {profileData.role === "teacher" && (
              <Box mt={2}>
                {/* Current classes the teacher is teaching */}
                {profileData.classesList && profileData.classesList.length > 0 && (
                  <>
                    <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
                      Teaching Classes
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                      {profileData.classesList
                        .filter((cls: any) => cls.academicYear === "2024-2025" || 
                                             (cls.academicYear && profileData.classesByYear && 
                                              Object.keys(profileData.classesByYear || {}).length > 0 && 
                                              cls.academicYear === Object.keys(profileData.classesByYear || {})
                                                .sort((a, b) => b.localeCompare(a))[0]))
                        .map((cls: any) => (
                          <Chip
                            key={cls.classId}
                            size="small"
                            label={cls.className}
                            color={cls.isHomeroom ? "secondary" : "default"}
                            variant="outlined"
                            sx={{ 
                              minWidth: '60px',
                              borderColor: cls.isHomeroom ? 'secondary.main' : '#673ab7',
                              color: '#673ab7'
                            }}
                          />
                        ))}
                    </Box>
                  </>
                )}
                
                {profileData.classesList && profileData.classesList.some((cls: {
                  classId: number;
                  className: string;
                  grade: number | string;
                  academicYear?: string;
                  isHomeroom?: boolean;
                }) => cls.isHomeroom) && (
                  <Chip 
                    size="small"
                    label="Homeroom Teacher"
                    color="secondary"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            )}
            
            {/* Class display for students */}
            {profileData.role === "student" && profileData.className && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
                  Class
                </Typography>
                <Box display="flex" justifyContent="center">
                  <Chip 
                    size="small"
                    label={`${profileData.className}`}
                    color="info"
                    variant="outlined"
                    sx={{ minWidth: '60px', px: 1 }}
                  />
                </Box>
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
                ...(profileData.role !== "admin" ? [
                  { label: "Date Of Birth", key: "dateOfBirth" },
                  { label: "Gender", key: "gender" },
                  { label: "Address", key: "address" },
                  { label: "Phone", key: "phone" },
                ] : [])
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
                  
                  <Box 
                    display="flex"
                    flexDirection="column"
                    gap={2}
                    mb={3}
                  >
                    <Box display="flex" flexDirection="row" gap={1}>
                      <Typography fontWeight={600} minWidth={120}>Skills:</Typography>
                      <Typography>{profileData.major || 'N/A'}</Typography>
                    </Box>
                    
                    <Box display="flex" flexDirection="row" gap={1}>
                      <Typography fontWeight={600} minWidth={120}>Degree:</Typography>
                      <Typography>{profileData.degree || 'N/A'}</Typography>
                    </Box>
                    
                    <Box display="flex" flexDirection="row" gap={1}>
                      <Typography fontWeight={600} minWidth={120}>Weekly Capacity:</Typography>
                      <Typography>{profileData.weeklyCapacity || 'N/A'} hours</Typography>
                    </Box>
                  </Box>
                  
                  {/* Teaching classes by academic year */}
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Teaching Classes</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Display current class prominently - similar to student design */}
                  {profileData.classesList && profileData.classesList.length > 0 && 
                   profileData.academicYear && (
                    <Box
                      sx={{ 
                        mb: 3, 
                        bgcolor: "rgba(103, 58, 183, 0.05)", 
                        p: 2, 
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ color: "#673ab7" }}>
                        Current Classes (Academic Year: {profileData.classesByYear ? Object.keys(profileData.classesByYear || {}).sort((a, b) => b.localeCompare(a))[0] : '2024-2025'})
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Reorganize classes in up to 3 rows with normal layout */}
                        {[...Array(3)].map((_, rowIndex) => {
                          const rowClasses = profileData.classesList
                            ?.filter((cls: any) => 
                              cls.academicYear === "2024-2025" || 
                              (cls.academicYear && profileData.classesByYear && 
                              Object.keys(profileData.classesByYear || {}).length > 0 && 
                              cls.academicYear === Object.keys(profileData.classesByYear || {})
                                .sort((a, b) => b.localeCompare(a))[0]))
                            ?.slice(rowIndex * 3, rowIndex * 3 + 3);
                          
                          if (!rowClasses || rowClasses.length === 0) return null;
                          
                          return (
                            <Box 
                              key={`row-${rowIndex}`} 
                              sx={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: 1 
                              }}
                            >
                              {rowClasses.map((cls: any) => (
                                <Chip
                                  key={cls.classId}
                                  size="small"
                                  label={`${cls.className} (Grade ${cls.grade})`}
                                  color={cls.isHomeroom ? "secondary" : "default"}
                                  variant={cls.isHomeroom ? "filled" : "outlined"}
                                  sx={{ 
                                    minWidth: '60px',
                                    fontWeight: cls.isHomeroom ? 600 : 400,
                                    borderColor: '#673ab7',
                                    color: cls.isHomeroom ? undefined : '#673ab7'
                                  }}
                                />
                              ))}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Homeroom classes section - shows only if any homeroom classes exist */}
                  {profileData.classesList && profileData.classesList.some((cls: {
                    classId: number;
                    className: string;
                    grade: number | string;
                    academicYear?: string;
                    isHomeroom?: boolean;
                  }) => cls.isHomeroom) && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 3, color: "#673ab7" }}>Homeroom Teacher For</Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 1 
                        }}
                      >
                        {profileData.classesList
                          .filter((cls: {
                            classId: number;
                            className: string;
                            grade: number | string;
                            academicYear?: string;
                            isHomeroom?: boolean;
                          }) => cls.isHomeroom)
                          .sort((a, b) => b.academicYear?.localeCompare(a.academicYear || '') || 0)
                          .map(cls => (
                            <Box 
                              key={`homeroom-${cls.classId}`}
                              sx={{
                                backgroundColor: '#673ab7',
                                color: 'white',
                                px: 2,
                                py: 1,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                m: 0.5
                              }}
                            >
                              <Typography fontWeight={600}>
                                {cls.className} (Grade {cls.grade})
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  ml: 1,
                                  opacity: 0.8
                                }}
                              >
                                {cls.academicYear}
                              </Typography>
                            </Box>
                          ))
                        }
                      </Box>
                    </>
                  )}

                  {/* Show Class History similar to student page */}
                  {profileData.classesByYear && Object.keys(profileData.classesByYear).length > 0 && (
                    <Box mb={3}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Class History
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {Object.entries(profileData.classesByYear)
                          .sort(([yearA], [yearB]) => yearB.localeCompare(yearA)) // Sort by year descending
                          .slice(0, 3) // Show top 3 years
                          .map(([academicYear, classes]: [string, any]) => {
                            // Get unique class+grade combinations for this year
                            const uniqueClasses = Array.from(new Set(
                              classes.map((c: any) => `${c.className} (Grade ${c.grade})`)
                            )).slice(0, 3) as string[]; // Show top 3 classes
                            
                            return (
                              <Box 
                                key={academicYear}
                                sx={{ 
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  p: 1,
                                  borderLeft: '3px solid',
                                  borderColor: academicYear === profileData.academicYear ? '#673ab7' : 'grey.300',
                                  bgcolor: academicYear === profileData.academicYear ? 'rgba(103, 58, 183, 0.05)' : 'transparent',
                                  pl: 2
                                }}
                              >
                                <Box>
                                  {uniqueClasses.map((className: string, i: number) => (
                                    <Typography key={i} variant="body2">
                                      {className}
                                    </Typography>
                                  ))}
                                  {classes.length > 3 && (
                                    <Typography variant="caption" color="text.secondary">
                                      +{classes.length - 3} more classes
                                    </Typography>
                                  )}
                                </Box>
                                <Typography color="text.secondary">
                                  {academicYear}
                                </Typography>
                              </Box>
                            );
                          })
                        }
                        {Object.keys(profileData.classesByYear || {}).length > 3 && (
                          <Typography variant="caption" color="text.secondary" align="center">
                            +{Object.keys(profileData.classesByYear || {}).length - 3} more academic years
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </>
              )}

              {/* Show student specific information */}
              {profileData.role === "student" && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Academic Information</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Display current class prominently */}
                  <Box
                    display="flex"
                    flexDirection={isMobile ? "column" : "row"}
                    gap={2}
                    alignItems={isMobile ? "flex-start" : "center"}
                    mb={3}
                    sx={{ bgcolor: "rgba(25, 118, 210, 0.05)", p: 2, borderRadius: 2 }}
                  >
                    <Box minWidth={isMobile ? "auto" : 120}>
                      <Typography fontWeight={600}>Current Class:</Typography>
                    </Box>
                    <Box flex={1}>
                      <Typography variant="body1" fontWeight={500} color="primary">
                        {profileData.className} {profileData.grade && `(Grade ${profileData.grade})`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Academic Year: {profileData.academicYear || "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Class history */}
                  {profileData.classesList && profileData.classesList.length > 0 && (
                    <Box mb={3}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>Class History</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {[...profileData.classesList]
                          .sort((a, b) => b.academicYear?.localeCompare(a.academicYear || '') || 0)
                          .map((cls: {
                            classId: number;
                            className: string;
                            grade: number | string;
                            academicYear?: string;
                          }, index, array) => (
                            <Box 
                              key={cls.classId} 
                              sx={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                p: 1,
                                borderLeft: '3px solid',
                                borderColor: index === 0 ? 'primary.main' : 'grey.300',
                                bgcolor: index === 0 ? 'rgba(25, 118, 210, 0.05)' : 'transparent',
                                pl: 2
                              }}
                            >
                              <Typography>
                                {cls.className} (Grade {cls.grade})
                              </Typography>
                              <Typography color="text.secondary">
                                {cls.academicYear}
                              </Typography>
                            </Box>
                          ))}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Parents information */}
                  {profileData.parents && profileData.parents.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Parent Information</Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      {profileData.parents.map((parent, index) => (
                        <Box key={parent.parentId || index} mb={2}>
                          <Typography variant="subtitle2" fontWeight={600} color="primary">
                            {parent.relationship || `Parent ${index + 1}`}: {parent.fullName}
                          </Typography>
                          
                          <Box ml={2} mt={1}>
                            <Box display="flex" flexDirection="row" gap={1} mb={1}>
                              <Typography fontWeight={600} minWidth={70}>Career:</Typography>
                              <Typography>{parent.career || 'N/A'}</Typography>
                            </Box>
                            
                            <Box display="flex" flexDirection="row" gap={1} mb={1}>
                              <Typography fontWeight={600} minWidth={70}>Phone:</Typography>
                              <Typography>{parent.phone || 'N/A'}</Typography>
                            </Box>
                            
                            <Box display="flex" flexDirection="row" gap={1} mb={1}>
                              <Typography fontWeight={600} minWidth={70}>Email:</Typography>
                              <Typography>{parent.email || 'N/A'}</Typography>
                            </Box>
                            
                            <Box display="flex" flexDirection="row" gap={1}>
                              <Typography fontWeight={600} minWidth={70}>Gender:</Typography>
                              <Typography>{typeof parent.gender === 'boolean' ? (parent.gender ? 'Male' : 'Female') : parent.gender || 'N/A'}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </>
                  )}
                </>
              )}

              {profileData.role !== "admin" && (
                <Box textAlign="right" mt={2}>
                  <Button variant="contained" onClick={handleEditOrSave}>
                    {isEditing ? "Save" : "Edit"}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </LayoutComponent>
  );
}

export default ProfilePage;
