import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  TableContainer,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, Delete as DeleteIcon } from "@mui/icons-material";
import axiosInstance from "../../../services/axiosInstance";

// Type definitions based on API response
interface ScheduleSlot {
  _id: string;
  slotId: number;
  slotName: string;
  slotNumber: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  id: string;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function ScheduleFormatSetting(): React.JSX.Element {
  // States
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [currentDay, setCurrentDay] = useState("Monday");
  const [formData, setFormData] = useState<Partial<ScheduleSlot>>({});
  const [isAddingNewSlot, setIsAddingNewSlot] = useState(false);
  const [newSlotData, setNewSlotData] = useState<Partial<ScheduleSlot>>({
    dayOfWeek: "Monday",
    isActive: true,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<ScheduleSlot | null>(null);

  // Fetch all schedule slots on component mount and when filters change
  useEffect(() => {
    fetchScheduleSlots();
  }, [currentDay, showInactive]);

  const fetchScheduleSlots = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/schedule-formats', {
        params: {
          dayOfWeek: currentDay,
          showInactive: showInactive ? 'true' : 'false'
        }
      });
      
      if (response.data?.success) {
        const sortedSlots = response.data.data.sort((a: ScheduleSlot, b: ScheduleSlot) => a.slotNumber - b.slotNumber);
        setFilteredSlots(sortedSlots);
        setScheduleSlots(response.data.data);
      } else {
        setError("Failed to load schedule data");
      }
    } catch (err) {
      console.error("Error fetching schedule slots:", err);
      setError("Error connecting to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = (event: React.SyntheticEvent, newDay: string) => {
    setCurrentDay(newDay);
    setEditingSlotId(null);
    setIsAddingNewSlot(false);
  };

  const handleEdit = (slot: ScheduleSlot) => {
    setEditingSlotId(slot._id);
    setFormData({
      ...slot
    });
  };

  const handleCancel = () => {
    setEditingSlotId(null);
    setFormData({});
  };

  const handleInputChange = (field: keyof ScheduleSlot, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewSlotInputChange = (field: keyof ScheduleSlot, value: any) => {
    setNewSlotData(prev => ({ ...prev, [field]: value }));
  };

  const startAddingNewSlot = () => {
    setIsAddingNewSlot(true);
    setNewSlotData({
      dayOfWeek: currentDay,
      isActive: true,
      slotNumber: filteredSlots.length > 0 ? Math.max(...filteredSlots.map(s => s.slotNumber)) + 1 : 1,
      slotName: `Slot ${filteredSlots.length > 0 ? Math.max(...filteredSlots.map(s => s.slotNumber)) + 1 : 1}`,
      startTime: "08:00",
      endTime: "08:45"
    });
  };

  const cancelAddingNewSlot = () => {
    setIsAddingNewSlot(false);
    setNewSlotData({
      dayOfWeek: currentDay,
      isActive: true
    });
  };

  const handleCreateNewSlot = async () => {
    if (!newSlotData.slotName || !newSlotData.startTime || !newSlotData.endTime) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/schedule-formats', {
        slotNumber: newSlotData.slotNumber,
        slotName: newSlotData.slotName,
        dayOfWeek: currentDay,
        startTime: newSlotData.startTime,
        endTime: newSlotData.endTime,
        isActive: newSlotData.isActive === undefined ? true : newSlotData.isActive
      });
      
      if (response.data?.success) {
        await fetchScheduleSlots();
        setIsAddingNewSlot(false);
        setNewSlotData({
          dayOfWeek: currentDay,
          isActive: true
        });
        setSuccess("New schedule slot created successfully!");
      } else {
        setError(response.data?.message || "Failed to create new schedule slot");
      }
    } catch (err) {
      console.error("Error creating schedule slot:", err);
      setError("Error connecting to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData || !editingSlotId) return;

    setLoading(true);
    try {
      const response = await axiosInstance.put(`/schedule-formats/${formData.slotId}`, {
        slotNumber: formData.slotNumber,
        slotName: formData.slotName,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isActive: formData.isActive
      });
      
      if (response.data?.success) {
        await fetchScheduleSlots();
        setEditingSlotId(null);
        setFormData({});
        setSuccess("Schedule slot updated successfully!");
      } else {
        setError(response.data?.message || "Failed to update schedule slot");
      }
    } catch (err) {
      console.error("Error updating schedule slot:", err);
      setError("Error connecting to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (slot: ScheduleSlot) => {
    setLoading(true);
    try {
      const response = await axiosInstance.patch(`/schedule-formats/${slot.slotId}/toggle-status`);
      
      if (response.data?.success) {
        await fetchScheduleSlots();
        setSuccess(`Slot ${slot.slotName} ${!slot.isActive ? 'activated' : 'deactivated'} successfully!`);
      } else {
        setError(response.data?.message || "Failed to update slot status");
      }
    } catch (err) {
      console.error("Error updating slot status:", err);
      setError("Error connecting to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi nhấn nút Delete
  const handleDeleteClick = (slot: ScheduleSlot) => {
    setSlotToDelete(slot);
    setDeleteDialogOpen(true);
  };

  // Xác nhận xóa slot
  const handleDeleteConfirm = async () => {
    if (!slotToDelete) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.delete(`/schedule-formats/${slotToDelete.slotId}`);
      
      if (response.data?.success) {
        await fetchScheduleSlots();
        setSuccess(`Slot "${slotToDelete.slotName}" has been deleted successfully!`);
      } else {
        setError(response.data?.message || "Failed to delete slot");
      }
    } catch (err) {
      console.error("Error deleting slot:", err);
      setError("Error connecting to server. Please try again later.");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setSlotToDelete(null);
    }
  };

  // Hủy xóa slot
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSlotToDelete(null);
  };

  const handleCloseAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  // Show loading spinner while initially loading data
  if (loading && scheduleSlots.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
        <Typography ml={2}>Loading schedule data...</Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {/* Alert messages */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlerts}>
        <Alert onClose={handleCloseAlerts} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseAlerts}>
        <Alert onClose={handleCloseAlerts} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Schedule Slot</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the slot "{slotToDelete?.slotName}"? 
            This action cannot be undone and may affect existing schedules.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            {loading ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h6" gutterBottom>
        Schedule Format Setting
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={currentDay} 
          onChange={handleDayChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {DAYS_OF_WEEK.map((day) => (
            <Tab key={day} label={day} value={day} />
          ))}
        </Tabs>
      </Box>

      <Box mb={2} display="flex" justifyContent="flex-end">
              <FormControlLabel
          control={
            <Switch
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
          }
          label="Show Inactive Slots"
        />
      </Box>

      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3}>
        {/* Left Side - Slot Form */}
        <Box flex={1} minWidth={{ xs: "100%", md: 350 }} maxWidth={{ md: 450 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                {isAddingNewSlot ? "Add New Slot" : "Create Schedule Slot"}
            </Typography>
              <Divider sx={{ mb: 2 }} />

              {isAddingNewSlot ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  <TextField
                    label="Slot Name"
                    size="small"
                    value={newSlotData.slotName || ''}
                    onChange={(e) => handleNewSlotInputChange('slotName', e.target.value)}
                    fullWidth
                  />
              <TextField
                    label="Slot Number"
                    size="small"
                type="number"
                    value={newSlotData.slotNumber || ''}
                    onChange={(e) => handleNewSlotInputChange('slotNumber', parseInt(e.target.value))}
                fullWidth
              />
                  <TextField
                    label="Start Time"
                    size="small"
                    type="time"
                    value={newSlotData.startTime || ''}
                    onChange={(e) => handleNewSlotInputChange('startTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    fullWidth
                  />
                  <TextField
                    label="End Time"
                    size="small"
                    type="time"
                    value={newSlotData.endTime || ''}
                    onChange={(e) => handleNewSlotInputChange('endTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    fullWidth
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newSlotData.isActive === undefined ? true : newSlotData.isActive}
                        onChange={(e) => handleNewSlotInputChange('isActive', e.target.checked)}
                      />
                    }
                    label="Active"
                  />
                  <Box display="flex" gap={1} mt={1}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleCreateNewSlot}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={24} /> : "Create Slot"}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={cancelAddingNewSlot}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={250}>
                  <Typography color="text.secondary" mb={3} align="center">
                    Create new schedule slots for {currentDay}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={startAddingNewSlot}
                    startIcon={<EditIcon />}
                  >
                    Add New Slot
                  </Button>
            </Box>
              )}
          </CardContent>
        </Card>
        </Box>

        {/* Right Side - Schedule Slots Table */}
        <Box flex={2}>
          {loading && filteredSlots.length > 0 && !isAddingNewSlot ? (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {currentDay} Schedule Slots
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell>Slot ID</TableCell>
                      <TableCell>Slot Name</TableCell>
                      <TableCell>Slot Number</TableCell>
                      <TableCell>Start Time</TableCell>
                      <TableCell>End Time</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSlots.map((slot) => (
                      <TableRow 
                        key={slot._id} 
                        hover
                        sx={{ 
                          backgroundColor: !slot.isActive ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                          '&:hover': { backgroundColor: !slot.isActive ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)' }
                        }}
                      >
                        {editingSlotId === slot._id ? (
                          // Edit mode
                          <>
                            <TableCell>{slot.slotId}</TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={formData.slotName || ''}
                                onChange={(e) => handleInputChange('slotName', e.target.value)}
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={formData.slotNumber || ''}
                                onChange={(e) => handleInputChange('slotNumber', parseInt(e.target.value))}
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="time"
                                value={formData.startTime || ''}
                                onChange={(e) => handleInputChange('startTime', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ step: 300 }}
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="time"
                                value={formData.endTime || ''}
                                onChange={(e) => handleInputChange('endTime', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ step: 300 }}
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={formData.isActive}
                                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                    size="small"
                                  />
                                }
                                label={formData.isActive ? "Active" : "Inactive"}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="primary" onClick={handleSave}>
                                <SaveIcon />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={handleCancel}>
                                <CancelIcon />
                              </IconButton>
                            </TableCell>
                          </>
                        ) : (
                          // View mode
                          <>
                            <TableCell>{slot.slotId}</TableCell>
                            <TableCell>{slot.slotName}</TableCell>
                            <TableCell>{slot.slotNumber}</TableCell>
                            <TableCell>{slot.startTime}</TableCell>
                            <TableCell>{slot.endTime}</TableCell>
                            <TableCell>
                              <Button
                                variant={slot.isActive ? "contained" : "outlined"}
                                size="small"
                                color={slot.isActive ? "success" : "error"}
                                onClick={() => handleToggleStatus(slot)}
                                sx={{ minWidth: '80px' }}
                              >
                                {slot.isActive ? "Active" : "Inactive"}
                              </Button>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="primary" onClick={() => handleEdit(slot)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDeleteClick(slot)}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                    {filteredSlots.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No schedule slots found for {currentDay}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ScheduleFormatSetting;