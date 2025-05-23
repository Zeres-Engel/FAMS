import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
} from "@mui/material";

function NewSemesterManagement(): React.JSX.Element {
  const students = [
    { id: "stu1", name: "Student One", classId: "classA" },
    { id: "stu2", name: "Student Two", classId: "classB" },
  ];

  const teachers = [
    { id: "teach1", name: "Teacher A", classId: "classX" },
    { id: "teach2", name: "Teacher B", classId: "classY" },
  ];
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);

  const [searchStudentId, setSearchStudentId] = useState("");
  const [searchStudentClassId, setSearchStudentClassId] = useState("");

  const [searchTeacherId, setSearchTeacherId] = useState("");
  const [searchTeacherClassId, setSearchTeacherClassId] = useState("");

  const [filteredStudents, setFilteredStudents] = useState(students);
  const [filteredTeachers, setFilteredTeachers] = useState(teachers);

  const handleStudentCheckboxChange = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id)
        ? prev.filter(studentId => studentId !== id)
        : [...prev, id]
    );
  };

  const handleTeacherCheckboxChange = (id: string) => {
    setSelectedTeachers(prev =>
      prev.includes(id)
        ? prev.filter(teacherId => teacherId !== id)
        : [...prev, id]
    );
  };

  const handleSearchStudents = () => {
    const filtered = students.filter(
      student =>
        student.id.includes(searchStudentId) &&
        student.classId.includes(searchStudentClassId)
    );
    setFilteredStudents(filtered);
  };

  const handleSearchTeachers = () => {
    const filtered = teachers.filter(
      teacher =>
        teacher.id.includes(searchTeacherId) &&
        teacher.classId.includes(searchTeacherClassId)
    );
    setFilteredTeachers(filtered);
  };

  const handleSubmitStudents = () => {
    console.log("Selected Students:", selectedStudents);
  };

  const handleSubmitTeachers = () => {
    console.log("Selected Teachers:", selectedTeachers);
  };

  const isAllStudentsChecked =
    filteredStudents.length > 0 &&
    filteredStudents.every(s => selectedStudents.includes(s.id));

  const isAllTeachersChecked =
    filteredTeachers.length > 0 &&
    filteredTeachers.every(t => selectedTeachers.includes(t.id));

  const toggleAllStudents = () => {
    setSelectedStudents(prev => {
      if (isAllStudentsChecked) {
        // Bỏ chọn tất cả học sinh trong danh sách lọc
        return prev.filter(id => !filteredStudents.some(s => s.id === id));
      } else {
        // Thêm tất cả học sinh chưa được chọn
        const updated = [...prev];
        filteredStudents.forEach(s => {
          if (!updated.includes(s.id)) {
            updated.push(s.id);
          }
        });
        return updated;
      }
    });
  };

  const toggleAllTeachers = () => {
    setSelectedTeachers(prev => {
      if (isAllTeachersChecked) {
        // Bỏ chọn tất cả giáo viên trong danh sách lọc
        return prev.filter(id => !filteredTeachers.some(t => t.id === id));
      } else {
        // Thêm tất cả giáo viên chưa được chọn
        const updated = [...prev];
        filteredTeachers.forEach(t => {
          if (!updated.includes(t.id)) {
            updated.push(t.id);
          }
        });
        return updated;
      }
    });
  };

  return (
    <Box
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      gap={4}
      p={2}
      flexWrap="wrap"
    >
      {/* Student Section */}
      <Box
        flex={1}
        display="flex"
        flexDirection="column"
        gap={2}
        minWidth={300}
      >
        <Typography variant="h6" gutterBottom>
          Student List
        </Typography>
        <Box display="flex" gap={1}>
          <TextField
            label="User ID"
            fullWidth
            value={searchStudentId}
            onChange={e => setSearchStudentId(e.target.value)}
          />
          <TextField
            label="Class ID"
            fullWidth
            value={searchStudentClassId}
            onChange={e => setSearchStudentClassId(e.target.value)}
          />
          <Box display="flex" alignItems="center" justifyContent="center">
            <Button
              variant="contained"
              onClick={handleSearchStudents}
              sx={{
                width: { xs: "100%", sm: "100px" },
                height: "40px",
                fontSize: "16px",
                borderRadius: "8px",
                textTransform: "none",
                boxShadow: 3,
                "&:hover": { boxShadow: 6 },
              }}
            >
              Search
            </Button>
          </Box>
        </Box>
        <TableContainer
          sx={{
            border: "2px solid #ccc",
            boxShadow: 3,
          }}
          component={Paper}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllStudentsChecked}
                    onChange={toggleAllStudents}
                  />
                </TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Class ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map(student => (
                <TableRow
                  key={student.id}
                  sx={{
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                      cursor: "pointer",
                    },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleStudentCheckboxChange(student.id)}
                    />
                  </TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.id}</TableCell>
                  <TableCell>{student.classId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Button
            variant="contained"
            onClick={handleSubmitStudents}
            sx={{
              width: { xs: "100%", sm: "150px" },
              height: "40px",
              fontSize: "16px",
              borderRadius: "8px",
              textTransform: "none",
              boxShadow: 3,
              "&:hover": { boxShadow: 6 },
            }}
          >
            Submit Student
          </Button>
        </Box>
      </Box>

      {/* Teacher Section */}
      <Box
        flex={1}
        display="flex"
        flexDirection="column"
        gap={2}
        minWidth={300}
      >
        <Typography variant="h6" gutterBottom>
          Teacher List
        </Typography>
        <Box display="flex" gap={1}>
          <TextField
            label="User ID"
            fullWidth
            value={searchTeacherId}
            onChange={e => setSearchTeacherId(e.target.value)}
          />
          <TextField
            label="Class ID"
            fullWidth
            value={searchTeacherClassId}
            onChange={e => setSearchTeacherClassId(e.target.value)}
          />
          <Box display="flex" alignItems="center" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearchTeachers}
              sx={{
                width: { xs: "100%", sm: "100px" },
                height: "40px",
                fontSize: "16px",
                borderRadius: "8px",
                textTransform: "none",
                boxShadow: 3,
                "&:hover": {
                  boxShadow: 6,
                },
              }}
            >
              Search
            </Button>
          </Box>
        </Box>
        <TableContainer
          sx={{
            border: "2px solid #ccc",
            boxShadow: 3,
          }}
          component={Paper}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllTeachersChecked}
                    onChange={toggleAllTeachers}
                  />
                </TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Teacher ID</TableCell>
                <TableCell>Class ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeachers.map(teacher => (
                <TableRow
                  sx={{
                    "&:hover": {
                      backgroundColor: "#f5f5f5", 
                      cursor: "pointer",
                    },
                  }}
                  key={teacher.id}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedTeachers.includes(teacher.id)}
                      onChange={() => handleTeacherCheckboxChange(teacher.id)}
                    />
                  </TableCell>
                  <TableCell>{teacher.name}</TableCell>
                  <TableCell>{teacher.id}</TableCell>
                  <TableCell>{teacher.classId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="center" alignItems="center">
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitTeachers}
            sx={{
              width: { xs: "100%", sm: "150px" },
              height: "40px",
              fontSize: "16px",
              borderRadius: "8px",
              textTransform: "none",
              boxShadow: 3,
              "&:hover": {
                boxShadow: 6,
              },
            }}
          >
            Submit Teacher
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default NewSemesterManagement;
