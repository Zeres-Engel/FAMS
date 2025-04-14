import React from "react";
import {
  Box,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Autocomplete,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import LayoutComponent from "../../components/Layout/Layout";
import useIdentifyManagementHook from "./useIdentifyManagementHook";

function IdentifyManagementPage(): React.JSX.Element {
  const {
    state: {
      users,
      selectedUser,
      role,
      isVideoLoading,
      isVideoValid,
      rfid,
      videoRef,
      videoMessage,
      countdown,
    },
    handler: {
      handleRoleChange,
      handleUserChange,
      handleRFIDChange,
      handleStartVideo,
    },
    rfidInputRef,
  } = useIdentifyManagementHook();

  return (
    <LayoutComponent pageHeader="Identify Management Page">
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        gap={4}
        p={2}
      >
        {/* Left Side */}
        <Box flex={1} display="flex" flexDirection="column" gap={2}>
          <Box display="flex" gap={2}>
            <Autocomplete
              options={users}
              getOptionLabel={(option) => option.userName || ""}
              onChange={(e, value) => handleUserChange(value)}
              renderInput={(params) => (
                <TextField {...params} label="Search user" fullWidth />
              )}
              sx={{ flex: 1 }}
            />
            <RadioGroup
              row
              value={role}
              onChange={handleRoleChange}
              sx={{ alignItems: "center" }}
            >
              <FormControlLabel
                value="teacher"
                control={<Radio />}
                label="Teacher"
              />
              <FormControlLabel
                value="student"
                control={<Radio />}
                label="Student"
              />
            </RadioGroup>
          </Box>

          {selectedUser && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">User Profile</Typography>
                <Typography>User Name: {selectedUser.userName}</Typography>
                <Typography>User ID: {selectedUser.id}</Typography>
                <Typography>Phone: {selectedUser.phone}</Typography>
              </CardContent>
            </Card>
          )}

          <TextField
            inputRef={rfidInputRef}
            label="RFID"
            value={rfid}
            onChange={handleRFIDChange}
            fullWidth
          />
        </Box>

        {/* Right Side */}
        <Box flex={1} display="flex" flexDirection="column" gap={2}>
          <Box
            sx={{
              width: "100%",
              aspectRatio: "16/9",
              border: "1px solid #ccc",
              borderRadius: 2,
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {(isVideoLoading || countdown !== null) && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                sx={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                {countdown !== null ? (
                  <Typography
                    variant="h3"
                    color="white"
                    fontWeight="bold"
                  >
                    {countdown === 0 ? "🎥 Bắt đầu quay!" : countdown}
                  </Typography>
                ) : (
                  <CircularProgress color="inherit" />
                )}
              </Box>
            )}
          </Box>

          {videoMessage && (
            <Typography
              variant="body1"
              color={videoMessage.includes("❌") ? "error" : "success.main"}
              sx={{ mt: 2 }}
            >
              {videoMessage}
            </Typography>
          )}

          <Button
            variant="contained"
            onClick={handleStartVideo}
            disabled={!selectedUser || isVideoLoading || countdown !== null}
          >
            Start 10s Video
          </Button>

          {isVideoValid === false && (
            <Typography color="error">
              ❌ Video is not valid. Please try again.
            </Typography>
          )}
        </Box>
      </Box>
    </LayoutComponent>
  );
}

export default IdentifyManagementPage;
