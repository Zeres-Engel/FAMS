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

function ProfilePage(): React.JSX.Element {
  const {
    state: { profileData, isEditing },
    handler: { toggleEdit, setProfileData },
  } = useProfilePageHook();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const renderField = (
    label: string,
    key: keyof typeof profileData,
    editable = true
  ) => {
    const value = profileData[key];

    const renderValue = () => {
      if (Array.isArray(value)) {
        return value.join(", ");
      }

      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value); 
      }

      return value ?? "";
    };

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
          {isEditing && editable && typeof value === "string" ? (
            <TextField
              fullWidth
              size="small"
              name={key}
              value={value}
              onChange={handleChange}
            />
          ) : (
            <Typography>{renderValue()}</Typography>
          )}
        </Box>
      </Box>
    );
  };

  const renderRoleFields = () => {
    const role = profileData.role ?? "admin";

    const baseFields: (keyof typeof profileData)[] = [
      "username",
      "fullName",
      "dob",
      "gender",
      "address",
      "phone",
    ];

    // Dành riêng cho giáo viên
    const teacherFields: React.JSX.Element[] =
      role === "teacher"
        ? [
          renderField("Degree", "degree"),
            <Box key="skills">
              <Typography fontWeight={600}>Skills:</Typography>
              {isEditing ? (
                <TextField
                  fullWidth
                  size="small"
                  name="skills"
                  value={profileData.skills?.join(", ") ?? ""}
                  onChange={e =>
                    setProfileData({
                      ...profileData,
                      skills: e.target.value.split(",").map(s => s.trim()),
                    })
                  }
                  placeholder="Enter skills, separated by commas"
                />
              ) : (
                <Typography>
                  {profileData.skills?.length
                    ? profileData.skills.join(", ")
                    : "No skills listed"}
                </Typography>
              )}
            </Box>,
            <Box key="teachingClasses">
              <Typography fontWeight={600}>Teaching Classes:</Typography>
              <ul>
                {profileData.teachingClasses?.map((cls, idx) => (
                  <li key={idx}>{cls}</li>
                ))}
              </ul>
            </Box>,
          ]
        : [];

    const studentFields: React.JSX.Element[] =
      role === "student"
        ? [
            renderField("Class ID", "classId", role !== "student"),
            renderField("Batch", "batch", role !== "student"),

            <Box key="parents">
              <Typography fontWeight={600} mb={1}>
                Parents:
              </Typography>
              <Box
                display="grid"
                gridTemplateColumns={isMobile ? "1fr" : "1fr 1fr"}
                gap={2}
              >
                {profileData.parents?.map((parent, idx) => (
                  <Box
                    key={idx}
                    p={2}
                    border="1px solid #ccc"
                    borderRadius={2}
                    bgcolor="#f9f9f9"
                  >
                    <Typography>
                      <strong>Name:</strong> {parent.name}
                    </Typography>
                    <Typography>
                      <strong>Gender:</strong> {parent.gender}
                    </Typography>
                    <Typography>
                      <strong>Job:</strong> {parent.job}
                    </Typography>
                    <Typography>
                      <strong>Phone:</strong> {parent.phone}
                    </Typography>
                    <Typography>
                      <strong>Email:</strong> {parent.email}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>,
          ]
        : [];

    return (
      <>
        {baseFields.map(field => renderField(capitalize(field), field))}
        {teacherFields}
        {studentFields}
      </>
    );
  };

  const capitalize = (key: string) =>
    key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");

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
            {profileData.batch && (
              <Typography color="textSecondary">
                Batch: {profileData.batch}
              </Typography>
            )}
            {profileData.classId && (
              <Typography color="textSecondary">
                Class: {profileData.classId}
              </Typography>
            )}
          </Box>

          {/* RIGHT PANEL */}
          <Box
            flex={3}
            sx={{
              minWidth: isMobile ? "100%" : 650, // tăng từ 500 -> 650
              maxWidth: "800px", // optional: giới hạn tối đa
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
              {renderRoleFields()}

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
