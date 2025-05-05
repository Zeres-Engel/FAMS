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
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import axiosInstance from "../../../services/axiosInstance";

// Type definitions based on API response
interface Subject {
  subjectId: number;
  subjectName: string;
  subjectType: string;
  sessions: number;
  description: string;
  isActive?: boolean;
}

interface Curriculum {
  curriculumId: number;
  curriculumName: string;
  description: string;
  grade: number;
  totalSubjects: number;
  totalSessions: number;
  subjects: Subject[];
}

interface CurriculumBasic {
  curriculumId: number;
  curriculumName: string;
  description: string;
  grade: number;
}

const SUBJECT_TYPES = [
  "Chinh",
  "Phu",
  "Tham Khao",
  "Tu Chon",
];

const defaultSubject: Subject = {
  subjectId: 0,
  subjectName: "",
  subjectType: "Chinh",
  sessions: 3,
  description: "",
};

function CurriculumSetting(): React.JSX.Element {
  // States
  const [curriculums, setCurriculums] = useState<CurriculumBasic[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Subject>(defaultSubject);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Fetch all curriculums on component mount
  useEffect(() => {
    const fetchCurriculums = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/curriculum');
        if (response.data?.success) {
          setCurriculums(response.data.data);
          // Set default selection to Grade 10 curriculum
          const grade10Curriculum = response.data.data.find((curr: CurriculumBasic) => curr.grade === 10);
          if (grade10Curriculum) {
            setSelectedCurriculumId(grade10Curriculum.curriculumId);
          }
        } else {
          setError("Failed to load curriculum data");
        }
      } catch (err) {
        console.error("Error fetching curriculums:", err);
        setError("Error connecting to server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculums();
  }, []);

  // Fetch curriculum details when selected curriculum changes
  useEffect(() => {
    if (!selectedCurriculumId) {
      setSelectedCurriculum(null);
      return;
    }

    const fetchCurriculumDetails = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/curriculum/${selectedCurriculumId}`);
        if (response.data?.success) {
          setSelectedCurriculum(response.data.data);
        } else {
          setError(`Failed to load details for curriculum ${selectedCurriculumId}`);
        }
      } catch (err) {
        console.error(`Error fetching curriculum details for ID ${selectedCurriculumId}:`, err);
        setError("Error loading curriculum details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculumDetails();
  }, [selectedCurriculumId]);

  const handleCurriculumChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const curriculumId = e.target.value;
    setSelectedCurriculumId(curriculumId === "" ? "" : Number(curriculumId));
    setEditingIndex(null);
    setFormData(defaultSubject);
  };

  const handleEdit = (index: number): void => {
    if (!selectedCurriculum) return;
    
    setEditingIndex(index);
    setFormData({ ...selectedCurriculum.subjects[index] });
  };

  const handleCancelEdit = (): void => {
    setEditingIndex(null);
    setFormData(defaultSubject);
  };

  const handleInputChange = (field: keyof Subject, value: string | number): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedCurriculum || !formData.subjectName.trim()) {
      setError("Please enter a subject name");
      return;
    }

    setLoading(true);
    try {
      if (editingIndex !== null) {
        // Update existing subject
        const subjectId = formData.subjectId;
        const response = await axiosInstance.put(
          `/curriculum/${selectedCurriculumId}/subjects/${subjectId}`, 
          { sessions: formData.sessions }
        );
        
        if (response.data?.success) {
          // Update the local state
          const updatedSubjects = [...selectedCurriculum.subjects];
          updatedSubjects[editingIndex] = formData;
          
          const updatedCurriculum = {
            ...selectedCurriculum,
            subjects: updatedSubjects,
            totalSubjects: updatedSubjects.length,
            totalSessions: updatedSubjects.reduce((total, s) => total + s.sessions, 0)
          };

          setSelectedCurriculum(updatedCurriculum);
          setSuccess("Subject updated successfully!");
        } else {
          setError("Failed to update subject");
        }
      } else {
        // Create a new subject or add existing one to curriculum
        const response = await axiosInstance.post(
          `/curriculum/${selectedCurriculumId}/subjects`,
          { 
            subjectName: formData.subjectName,
            subjectType: formData.subjectType,
            description: formData.description,
            sessions: formData.sessions 
          }
        );
        
        if (response.data?.success) {
          // Fetch updated curriculum to get all subject details
          const updatedResponse = await axiosInstance.get(`/curriculum/${selectedCurriculumId}`);
          if (updatedResponse.data?.success) {
            setSelectedCurriculum(updatedResponse.data.data);
            setSuccess("Subject added successfully!");
          } else {
            // Fallback if we can't get updated data
            const updatedSubjects = [...selectedCurriculum.subjects, formData];
            const updatedCurriculum = {
              ...selectedCurriculum,
              subjects: updatedSubjects,
              totalSubjects: updatedSubjects.length,
              totalSessions: updatedSubjects.reduce((total, s) => total + s.sessions, 0)
            };
            setSelectedCurriculum(updatedCurriculum);
            setSuccess("Subject added successfully! Refresh to see complete details.");
          }
        } else {
          setError("Failed to add subject");
        }
      }
    } catch (err) {
      console.error("Error saving subject:", err);
      setError("Error connecting to server. Please try again later.");
    } finally {
      setLoading(false);
      setFormData(defaultSubject);
      setEditingIndex(null);
    }
  };

  const handleDeleteClick = (subject: Subject): void => {
    setSubjectToDelete(subject);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!selectedCurriculumId || !subjectToDelete) return;

    setLoading(true);
    setDeleteDialogOpen(false);
    
    try {
      const response = await axiosInstance.delete(
        `/curriculum/${selectedCurriculumId}/subjects/${subjectToDelete.subjectId}`
      );
      
      if (response.data?.success) {
        // Update the local state by removing the subject
        const updatedSubjects = selectedCurriculum!.subjects.filter(
          subject => subject.subjectId !== subjectToDelete.subjectId
        );
        
        const updatedCurriculum = {
          ...selectedCurriculum!,
          subjects: updatedSubjects,
          totalSubjects: updatedSubjects.length,
          totalSessions: updatedSubjects.reduce((total, s) => total + s.sessions, 0)
        };

        setSelectedCurriculum(updatedCurriculum);
        setSuccess(`Subject "${subjectToDelete.subjectName}" removed from curriculum`);
      } else {
        setError("Failed to remove subject");
      }
    } catch (err) {
      console.error("Error deleting subject:", err);
      setError("Error connecting to server. Please try again later.");
    } finally {
      setLoading(false);
      setSubjectToDelete(null);
    }
  };

  const handleDeleteCancel = (): void => {
    setDeleteDialogOpen(false);
    setSubjectToDelete(null);
  };

  const handleCloseAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  // Show loading spinner while loading data
  if (loading && !selectedCurriculum) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
        <Typography ml={2}>Loading curriculum data...</Typography>
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
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove "{subjectToDelete?.subjectName}" from this curriculum? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h6" gutterBottom>
        Curriculum Setting
      </Typography>

      <TextField
        select
        label="Select Curriculum"
        value={selectedCurriculumId}
        onChange={handleCurriculumChange}
        fullWidth
        sx={{ maxWidth: 300, mb: 3 }}
      >
        <MenuItem value="">
          <em>Select a curriculum</em>
        </MenuItem>
        {curriculums.map((curriculum) => (
          <MenuItem key={curriculum.curriculumId} value={curriculum.curriculumId}>
            {curriculum.curriculumName}
          </MenuItem>
        ))}
      </TextField>

      {selectedCurriculum && (
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={4}>
          {/* Left: Form */}
          <Box flex={1} minWidth={300}>
            <Card variant="outlined">
              <CardContent>
                {editingIndex !== null && (
                  <Box display="flex" alignItems="center" mb={1}>
                    <IconButton onClick={handleCancelEdit} color="primary" size="small">
                      <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="body2" color="text.secondary" ml={1}>
                      Back to Add Subject
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="subtitle1" gutterBottom>
                  {editingIndex !== null ? "Edit Subject" : "Add Subject to Curriculum"}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <TextField
                  label="Subject Name"
                  value={formData.subjectName}
                  onChange={(e) => handleInputChange("subjectName", e.target.value)}
                  fullWidth
                  margin="dense"
                  disabled={editingIndex !== null}
                  required
                />
                <TextField
                  select
                  label="Subject Type"
                  value={formData.subjectType}
                  onChange={(e) => handleInputChange("subjectType", e.target.value)}
                  fullWidth
                  margin="dense"
                  disabled={editingIndex !== null}
                >
                  {SUBJECT_TYPES.map((type: string) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Sessions"
                  type="number"
                  value={formData.sessions}
                  onChange={(e) => handleInputChange("sessions", Number(e.target.value))}
                  fullWidth
                  margin="dense"
                  helperText="Number of sessions for this subject"
                  InputProps={{ inputProps: { min: 1 } }}
                />
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  margin="dense"
                  disabled={editingIndex !== null}
                />

                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : (editingIndex !== null ? "Update Subject" : "Add Subject")}
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* Right: Table */}
          <Box flex={2}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedCurriculum.curriculumName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Subjects: {selectedCurriculum.totalSubjects} | 
                Total Sessions: {selectedCurriculum.totalSessions}
              </Typography>

              {loading ? (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress size={24} />
                  <Typography ml={1}>Loading subjects...</Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell>Subject ID</TableCell>
                      <TableCell>Subject Name</TableCell>
                      <TableCell>Sessions</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedCurriculum.subjects.map((subject: Subject, index: number) => (
                      <TableRow key={index} hover>
                        <TableCell>{subject.subjectId}</TableCell>
                        <TableCell>{subject.subjectName}</TableCell>
                        <TableCell>{subject.sessions}</TableCell>
                        <TableCell>{subject.subjectType}</TableCell>
                        <TableCell>{subject.description}</TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleEdit(index)}
                            >
                              Edit
                            </Button>
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => handleDeleteClick(subject)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {selectedCurriculum.subjects.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No subjects found in this curriculum
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default CurriculumSetting;
