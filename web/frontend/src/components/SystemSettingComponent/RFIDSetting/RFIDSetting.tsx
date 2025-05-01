import React, { useState } from "react";
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
} from "@mui/material";
import dayjs from "dayjs";

const sampleUsers = [
  {
    id: "s001",
    fullName: "Student A",
    role: "student",
    avatar: "https://i.pravatar.cc/150?img=3",
    rfid: "1234567890",
    expTime: "2028-04-29",
  },
  {
    id: "t001",
    fullName: "Teacher B",
    role: "teacher",
    avatar: "https://i.pravatar.cc/150?img=4",
    rfid: "0987654321",
    expTime: "2026-12-31",
  },
];

function RFIDSetting() {
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(sampleUsers);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setFilteredUsers(
      sampleUsers.filter(user =>
        user.fullName.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({
      rfid: user.rfid || "",
      expYears: 3, // mặc định 3 năm
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = () => {
    const finalExpDate = dayjs().add(formData.expYears, "year").format("YYYY-MM-DD");
    const updatedData = {
      ...selectedUser,
      rfid: formData.rfid,
      expTime: finalExpDate,
    };
    console.log("✅ Saved Data:", updatedData);
  };

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      gap={4}
      p={2}
    >
      {/* Left: Edit Form */}
      <Box flex={1} minWidth={{ xs: "100%", md: 300 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Edit RFID Info
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedUser ? (
              <>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    src={selectedUser.avatar}
                    alt="avatar"
                    sx={{ width: 64, height: 64 }}
                  />
                  <Box>
                    <Typography fontWeight="bold">{selectedUser.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedUser.role}
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  label="RFID"
                  value={formData.rfid}
                  onChange={e => handleInputChange("rfid", e.target.value)}
                  fullWidth
                  margin="dense"
                />

                <TextField
                  select
                  label="Expiration Period"
                  value={formData.expYears}
                  onChange={e => handleInputChange("expYears", Number(e.target.value))}
                  fullWidth
                  margin="dense"
                >
                  <MenuItem value={1}>1 year</MenuItem>
                  <MenuItem value={2}>2 years</MenuItem>
                  <MenuItem value={3}>3 years</MenuItem>
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
                >
                  Save Changes
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
            label="Search by name"
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
                {filteredUsers.map(user => (
                  <TableRow hover key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.rfid}</TableCell>
                    <TableCell>{user.expTime}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default RFIDSetting;
