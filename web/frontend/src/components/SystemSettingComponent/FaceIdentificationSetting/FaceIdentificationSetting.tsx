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
  CircularProgress,
  Snackbar,
  Alert,
  TablePagination,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import axios from "../../../services/axiosInstance";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

// Face vector interface
interface FaceVector {
  userId: string;
  fullName: string;
  role: string;
  front: number;
  left: number;
  right: number;
  down: number;
  up: number;
  avatar?: string; // Avatar URL from API
}

function FaceIdentificationSetting() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<FaceVector[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FaceVector[]>([]);
  const [selectedUser, setSelectedUser] = useState<FaceVector | null>(null);
  const [formData, setFormData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  
  // Search filter state
  const [searchField, setSearchField] = useState<"all" | "userId" | "fullName" | "role">("all");

  // Fetch face vectors from API
  useEffect(() => {
    const fetchFaceVectors = async () => {
      setLoading(true);
      try {
        // API now returns avatar in the response
        const response = await axios.get('http://fams.io.vn/api-nodejs/facevector/user');
        if (response.data?.success) {
          setUsers(response.data.data);
          setFilteredUsers(response.data.data);
        } else {
          setError("Failed to load face vector data");
        }
      } catch (err) {
        console.error("Error fetching face vectors:", err);
        setError("Error connecting to server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFaceVectors();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setPage(0); // Reset to first page when searching
    
    if (!value.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const lowerCaseValue = value.toLowerCase();
    
    setFilteredUsers(
      users.filter((user: FaceVector) => {
        if (searchField === "userId") {
          return user.userId.toLowerCase().includes(lowerCaseValue);
        } else if (searchField === "fullName") {
          return user.fullName.toLowerCase().includes(lowerCaseValue);
        } else if (searchField === "role") {
          return user.role.toLowerCase().includes(lowerCaseValue);
        } else {
          // Search in all fields
          return (
            user.userId.toLowerCase().includes(lowerCaseValue) ||
            user.fullName.toLowerCase().includes(lowerCaseValue) ||
            user.role.toLowerCase().includes(lowerCaseValue)
          );
        }
      })
    );
  };

  const handleClearSearch = () => {
    setSearch("");
    setFilteredUsers(users);
  };

  const handleEdit = (user: FaceVector) => {
    setSelectedUser(user);
    setFormData({
      front: user.front,
      left: user.left,
      right: user.right,
      down: user.down,
      up: user.up,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: parseFloat(value),
    });
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    
    try {
      // Cập nhật từng field vector riêng biệt theo cấu trúc API
      const updatePromises = Object.entries(formData).map(async ([category, score]) => {
        // Kiểm tra xem giá trị có thay đổi không
        if (selectedUser[category as keyof FaceVector] !== score) {
          return axios.put(`http://fams.io.vn/api-nodejs/facevector/user/${selectedUser.userId}`, {
            category,
            score
          });
        }
        return Promise.resolve(null);
      });
      
      // Chờ tất cả các API call hoàn thành
      const results = await Promise.all(updatePromises);
      
      // Kiểm tra kết quả
      const hasErrors = results.some(result => result && !result.data?.success);
      
      if (hasErrors) {
        setError("Error updating some face vectors");
      } else {
        // Cập nhật state
        const updatedUsers = users.map((user: FaceVector) => 
          user.userId === selectedUser.userId 
            ? { ...user, ...formData } 
            : user
        );
        
        setUsers(updatedUsers);
        
        // Áp dụng bộ lọc tìm kiếm hiện tại cho dữ liệu đã cập nhật
        if (search) {
          const lowerCaseValue = search.toLowerCase();
          setFilteredUsers(
            updatedUsers.filter((user: FaceVector) => {
              if (searchField === "userId") {
                return user.userId.toLowerCase().includes(lowerCaseValue);
              } else if (searchField === "fullName") {
                return user.fullName.toLowerCase().includes(lowerCaseValue);
              } else if (searchField === "role") {
                return user.role.toLowerCase().includes(lowerCaseValue);
              } else {
                return (
                  user.userId.toLowerCase().includes(lowerCaseValue) ||
                  user.fullName.toLowerCase().includes(lowerCaseValue) ||
                  user.role.toLowerCase().includes(lowerCaseValue)
                );
              }
            })
          );
        } else {
          setFilteredUsers(updatedUsers);
        }
        
        setSuccessMessage("Face vector updated successfully");
      }
    } catch (err) {
      console.error("Error updating face vector:", err);
      setError("Error updating data. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const closeSnackbar = () => {
    setError(null);
    setSuccessMessage(null);
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

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      gap={4}
      p={2}
    >
      {/* Snackbars for notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={closeSnackbar}>
        <Alert onClose={closeSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Left: Edit Form */}
      <Box flex={1} minWidth={{ xs: "100%", md: 300 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Edit Face Data
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedUser ? (
              <>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    src={selectedUser.avatar}
                    alt={selectedUser.fullName}
                    sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}
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
                      ID: {selectedUser.userId}
                    </Typography>
                  </Box>
                </Box>

                {["front", "left", "right", "down", "up"].map(field => (
                  <TextField
                    key={field}
                    label={`Probability ${field}`}
                    type="number"
                    inputProps={{ min: 0, max: 1, step: 0.01 }}
                    value={formData[field]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(field, e.target.value)}
                    fullWidth
                    margin="dense"
                  />
                ))}

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleSubmit}
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Save Changes"}
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
            Face Identification Table
          </Typography>
          
          {/* Enhanced search with field selection */}
          <Box display="flex" gap={2} mb={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="search-field-label">Search In</InputLabel>
              <Select
                labelId="search-field-label"
                value={searchField}
                label="Search In"
                onChange={(e) => setSearchField(e.target.value as any)}
              >
                <MenuItem value="all">All Fields</MenuItem>
                <MenuItem value="userId">User ID</MenuItem>
                <MenuItem value="fullName">Full Name</MenuItem>
                <MenuItem value="role">Role</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Search"
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
                endAdornment: search && (
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

          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table
                size="small"
                sx={{
                  border: "1px solid #e0e0e0",
                  mt: 1,
                }}
              >
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell>Avatar</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Front</TableCell>
                    <TableCell>Left</TableCell>
                    <TableCell>Right</TableCell>
                    <TableCell>Down</TableCell>
                    <TableCell>Up</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedUsers.length > 0 ? (
                    displayedUsers.map((user: FaceVector) => (
                      <TableRow hover key={user.userId}>
                        <TableCell>
                          <Avatar 
                            src={user.avatar} 
                            alt={user.fullName} 
                            sx={{ width: 32, height: 32 }}
                          >
                            {user.fullName.charAt(0)}
                          </Avatar>
                        </TableCell>
                        <TableCell>{user.userId}</TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={getRoleColor(user.role) as any}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{user.front.toFixed(2)}</TableCell>
                        <TableCell>{user.left.toFixed(2)}</TableCell>
                        <TableCell>{user.right.toFixed(2)}</TableCell>
                        <TableCell>{user.down.toFixed(2)}</TableCell>
                        <TableCell>{user.up.toFixed(2)}</TableCell>
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
                      <TableCell colSpan={10} align="center">
                        {search ? "No matching records found" : "No data available"}
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
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default FaceIdentificationSetting;
