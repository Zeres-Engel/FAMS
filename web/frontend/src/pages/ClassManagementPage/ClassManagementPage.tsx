import React, { useState, useEffect } from "react";
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
  SelectChangeEvent,
  Autocomplete,
  Snackbar,
  Alert
} from "@mui/material";
import DataTable from "../../components/DataTable/DataTable";
import useClassManagementPageHook from "./useClassManagementPageHook";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

// Interface for Teacher data
interface Teacher {
  userId: string;
  fullName: string;
  teacherId: number;
}

// Interface for Class data
interface ClassData {
  _id: string;
  className: string;
  grade: number;
  homeroomTeacherId: string;
  academicYear: string;
  createdAt: string;
  isActive: boolean;
  classId: number;
  id: string;
  studentNumber: number;
}

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
  const [academicYearFilter, setAcademicYearFilter] = useState("2024-2025");
  const [classFilter, setClassFilter] = useState("");
  const [academicYearOptions, setAcademicYearOptions] = useState<string[]>([]);
  const [availableClassesForFilter, setAvailableClassesForFilter] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [allClasses, setAllClasses] = useState<ClassData[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("info");

  // Generate academic year options based on current year
  useEffect(() => {
    const generateAcademicYearOptions = () => {
      const currentYear = new Date().getFullYear();
      const options = [];
      
      // Generate 5 options: 3 years before current year to 1 year after current year
      for (let i = -3; i <= 1; i++) {
        const startYear = currentYear + i;
        const endYear = startYear + 1;
        options.push(`${startYear}-${endYear}`);
      }
      
      return options;
    };
    
    setAcademicYearOptions(generateAcademicYearOptions());
  }, []);

  // Fetch teachers and filter those not assigned as homeroom teachers
  useEffect(() => {
    const fetchTeachersAndClasses = async () => {
      setIsLoadingTeachers(true);
      try {
        // Fetch all teachers
        const teachersResponse = await axios.get('http://fams.io.vn/api-nodejs/teachers/search?search=&page=1&limit=100');
        
        // Fetch all classes to get list of homeroom teachers
        const classesResponse = await axios.get('http://fams.io.vn/api-nodejs/classes?search=&academicYear=');
        
        if (teachersResponse.data.success && classesResponse.data.success) {
          const allTeachers = teachersResponse.data.data;
          setTeachers(allTeachers);
          
          // Extract all homeroom teacher IDs from classes
          const assignedTeacherIds = new Set(
            classesResponse.data.data.map((classData: ClassData) => classData.homeroomTeacherId)
          );
          
          console.log("Assigned teacher IDs:", Array.from(assignedTeacherIds));
          
          // Filter out teachers who are already homeroom teachers
          const availableTeachers = allTeachers.filter(
            (teacher: Teacher) => !assignedTeacherIds.has(teacher.userId)
          );
          
          console.log("Available teachers:", availableTeachers.length);
          setAvailableTeachers(availableTeachers);
          setAllClasses(classesResponse.data.data);
        } else {
          console.error("Failed to fetch teachers or classes:", 
            !teachersResponse.data.success ? teachersResponse.data : classesResponse.data);
        }
      } catch (error) {
        console.error("Error fetching teachers and classes:", error);
      } finally {
        setIsLoadingTeachers(false);
      }
    };

    fetchTeachersAndClasses();
  }, []);

  // Thêm một useEffect để làm mới dữ liệu khi store thay đổi
  useEffect(() => {
    // Đăng ký sự kiện lắng nghe cho việc làm mới dữ liệu
    const refreshData = () => {
      console.log("Refreshing class data after update");
      handler.fetchClasses();
    };
    
    // Lắng nghe sự kiện custom 'class-updated'
    window.addEventListener('class-updated', refreshData);
    
    // Hủy đăng ký khi component unmount
    return () => {
      window.removeEventListener('class-updated', refreshData);
    };
  }, [handler]);

  // Handle dialog open/close
  const handleOpenCreateDialog = () => {
    // Refresh available teachers when opening the dialog
    const fetchTeachersAndClasses = async () => {
      setIsLoadingTeachers(true);
      try {
        // Fetch all teachers
        const teachersResponse = await axios.get('http://fams.io.vn/api-nodejs/teachers/search?search=&page=1&limit=100');
        
        // Fetch all classes to get list of homeroom teachers
        const classesResponse = await axios.get('http://fams.io.vn/api-nodejs/classes?search=&academicYear=');
        
        if (teachersResponse.data.success && classesResponse.data.success) {
          const allTeachers = teachersResponse.data.data;
          
          // Extract all homeroom teacher IDs from classes
          const assignedTeacherIds = new Set(
            classesResponse.data.data.map((classData: ClassData) => classData.homeroomTeacherId)
          );
          
          // Filter out teachers who are already homeroom teachers
          const availableTeachers = allTeachers.filter(
            (teacher: Teacher) => !assignedTeacherIds.has(teacher.userId)
          );
          
          setAvailableTeachers(availableTeachers);
        }
      } catch (error) {
        console.error("Error refreshing teachers data:", error);
      } finally {
        setIsLoadingTeachers(false);
      }
    };
    
    fetchTeachersAndClasses();
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

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Show notification
  const showNotification = (message: string, severity: "success" | "error" | "info" | "warning") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
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

  // Handle teacher autocomplete change
  const handleTeacherChange = (event: React.SyntheticEvent, value: Teacher | null) => {
    setClassInfo({
      ...classInfo,
      homeroomTeacherId: value ? value.userId : ""
    });
    
    // Check if there are no available teachers
    if (availableTeachers.length === 0 && !isLoadingTeachers) {
      showNotification("No available teachers found. All teachers are already assigned as homeroom teachers for other classes.", "warning");
    }
  };

  // Check if class already exists
  const isClassDuplicate = () => {
    return allClasses.some(
      (cls: ClassData) => 
        cls.className === classInfo.className && 
        cls.academicYear === classInfo.academicYear
    );
  };

  // Handle next to preview
  const handleNextToPreview = async () => {
    // Check if class already exists
    if (isClassDuplicate()) {
      showNotification(`Class ${classInfo.className} already exists in academic year ${classInfo.academicYear}. Please create a different class.`, "error");
      return;
    }

    // Clear any previously selected users
    setSelectedStudents([]);
    setSelectedTeachers([]);
    
    // Reset filters
    setSearchTerm("");
    setTeacherSearchTerm("");
    
    // Đặt mặc định là hiển thị học sinh chưa có lớp
    setAcademicYearFilter("2024-2025");
    setClassFilter("no_class");
    
    // Set role filter to "student" to show all students initially
    setRoleFilter("student");
    
    // Fetch students from API with default parameters to show students without class
    await handler.fetchUsers("", "student", "2024-2025", "", true, false);
    
    // Fetch all available classes for this academic year
    await fetchClassesForFilter("2024-2025");
    
    // Move to the next tab
    setTabValue(1);
  };

  // Thêm hàm mới để lấy danh sách lớp học cho bộ lọc
  const fetchClassesForFilter = async (academicYear: string) => {
    try {
      const response = await axios.get(`http://fams.io.vn/api-nodejs/classes?academicYear=${academicYear}`);
      if (response.data.success) {
        // Cập nhật state với danh sách lớp cho bộ lọc
        setAvailableClassesForFilter(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching classes for filter:", error);
    }
  };

  // Handle search change
  const handleSearchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Thêm hàm mới để xử lý việc tìm kiếm học sinh
  const handleSearchStudents = async () => {
    // Xử lý các trường hợp đặc biệt
    const searchParams: {
      searchTerm: string,
      role: string,
      academicYear?: string,
      className?: string,
      noClass?: boolean,
      noAcademicYear?: boolean
    } = {
      searchTerm: searchTerm,
      role: "student"
    };
    
    // Xử lý tham số năm học
    if (academicYearFilter === "no_academic_year") {
      searchParams.noAcademicYear = true;
    } else if (academicYearFilter) {
      searchParams.academicYear = academicYearFilter;
    }
    
    // Xử lý tham số lớp học
    if (classFilter === "no_class") {
      searchParams.noClass = true;
    } else if (classFilter) {
      searchParams.className = classFilter;
    }
    
    // Gọi API với các tham số đã xử lý
    await handler.fetchUsers(
      searchParams.searchTerm,
      searchParams.role,
      searchParams.academicYear || "",
      searchParams.className || "",
      searchParams.noClass,
      searchParams.noAcademicYear
    );
  };

  // Handle role filter change - updated to use SelectChangeEvent
  const handleRoleFilterChange = async (event: SelectChangeEvent) => {
    const value = event.target.value;
    setRoleFilter(value);
    await handler.fetchUsers(searchTerm, value);
  };

  // Handle user selection
  const handleToggleUserSelection = (user: any) => {
    const isSelected = selectedTeachers.some((t: any) => t.id === user.id);
    
    if (isSelected) {
      setSelectedTeachers(selectedTeachers.filter((t: any) => t.id !== user.id));
    } else {
      setSelectedTeachers([...selectedTeachers, user]);
    }
  };

  // Create class with selected users
  const handleCreateClass = async () => {
    // Check again if class already exists (in case it was created in another session while dialog was open)
    if (isClassDuplicate()) {
      showNotification(`Class ${classInfo.className} already exists in academic year ${classInfo.academicYear}. Please create a different class.`, "error");
      return;
    }

    // Combine selected students and teachers
    const selectedUsers = [...selectedStudents, ...selectedTeachers];
    
    // Gọi API để tạo lớp
    const result = await handler.handleCreateClass(classInfo, selectedUsers);
    
    if (result.success) {
      // Hiển thị thông báo thành công
      showNotification(result.message, "success");
      
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

      // Refresh class list
      const fetchClasses = async () => {
        try {
          const response = await axios.get('http://fams.io.vn/api-nodejs/classes?search=&academicYear=');
          if (response.data.success) {
            setAllClasses(response.data.data);
          }
        } catch (error) {
          console.error("Error fetching classes:", error);
        }
      };
      fetchClasses();
    } else {
      // Hiển thị thông báo lỗi
      showNotification(result.message, "error");
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
    
    // Không cần lọc thêm vì API đã xử lý việc lọc theo academicYear và className
    return true;
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
    const isSelected = selectedStudents.some((s: any) => s.id === student.id);
    
    if (isSelected) {
      setSelectedStudents(selectedStudents.filter((s: any) => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  // Handle teacher selection
  const handleToggleTeacherSelection = (teacher: any) => {
    const isSelected = selectedTeachers.some((t: any) => t.id === teacher.id);
    
    if (isSelected) {
      setSelectedTeachers(selectedTeachers.filter((t: any) => t.id !== teacher.id));
    } else {
      setSelectedTeachers([...selectedTeachers, teacher]);
    }
  };

  // Handle academic year filter change
  const handleAcademicYearFilterChange = (event: SelectChangeEvent) => {
    const newAcademicYear = event.target.value;
    setAcademicYearFilter(newAcademicYear);
    
    // Nếu chọn "No Academic Year", không cần tải danh sách lớp
    if (newAcademicYear === "no_academic_year") {
      setAvailableClassesForFilter([]);
      setClassFilter("no_class"); // Tự động chọn "No Class" khi chọn "No Academic Year"
    } else {
      // Tải lại danh sách lớp khi thay đổi năm học
      fetchClassesForFilter(newAcademicYear);
      // Reset class filter nếu đang là "no_class"
      if (classFilter === "no_class") {
        setClassFilter("");
      }
    }
  };

  // Handle class filter change
  const handleClassFilterChange = (event: SelectChangeEvent) => {
    const newClassFilter = event.target.value;
    setClassFilter(newClassFilter);
    
    // Nếu chọn "No Class", không cần làm gì thêm
    // Các xử lý khác sẽ được thực hiện khi nhấn nút Search
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
              tableMainData={state.classMainData as any}
              tableTitle={state.tableTitle}
              isCheckBox={state.isCheckBox}
              isAdmin={true}
              isClassManagement={true}
              setFiltersClass={handler.setFiltersClass}
              classOptions={state.classOptions}
              availableAcademicYears={state.academicYearOptions}
              classYears={state.classYears}
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
            <Tab label="Add Students" disabled={!classInfo.className || !classInfo.grade} />
          </Tabs>
          
          {tabValue === 0 && (
            <Box sx={{ mt: 3, p: 2 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Note: When selecting a homeroom teacher, only teachers who are not currently assigned as homeroom teacher for any class will be displayed.
                </Typography>
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
                      {academicYearOptions.map((year) => (
                        <MenuItem key={year} value={year}>{year}</MenuItem>
                      ))}
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
                    label="Class Name"
                    name="className"
                    value={classInfo.className}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <Autocomplete
                    id="teacher-autocomplete"
                    options={availableTeachers}
                    loading={isLoadingTeachers}
                    getOptionLabel={(option) => `${option.userId} - ${option.fullName}`}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Homeroom Teacher"
                        required
                        helperText={`${availableTeachers.length} available teachers who are not assigned as homeroom teachers`}
                        placeholder="Type to search teachers..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoadingTeachers ? <span>Loading...</span> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    onChange={handleTeacherChange}
                    isOptionEqualToValue={(option, value) => option.userId === value.userId}
                    filterOptions={(options, state) => {
                      const inputValue = state.inputValue.toLowerCase().trim();
                      if (inputValue === '') {
                        return options;
                      }
                      
                      return options.filter(
                        (option) => 
                          option.fullName.toLowerCase().includes(inputValue) || 
                          option.userId.toLowerCase().includes(inputValue)
                      );
                    }}
                  />
                </div>
              </div>
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box sx={{ mt: 3 }}>
              <Box mb={2}>
                <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, whiteSpace: 'normal', overflow: 'visible' }}>
                    Selected Class Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 50%', minWidth: '250px' }}>
                      <Typography variant="body1" sx={{ mb: 1, whiteSpace: 'normal', overflow: 'visible' }}>
                        <strong>Class Name:</strong> {classInfo.className}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1, whiteSpace: 'normal', overflow: 'visible' }}>
                        <strong>Grade:</strong> {classInfo.grade}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 50%', minWidth: '250px' }}>
                      <Typography variant="body1" sx={{ mb: 1, whiteSpace: 'normal', overflow: 'visible' }}>
                        <strong>Academic Year:</strong> {classInfo.academicYear}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1, whiteSpace: 'normal', overflow: 'visible' }}>
                        <strong>Homeroom Teacher:</strong> {
                          teachers.find(t => t.userId === classInfo.homeroomTeacherId)?.fullName || classInfo.homeroomTeacherId
                        }
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
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
                    value={academicYearFilter || "2024-2025"}
                    onChange={handleAcademicYearFilterChange}
                    label="Academic Year"
                  >
                    <MenuItem value="no_academic_year">No Academic Year</MenuItem>
                    {academicYearOptions.map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={classFilter || ""}
                    onChange={handleClassFilterChange}
                    label="Class"
                  >
                    <MenuItem value="">All Classes</MenuItem>
                    <MenuItem value="no_class">No Class</MenuItem>
                    {/* Sử dụng danh sách lớp từ API */}
                    {availableClassesForFilter.map((cls: { classId: string | number, className: string }) => (
                      <MenuItem key={cls.classId} value={cls.className}>
                        {cls.className}
                        </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  onClick={handleSearchStudents} 
                  startIcon={<SearchIcon />}
                >
                  Search
                </Button>
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
                            <TableCell>{student.name || student.fullName}</TableCell>
                            <TableCell>{student.studentId || student.id}</TableCell>
                            <TableCell>{student.gender}</TableCell>
                            <TableCell>
                              {/* Hiển thị năm học từ các lớp của học sinh */}
                              {student.classes && student.classes.length > 0 
                                ? student.classes.map((c: {academicYear: string}) => c.academicYear).join(', ')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {/* Hiển thị tên lớp từ các lớp của học sinh */}
                              {student.classes && student.classes.length > 0 
                                ? student.classes.map((c: {className: string}, idx: number) => (
                                  <span key={idx}>{c.className}{idx < student.classes.length - 1 ? ', ' : ''}</span>
                                ))
                                : '-'}
                            </TableCell>
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

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </LayoutComponent>
  );
}
export default ClassManagementPage;
