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
} from "@mui/material";
import React from "react";
import useProfilePageHook from "./useProfilePageHook";
import LayoutComponent from "../../components/Layout/Layout";
import "./ProfilePage.scss";

function ProfilePage(): React.JSX.Element {
  const {
    state: { profileData, isEditing, loading, error },
    handler: { toggleEdit, setProfileData, updateProfile },
  } = useProfilePageHook();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profileData) return;
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
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
            <Box
              sx={{
                width: isMobile ? 120 : 160,
                height: isMobile ? 120 : 160,
                borderRadius: "50%",
                overflow: "hidden",
                mx: "auto",
                mb: 2,
              }}
            >
              <img
                src={profileData.avatarUrl}
                alt="User Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Typography variant="h6">{profileData.fullName}</Typography>
            <Typography color="textSecondary">ID: {profileData.userId}</Typography>
            <Typography color="textSecondary">
              Role: <Chip size="small" color="primary" label={profileData.role} />
            </Typography>
            
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
