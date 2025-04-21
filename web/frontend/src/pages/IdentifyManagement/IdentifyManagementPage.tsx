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
import DataTable from "../../components/DataTable/DataTable";

function IdentifyManagementPage(): React.JSX.Element {
  const {
    state: {
      users,
      selectedUser,
      role,
      rfid,
      selectedDevice,
      fileToSend,
      headCellsData,
      userMainData,
      tableTitle,
    },
    handler: {
      handleRoleChange,
      handleUserChange,
      handleRFIDChange,
      handleSearchInputChange,
      handleDeviceChange,
      handleFileChange,
      handleSendToDevice,
    },
    rfidInputRef,
  } = useIdentifyManagementHook();

  return (
    <LayoutComponent pageHeader="System Management Page">
      <Box
        display="flex"
        flexDirection="column"
        gap={4}
        p={2}
        flexWrap="wrap"
        marginTop={2}
      >
        {/* Left Side */}
        <Box
          flex={1}
          display="flex"
          flexDirection="column"
          gap={2}
          minWidth={300}
          maxWidth={600}
        >
          <Typography variant="h6" sx={{ mt: 2 }}>
            RFID Scanning
          </Typography>
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
          {/* <Box mt={4}>
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
          </Box> */}
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
              height: "100%",
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              position: "relative",
            }}
          >
            <DataTable
              headCellsData={headCellsData}
              tableMainData={userMainData}
              tableTitle={tableTitle}
              isCheckBox={false}
              isRFIDPage={true}
              isAdmin={true}
            ></DataTable>
          </Box>
        </Box>
      </Box>
    </LayoutComponent>
  );
}

export default IdentifyManagementPage;
