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
} from "@mui/material";

const sampleUsers = [
  {
    id: "u001",
    fullName: "Alice Johnson",
    role: "student",
    avatar: "https://i.pravatar.cc/150?img=1",
    front: 0.93,
    left: 0.88,
    right: 0.91,
    down: 0.85,
    up: 0.87,
  },
  {
    id: "u002",
    fullName: "Bob Smith",
    role: "teacher",
    avatar: "https://i.pravatar.cc/150?img=2",
    front: 0.95,
    left: 0.89,
    right: 0.9,
    down: 0.84,
    up: 0.86,
  },
];

function FaceIdentificationSetting() {
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

  const handleSubmit = () => {
    console.log("Updated data:", { ...selectedUser, ...formData });
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
              Edit Face Data
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

                {["front", "left", "right", "down", "up"].map(field => (
                  <TextField
                    key={field}
                    label={`Probability ${field}`}
                    type="number"
                    inputProps={{ min: 0, max: 1, step: 0.01 }}
                    value={formData[field]}
                    onChange={e => handleInputChange(field, e.target.value)}
                    fullWidth
                    margin="dense"
                  />
                ))}

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
            Face Identification Table
          </Typography>
          <TextField
            label="Search by name"
            value={search}
            onChange={handleSearch}
            fullWidth
            margin="normal"
          />

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
                {filteredUsers.map(user => (
                  <TableRow hover key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.front}</TableCell>
                    <TableCell>{user.left}</TableCell>
                    <TableCell>{user.right}</TableCell>
                    <TableCell>{user.down}</TableCell>
                    <TableCell>{user.up}</TableCell>
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

export default FaceIdentificationSetting;
