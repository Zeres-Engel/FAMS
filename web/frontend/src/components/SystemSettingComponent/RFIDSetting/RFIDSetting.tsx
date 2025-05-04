import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Paper,
  Card,
  CardContent,
  Divider,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import dayjs from "dayjs";
import axios from "axios";

// Định nghĩa interface cho RFID data
interface RFIDUser {
  _id: string;
  id: string;
  userID: string;
  fullName: string;
  role: string;
  rfid: string;
  expireTime: string;
}

// Định nghĩa interface cho form data
interface FormData {
  rfid: string;
  expYears: number;
}

function RFIDSetting() {
  const [search, setSearch] = useState("");
  const [rfidUsers, setRfidUsers] = useState<RFIDUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<RFIDUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RFIDUser | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Fetch RFID data from API
  const fetchRFIDData = async () => {
    setLoading(true);
    setError("");
    try {
      // Không gửi token vì API đang mở
      const response = await axios.get("/api-nodejs/rfid/users", {
        headers: {
          // Không cần Authorization header cho API public
        }
      });
      
      if (response.data.success) {
        const data: RFIDUser[] = response.data.data;
        console.log("RFID data:", data);
        setRfidUsers(data);
        setFilteredUsers(data);
      } else {
        setError("Failed to load RFID data");
      }
    } catch (err: any) {
      console.error("Error fetching RFID data:", err);
      setError(err.message || "Error fetching RFID data");
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchRFIDData();
  }, []);

  // Filter users when search changes
  useEffect(() => {
    if (search.trim() === "") {
      setFilteredUsers(rfidUsers);
    } else {
      setFilteredUsers(
        rfidUsers.filter(
          (user) =>
            user.fullName.toLowerCase().includes(search.toLowerCase()) ||
            user.userID.toLowerCase().includes(search.toLowerCase()) ||
            user.role.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, rfidUsers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleEdit = (user: RFIDUser) => {
    setSelectedUser(user);
    setFormData({
      rfid: user.rfid || "",
      expYears: 3, // mặc định 3 năm
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (formData) {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser || !formData) return;
    
    setLoadingSubmit(true);
    setError("");
    setSuccess("");
    
    try {
      const finalExpDate = dayjs().add(formData.expYears, "year").format("YYYY-MM-DD");
      
      // Gọi API cập nhật RFID
      const response = await axios.put(
        `/api-nodejs/rfid/${selectedUser.rfid}`,
        {
          ExpiryDate: finalExpDate,
          RFID_ID: formData.rfid
        }
      );
      
      if (response.data.success) {
        // Cập nhật lại danh sách
        setSuccess("RFID information updated successfully");
        fetchRFIDData();
        
        // Cập nhật trong state
        const updatedUsers = rfidUsers.map(user => 
          user._id === selectedUser._id 
            ? { ...user, rfid: formData.rfid, expireTime: finalExpDate }
            : user
        );
        
        setRfidUsers(updatedUsers);
      } else {
        setError(response.data.message || "Failed to update RFID");
      }
    } catch (err: any) {
      console.error("Error updating RFID:", err);
      setError(err.response?.data?.message || err.message || "Error updating RFID");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleClose = () => {
    setError("");
    setSuccess("");
  };

  // Hiển thị loading khi đang fetch dữ liệu
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
        <Typography ml={2}>Loading RFID data...</Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      gap={4}
      p={2}
    >
      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Left: Edit Form */}
      <Box flex={1} minWidth={{ xs: "100%", md: 300 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Edit RFID Info
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedUser && formData ? (
              <>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.fullName)}&background=random`}
                    alt="avatar"
                    sx={{ width: 64, height: 64 }}
                  />
                  <Box>
                    <Typography fontWeight="bold">{selectedUser.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedUser.role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {selectedUser.userID}
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  label="RFID"
                  value={formData.rfid}
                  onChange={(e) => handleInputChange("rfid", e.target.value)}
                  fullWidth
                  margin="dense"
                />

                <TextField
                  select
                  label="Expiration Period"
                  value={formData.expYears}
                  onChange={(e) => handleInputChange("expYears", Number(e.target.value))}
                  fullWidth
                  margin="dense"
                >
                  <MenuItem value={1}>1 year</MenuItem>
                  <MenuItem value={2}>2 years</MenuItem>
                  <MenuItem value={3}>3 years</MenuItem>
                  <MenuItem value={5}>5 years</MenuItem>
                </TextField>

                <Typography variant="body2" sx={{ mt: 1 }}>
                  Expired on:{" "}
                  <strong>
                    {dayjs().add(formData.expYears, "year").format("YYYY-MM-DD")}
                  </strong>
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleSubmit}
                  disabled={loadingSubmit}
                >
                  {loadingSubmit ? <CircularProgress size={24} /> : "Save Changes"}
                </Button>
              </>
            ) : (
              <Typography color="text.secondary">
                Select a user to edit
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Right: Table */}
      <Box flex={2} minWidth={320}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            RFID Assignment Table
          </Typography>

          <TextField
            label="Search by name, ID or role"
            value={search}
            onChange={handleSearch}
            fullWidth
            margin="normal"
          />

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ border: "1px solid #e0e0e0" }}>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>User ID</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>RFID</TableCell>
                  <TableCell>Expire Time</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <TableRow hover key={user._id}>
                      <TableCell>{user.userID}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.rfid}</TableCell>
                      <TableCell>{dayjs(user.expireTime).format("YYYY-MM-DD")}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {loading ? "Loading..." : "No RFID data found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default RFIDSetting;
