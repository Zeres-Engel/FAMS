import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Card,
  CardContent,
  Divider,
} from "@mui/material";

const sampleDevices = [
  {
    id: "dev001",
    deviceName: "Entrance Camera 1",
    status: "active",
    location: "Main Gate",
    accessToken: "abc123",
    faceDetectionVersion: "1.0.0",
    faceRecognitionVersion: "1.0.0",
    depthEstimationVersion: "1.0.0",
  },
  {
    id: "dev002",
    deviceName: "Lab RFID Reader",
    status: "inactive",
    location: "Lab Room 3",
    accessToken: "xyz789",
    faceDetectionVersion: "1.0.0",
    faceRecognitionVersion: "1.0.0",
    depthEstimationVersion: "1.0.0",
  },
];

function DeviceSetting() {
  const [search, setSearch] = useState("");
  const [filteredDevices, setFilteredDevices] = useState(sampleDevices);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [files, setFiles] = useState<{
    faceDetectionFile: File | null;
    faceRecognitionFile: File | null;
    depthEstimationFile: File | null;
  }>({
    faceDetectionFile: null,
    faceRecognitionFile: null,
    depthEstimationFile: null,
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setFilteredDevices(
      sampleDevices.filter(device =>
        device.deviceName.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const handleEdit = (device: any) => {
    setSelectedDevice(device);
    setFormData({ ...device });
    setFiles({
      faceDetectionFile: null,
      faceRecognitionFile: null,
      depthEstimationFile: null,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileChange = (
    field: "faceDetectionFile" | "faceRecognitionFile" | "depthEstimationFile",
    file: File | null
  ) => {
    setFiles({ ...files, [field]: file });
  };

  const handleSubmit = () => {
    console.log("🔄 Updated device info:", formData);
    console.log("📁 Uploaded files:", files);
  };

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      gap={4}
      p={2}
    >
      {/* Left: Form */}
      <Box flex={1} minWidth={{ xs: "100%", md: 300 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Edit Device Info
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {selectedDevice ? (
              <>
                {[
                  "deviceName",
                  "status",
                  "location",
                  "accessToken",
                ].map(field => (
                  <TextField
                    key={field}
                    label={field}
                    value={formData[field]}
                    onChange={e => handleInputChange(field, e.target.value)}
                    fullWidth
                    margin="dense"
                  />
                ))}

                {/* Face Detection Version */}
                <TextField
                  label="Face Detection Version"
                  value={formData.faceDetectionVersion}
                  onChange={e =>
                    handleInputChange("faceDetectionVersion", e.target.value)
                  }
                  fullWidth
                  margin="dense"
                />
                <Button variant="outlined" component="label" sx={{ mt: 1 }}>
                  Upload Face Detection Model
                  <input
                    type="file"
                    hidden
                    onChange={e =>
                      handleFileChange(
                        "faceDetectionFile",
                        e.target.files?.[0] || null
                      )
                    }
                  />
                </Button>
                {files.faceDetectionFile && (
                  <Typography variant="body2" mt={1}>
                    File: {files.faceDetectionFile.name}
                  </Typography>
                )}

                {/* Face Recognition Version */}
                <TextField
                  label="Face Recognition Version"
                  value={formData.faceRecognitionVersion}
                  onChange={e =>
                    handleInputChange("faceRecognitionVersion", e.target.value)
                  }
                  fullWidth
                  margin="dense"
                  sx={{ mt: 2 }}
                />
                <Button variant="outlined" component="label" sx={{ mt: 1 }}>
                  Upload Face Recognition Model
                  <input
                    type="file"
                    hidden
                    onChange={e =>
                      handleFileChange(
                        "faceRecognitionFile",
                        e.target.files?.[0] || null
                      )
                    }
                  />
                </Button>
                {files.faceRecognitionFile && (
                  <Typography variant="body2" mt={1}>
                    File: {files.faceRecognitionFile.name}
                  </Typography>
                )}

                {/* Depth Estimation Version */}
                <TextField
                  label="Depth Estimation Version"
                  value={formData.depthEstimationVersion}
                  onChange={e =>
                    handleInputChange("depthEstimationVersion", e.target.value)
                  }
                  fullWidth
                  margin="dense"
                  sx={{ mt: 2 }}
                />
                <Button variant="outlined" component="label" sx={{ mt: 1 }}>
                  Upload Depth Estimation Model
                  <input
                    type="file"
                    hidden
                    onChange={e =>
                      handleFileChange(
                        "depthEstimationFile",
                        e.target.files?.[0] || null
                      )
                    }
                  />
                </Button>
                {files.depthEstimationFile && (
                  <Typography variant="body2" mt={1}>
                    File: {files.depthEstimationFile.name}
                  </Typography>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3 }}
                  onClick={handleSubmit}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Typography color="text.secondary">Select a device to edit</Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Right: Table */}
      <Box flex={2} minWidth={320}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Device List
          </Typography>

          <TextField
            label="Search by Device Name"
            value={search}
            onChange={handleSearch}
            fullWidth
            margin="normal"
          />

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ border: "1px solid #e0e0e0" }}>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>Device ID</TableCell>
                  <TableCell>Device Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Access Token</TableCell>
                  <TableCell>Face Detect</TableCell>
                  <TableCell>Face Recognize</TableCell>
                  <TableCell>Depth Estimation</TableCell>
                  <TableCell align="center">Edit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDevices.map(device => (
                  <TableRow hover key={device.id}>
                    <TableCell>{device.id}</TableCell>
                    <TableCell>{device.deviceName}</TableCell>
                    <TableCell>{device.status}</TableCell>
                    <TableCell>{device.location}</TableCell>
                    <TableCell>{device.accessToken}</TableCell>
                    <TableCell>{device.faceDetectionVersion}</TableCell>
                    <TableCell>{device.faceRecognitionVersion}</TableCell>
                    <TableCell>{device.depthEstimationVersion}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleEdit(device)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default DeviceSetting;
