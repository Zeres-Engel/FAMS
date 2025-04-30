import React, { useState } from "react";
import "./ClassManagementPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import Container from "@mui/material/Container";
import {
  Grid,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
  Box,
  Tab,
  Tabs,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  SelectChangeEvent
} from "@mui/material";
import DataTable from "../../components/DataTable/DataTable";
import useClassManagementPageHook from "./useClassManagementPageHook";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";

function ClassManagementPage(): React.JSX.Element {
  const { state, handler } = useClassManagementPageHook();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [classInfo, setClassInfo] = useState({
    className: "",
    grade: "",
    homeroomTeacherId: "",
    academicYear: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<any[]>([]);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  // Handle dialog open/close
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
    setTabValue(0);
    setClassInfo({
      className: "",
      grade: "",
      homeroomTeacherId: "",
      academicYear: ""
    });
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClassInfo({
      ...classInfo,
      [name]: value
    });
  };

  // Handle select change - updated to use SelectChangeEvent
  const handleSelectChange = (e: SelectChangeEvent) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    setClassInfo({
      ...classInfo,
      [name]: value
    });
  };

  // Handle next to preview
  const handleNextToPreview = async () => {
    // Clear any previously selected users
    setSelectedStudents([]);
    setSelectedTeachers([]);
    
    // Reset filters
    setSearchTerm("");
    setTeacherSearchTerm("");
    setAcademicYearFilter("");
    setClassFilter("");
    
    // Set role filter to "all" to show all users initially
    setRoleFilter("all");
    
    // Fetch users from API
    await handler.fetchUsers("", "all");
    
    // Move to the next tab
    setTabValue(1);
  };

  // Handle search change
  const handleSearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    await handler.fetchUsers(event.target.value, roleFilter);
  };

  // Handle role filter change - updated to use SelectChangeEvent
  const handleRoleFilterChange = async (event: SelectChangeEvent) => {
    const value = event.target.value;
    setRoleFilter(value);
    await handler.fetchUsers(searchTerm, value);
  };

  // Handle user selection
  const handleToggleUserSelection = (user: any) => {
    const isSelected = selectedTeachers.some(t => t.id === user.id);
    
    if (isSelected) {
      setSelectedTeachers(selectedTeachers.filter(t => t.id !== user.id));
    } else {
      setSelectedTeachers([...selectedTeachers, user]);
    }
  };

  // Create class with selected users
  const handleCreateClass = async () => {
    // Combine selected students and teachers
    const selectedUsers = [...selectedStudents, ...selectedTeachers];
    
    // Gọi API để tạo lớp
    const result = await handler.handleCreateClass(classInfo, selectedUsers);
    
    if (result.success) {
      // Hiển thị thông báo thành công
      alert(result.message);
      
      // Đóng dialog sau khi tạo
      setCreateDialogOpen(false);
      
      // Reset các state
      setClassInfo({
        className: "",
        grade: "",
        homeroomTeacherId: "",
        academicYear: ""
      });
      setSelectedStudents([]);
      setSelectedTeachers([]);
    } else {
      // Hiển thị thông báo lỗi
      alert(result.message);
    }
  };

  // Filter users based on search and role filter
  const filteredUsers = state.users.filter((user: any) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Filter students based on name, academic year, and class
  const filteredStudents = state.users.filter((user: any) => {
    // Only include students
    if (user.role !== 'student') return false;
    
    // Filter by name
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm));
    
    // Filter by academic year
    const matchesAcademicYear = !academicYearFilter || user.academicYear === academicYearFilter;
    
    // Filter by class
    const matchesClass = !classFilter || user.className === classFilter;
    
    return matchesSearch && matchesAcademicYear && matchesClass;
  });

  // Filter teachers based on name
  const filteredTeachers = state.users.filter((user: any) => {
    // Only include teachers
    if (user.role !== 'teacher') return false;
    
    // Filter by name
    const matchesSearch = user.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(teacherSearchTerm));
    
    return matchesSearch;
  });

  // Handle student selection
  const handleToggleStudentSelection = (student: any) => {
    const isSelected = selectedStudents.some(s => s.id === student.id);
    
    if (isSelected) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  // Handle teacher selection
  const handleToggleTeacherSelection = (teacher: any) => {
    const isSelected = selectedTeachers.some(t => t.id === teacher.id);
    
    if (isSelected) {
      setSelectedTeachers(selectedTeachers.filter(t => t.id !== teacher.id));
    } else {
      setSelectedTeachers([...selectedTeachers, teacher]);
    }
  };

  // Handle academic year filter change
  const handleAcademicYearFilterChange = (event: SelectChangeEvent) => {
    setAcademicYearFilter(event.target.value);
  };

  // Handle class filter change
  const handleClassFilterChange = (event: SelectChangeEvent) => {
    setClassFilter(event.target.value);
  };

  // Handle teacher search change
  const handleTeacherSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTeacherSearchTerm(event.target.value);
  };

  return (
    <LayoutComponent pageHeader="Class Management">
      <Container maxWidth={false} className="classManagementPage-Container">
        <Grid container size={11} className="classManagementPage-Grid">
          <Grid size={12} className="classPage-Header">
            <DataTable
              headCellsData={state.headCellsData}
              tableMainData={state.classMainData}
              tableTitle={state.tableTitle}
              isCheckBox={state.isCheckBox}
              isAdmin={true}
              isClassManagement={true}
              setFiltersClass={handler.setFiltersClass}
              classOptions={state.classOptions}
              createButtonAction={handleOpenCreateDialog} 
            />
          </Grid>
        </Grid>
      </Container>

      {/* Create Class Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Create New Class</Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseCreateDialog}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Class Info" />
            <Tab label="Add Students & Teachers" disabled={!classInfo.className || !classInfo.grade} />
          </Tabs>
          
          {tabValue === 0 && (
            <Box sx={{ mt: 3, p: 2 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <FormControl fullWidth>
                    <InputLabel>Academic Year *</InputLabel>
                    <Select
                      name="academicYear"
                      value={classInfo.academicYear}
                      onChange={handleSelectChange}
                      label="Academic Year *"
                      required
                    >
                      <MenuItem value="2023-2024">2023-2024</MenuItem>
                      <MenuItem value="2024-2025">2024-2025</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                
                <div>
                  <FormControl fullWidth>
                    <InputLabel>Grade *</InputLabel>
                    <Select
                      name="grade"
                      value={classInfo.grade}
                      onChange={handleSelectChange}
                      label="Grade *"
                      required
                    >
                      <MenuItem value="10">10</MenuItem>
                      <MenuItem value="11">11</MenuItem>
                      <MenuItem value="12">12</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                
                <div>
                  <TextField
                    fullWidth
                    label="Class Name *"
                    name="className"
                    value={classInfo.className}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <FormControl fullWidth>
                    <InputLabel>Teacher *</InputLabel>
                    <Select
                      name="homeroomTeacherId"
                      value={classInfo.homeroomTeacherId}
                      onChange={handleSelectChange}
                      label="Teacher *"
                      required
                    >
                      <MenuItem value="T001">Mr. Nguyen</MenuItem>
                      <MenuItem value="T002">Ms. Tran</MenuItem>
                      <MenuItem value="T003">Mr. Pham</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box sx={{ mt: 3 }}>
              <Box mb={2}>
                <Typography variant="subtitle1">
                  Selected class: {classInfo.className} - Grade {classInfo.grade} - Academic Year {classInfo.academicYear}
                </Typography>
              </Box>
              
              {/* STUDENTS SECTION */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
                Students
              </Typography>
              
              {/* Student Search and Filter */}
              <Box display="flex" alignItems="center" mb={2} gap={2}>
                <TextField
                  placeholder="Search students by name..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  sx={{ flexGrow: 1 }}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Academic Year</InputLabel>
                  <Select
                    value={academicYearFilter || ""}
                    onChange={handleAcademicYearFilterChange}
                    label="Academic Year"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="2023-2024">2023-2024</MenuItem>
                    <MenuItem value="2024-2025">2024-2025</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={classFilter || ""}
                    onChange={handleClassFilterChange}
                    label="Class"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="10A1">10A1</MenuItem>
                    <MenuItem value="10A2">10A2</MenuItem>
                    <MenuItem value="11A1">11A1</MenuItem>
                    <MenuItem value="11A2">11A2</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              {/* Students Table */}
              <Paper sx={{ width: '100%', overflow: 'hidden', mb: 4 }}>
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table stickyHeader aria-label="students table">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
                            checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                            onChange={() => {
                              if (selectedStudents.length === filteredStudents.length) {
                                setSelectedStudents([]);
                              } else {
                                setSelectedStudents(filteredStudents);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>ID</TableCell>
                        <TableCell>Gender</TableCell>
                        <TableCell>Academic Year</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Phone</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredStudents.map((student) => {
                        const isSelected = selectedStudents.some(s => s.id === student.id);
                        
                        return (
                          <TableRow
                            key={student.id}
                            hover
                            onClick={() => handleToggleStudentSelection(student)}
                            role="checkbox"
                            aria-checked={isSelected}
                            selected={isSelected}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox checked={isSelected} />
                            </TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.id}</TableCell>
                            <TableCell>{student.gender}</TableCell>
                            <TableCell>{student.academicYear || '-'}</TableCell>
                            <TableCell>{student.className || '-'}</TableCell>
                            <TableCell>{student.phone}</TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            No students found matching the criteria
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
              
              <Box mt={2} mb={4}>
                <Typography>
                  Selected students: {selectedStudents.length}
                </Typography>
              </Box>

              {/* TEACHERS SECTION */}
              <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>
                Homeroom Teacher
              </Typography>
              
              {/* Teacher Search */}
              <Box display="flex" alignItems="center" mb={2} gap={2}>
                <TextField
                  placeholder="Search teachers by name..."
                  value={teacherSearchTerm}
                  onChange={handleTeacherSearchChange}
                  sx={{ flexGrow: 1 }}
                  InputProps={{
                    startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />
              </Box>
              
              {/* Teachers Table */}
              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 250 }}>
                  <Table stickyHeader aria-label="teachers table">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={selectedTeachers.length > 0 && selectedTeachers.length < filteredTeachers.length}
                            checked={filteredTeachers.length > 0 && selectedTeachers.length === filteredTeachers.length}
                            onChange={() => {
                              if (selectedTeachers.length === filteredTeachers.length) {
                                setSelectedTeachers([]);
                              } else {
                                setSelectedTeachers(filteredTeachers);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>ID</TableCell>
                        <TableCell>Gender</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Subject</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTeachers.map((teacher) => {
                        const isSelected = selectedTeachers.some(t => t.id === teacher.id);
                        
                        return (
                          <TableRow
                            key={teacher.id}
                            hover
                            onClick={() => handleToggleTeacherSelection(teacher)}
                            role="checkbox"
                            aria-checked={isSelected}
                            selected={isSelected}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox checked={isSelected} />
                            </TableCell>
                            <TableCell>{teacher.name}</TableCell>
                            <TableCell>{teacher.id}</TableCell>
                            <TableCell>{teacher.gender}</TableCell>
                            <TableCell>{teacher.phone}</TableCell>
                            <TableCell>{teacher.subject || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredTeachers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No teachers found matching the criteria
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
              
              <Box mt={2}>
                <Typography>
                  Selected teachers: {selectedTeachers.length}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          {tabValue === 0 && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleNextToPreview}
              disabled={!classInfo.className || !classInfo.grade || !classInfo.academicYear || !classInfo.homeroomTeacherId}
            >
              Next
            </Button>
          )}
          {tabValue === 1 && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCreateClass}
            >
              CREATE
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LayoutComponent>
  );
}
export default ClassManagementPage;
