import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React from "react";
import useProfilePageHook from "./useProfilePageHook";
import LayoutComponent from "../../components/Layout/Layout";
// import "./ProfilePage.scss";
function ProfilePage(): React.JSX.Element {
  const {
    state: { profileData, isEditing },
    handler: { toggleEdit, setProfileData },
  } = useProfilePageHook();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profileData) return;
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

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
          alignItems="center"
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
            <Typography color="textSecondary">ID: {profileData.id}</Typography>
            <Typography color="textSecondary">
              Batch: {profileData.batch}
            </Typography>
            <Typography color="textSecondary">
              Class: {profileData.classId}
            </Typography>
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
            <Box
              component="form"
              display="flex"
              flexDirection="column"
              gap={2}
              sx={{ width: "100%" }}
            >
              {[
                { label: "User ID", key: "id" },
                { label: "Username", key: "username" },
                { label: "Full name", key: "fullName" },
                { label: "Date Of Birth", key: "dob" },
                { label: "Gender", key: "gender" },
                { label: "Class ID", key: "classId" },
                { label: "Address", key: "address" },
                { label: "Phone", key: "phone" },
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
                    {isEditing ? (
                      <TextField
                        fullWidth
                        size="small"
                        name={key}
                        value={profileData[key as keyof typeof profileData]}
                        onChange={handleChange}
                      />
                    ) : (
                      <Typography>
                        {profileData[key as keyof typeof profileData]}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}

              <Box textAlign="right" mt={2}>
                <Button variant="contained" onClick={toggleEdit}>
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
