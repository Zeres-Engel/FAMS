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
  MenuItem,
} from "@mui/material";
import LayoutComponent from "../../components/Layout/Layout";
import useIdentifyManagementHook from "./useIdentifyManagementHook";
import NewSemesterManagement from "../../components/NewSemesterManagement/NewSemesterManagement";

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
      selectedDevice,
      fileToSend,
      initUserFile,
      selectedBatchYear,
      batchYears,
    },
    handler: {
      handleRoleChange,
      handleUserChange,
      handleRFIDChange,
      handleStartVideo,
      handleSearchInputChange,
      handleDeviceChange,
      handleFileChange,
      handleSendToDevice,
      handleInitFileChange,
      handleInitUserSubmit,
      handleBatchYearChange,
    },
    rfidInputRef,
  } = useIdentifyManagementHook();

  return (
    <LayoutComponent pageHeader="System Management Page">
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        gap={4}
        p={2}
        flexWrap="wrap"
      >
        {/* Left Side */}
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          gap={2}
          minWidth={300}
        >
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            gap={2}
          >
            <Autocomplete
              options={users}
              getOptionLabel={option => option.userName || ""}
              onChange={(e, value) => handleUserChange(value)}
              onInputChange={(event, value) =>
                handleSearchInputChange(event, value)
              }
              renderInput={params => (
                <TextField {...params} label="Search user" fullWidth />
              )}
              sx={{ flex: 1 }}
            />
            <RadioGroup
              row
              value={role}
              onChange={handleRoleChange}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
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

          {/* Upload file section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Upload File to Device
            </Typography>

            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              gap={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <TextField
                select
                label="Device Type"
                value={selectedDevice}
                onChange={handleDeviceChange}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Select device</MenuItem>
                <MenuItem value="camera">Camera</MenuItem>
                <MenuItem value="rfid">RFID Reader</MenuItem>
                <MenuItem value="face">Face Scanner</MenuItem>
              </TextField>

              <Button variant="outlined" component="label">
                Choose File
                <input
                  type="file"
                  accept="video/*,image/*"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>

              {fileToSend && (
                <Typography
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 150,
                  }}
                >
                  {fileToSend.name}
                </Typography>
              )}

              <Button
                variant="contained"
                onClick={handleSendToDevice}
                disabled={!selectedDevice || !fileToSend}
              >
                Send
              </Button>
            </Box>
          </Box>
          {/* Init New User Data section */}
          <Box mt={4}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Init New User Data
            </Typography>

            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              gap={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              flexWrap="wrap"
            >
              <TextField
                select
                label="Batch Year"
                value={selectedBatchYear}
                onChange={handleBatchYearChange}
                sx={{ minWidth: 200 }}
              >
                {batchYears.map(year => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </TextField>

              <Button variant="outlined" component="label">
                Choose File
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  hidden
                  onChange={handleInitFileChange}
                />
              </Button>

              {initUserFile && (
                <Typography
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 150,
                  }}
                >
                  {initUserFile.name}
                </Typography>
              )}

              <Button
                variant="contained"
                onClick={handleInitUserSubmit}
                disabled={!initUserFile || !selectedBatchYear}
              >
                Submit
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Right Side */}
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          gap={2}
          minWidth={300}
        >
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
                  <Typography variant="h3" color="white" fontWeight="bold">
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
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        mt={{ xs: 2, md: 4 }}
        mb={{ xs: 2, md: 4 }}
        px={2}
      >
        <Typography variant="h5" fontWeight="bold" textAlign="center">
          Semester Transition Management Section
        </Typography>
      </Box>

      <NewSemesterManagement />
    </LayoutComponent>
  );
}

export default IdentifyManagementPage;
