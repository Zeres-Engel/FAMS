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
  TablePagination,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Chip,
  SelectChangeEvent,
} from "@mui/material";
import dayjs from "dayjs";
import axios from "axios";
// Import axiosInstance có sẵn header Authorization
import axiosInstance from "../../../services/axiosInstance";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

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
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  
  // Search filter state
  const [searchField, setSearchField] = useState<"userID" | "role">("userID");
  const [selectedRole, setSelectedRole] = useState<"all" | "teacher" | "student">("all");

  // Fetch RFID data from API
  const fetchRFIDData = async () => {
    setLoading(true);
    setError("");
    try {
      // Sử dụng axiosInstance để tự động gửi token xác thực
      const response = await axiosInstance.get("/rfid/users");
      
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

  // Áp dụng bộ lọc khi thay đổi search, searchField, selectedRole hoặc dữ liệu
  useEffect(() => {
    let filtered = [...rfidUsers];
    
    // Lọc theo vai trò nếu đã chọn
    if (selectedRole !== "all") {
      filtered = filtered.filter(user => 
        user.role.toLowerCase() === selectedRole.toLowerCase()
      );
    }
    
    // Áp dụng tìm kiếm nếu có
    if (search.trim() !== "") {
      const lowerCaseValue = search.toLowerCase();
      filtered = filtered.filter(user => 
        user.userID.toLowerCase().includes(lowerCaseValue)
      );
    }
    
    setFilteredUsers(filtered);
    // Reset to first page when filtering
    setPage(0);
  }, [search, searchField, selectedRole, rfidUsers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleRoleChange = (e: SelectChangeEvent<"all" | "teacher" | "student">) => {
    setSelectedRole(e.target.value as "all" | "teacher" | "student");
  };

  const handleClearSearch = () => {
    setSearch("");
    setSelectedRole("all");
  };

  const handleEdit = (user: RFIDUser) => {
    setSelectedUser(user);
    setFormData({
      rfid: "", // Để trống thay vì hiển thị RFID cũ
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

  // Hàm xử lý phím Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Pagination handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate the users to display on the current page
  const displayedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Function to get role color
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'error';
      case 'teacher':
        return 'secondary'; // Tím
      case 'parent':
        return 'warning';
      case 'student':
        return 'primary'; // Xanh
      default:
        return 'default';
    }
  };

  const handleSubmit = async () => {
    if (!selectedUser || !formData) return;
    
    setLoadingSubmit(true);
    setError("");
    setSuccess("");
    
    try {
      // Không cần tính toán finalExpDate ở frontend nữa, backend sẽ tính
      
      // Sử dụng userId thay vì rfid để update
      const response = await axiosInstance.put(
        `/rfid/${selectedUser.userID}`,
        {
          ExpiryYears: formData.expYears, // Truyền số năm thay vì date
          RFID_ID: formData.rfid // Vẫn giữ RFID_ID để cập nhật nếu cần
        }
      );
      
      if (response.data.success) {
        // Cập nhật lại danh sách
        setSuccess("RFID information updated successfully");
        fetchRFIDData();
        
        // Không cần cập nhật local state nữa vì đã gọi fetchRFIDData() để lấy dữ liệu mới
        
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
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.fullName)}&background=dddddd&color=555555`}
                    alt="avatar"
                    sx={{ width: 64, height: 64, bgcolor: '#dddddd', color: '#555555' }}
                  >
                    {selectedUser.fullName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography fontWeight="bold">{selectedUser.fullName}</Typography>
                    <Chip 
                      label={selectedUser.role} 
                      color={getRoleColor(selectedUser.role) as any}
                      size="small" 
                      sx={{ mr: 1, mb: 0.5 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ID: {selectedUser.userID}
                    </Typography>
                  </Box>
                </Box>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                >
                  <TextField
                    label="RFID"
                    value={formData.rfid}
                    onChange={(e) => handleInputChange("rfid", e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập mã RFID mới"
                    fullWidth
                    margin="dense"
                    autoFocus
                  />

                  <TextField
                    select
                    label="Expiration Period"
                    value={formData.expYears}
                    onChange={(e) => handleInputChange("expYears", Number(e.target.value))}
                    onKeyDown={handleKeyDown}
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
                    disabled={loadingSubmit}
                    type="submit"
                  >
                    {loadingSubmit ? <CircularProgress size={24} /> : "Save Changes"}
                  </Button>
                </form>
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

          {/* Enhanced search with field selection */}
          <Box display="flex" gap={2} mb={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="role-filter-label">Role</InputLabel>
              <Select
                labelId="role-filter-label"
                value={selectedRole}
                label="Role"
                onChange={handleRoleChange}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="student">Student</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Search by User ID"
              value={search}
              onChange={handleSearch}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (search || selectedRole !== "all") && (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="clear search"
                      onClick={handleClearSearch}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ border: "1px solid #e0e0e0" }}>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>Avatar</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>RFID</TableCell>
                  <TableCell>Expire Time</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedUsers.length > 0 ? (
                  displayedUsers.map(user => (
                    <TableRow hover key={user._id}>
                      <TableCell>
                        <Avatar 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=dddddd&color=555555`}
                          alt={user.fullName}
                          sx={{ width: 32, height: 32, bgcolor: '#dddddd', color: '#555555' }}
                        >
                          {user.fullName.charAt(0)}
                        </Avatar>
                      </TableCell>
                      <TableCell>{user.userID}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          color={getRoleColor(user.role) as any}
                          size="small" 
                        />
                      </TableCell>
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
                    <TableCell colSpan={7} align="center">
                      {search ? "No matching records found" : "No RFID data found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[10, 20, 50, 100]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default RFIDSetting;
