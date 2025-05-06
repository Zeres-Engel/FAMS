import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import moment from "moment";

interface AttendanceViewProps {
  scheduleId: number | null;
  subjectName: string;
  className: string;
  teacher: string;
  date: Date;
  onBack: () => void;
  attendanceData: any[];
}

const AttendanceView: React.FC<AttendanceViewProps> = ({
  scheduleId,
  subjectName,
  className,
  teacher,
  date,
  onBack,
  attendanceData
}) => {
  const [tabValue, setTabValue] = useState(0);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" component="h2" gutterBottom>
            Attendance Management
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Subject: {subjectName} | Class: {className}
          </Typography>
          <Typography variant="subtitle2" gutterBottom>
            Teacher: {teacher} | Date: {moment(date).format('DD/MM/YYYY')}
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<span className="material-icons">arrow_back</span>}
          onClick={onBack}
        >
          Back to Schedule
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Attendance List" />
          <Tab label="Statistics" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student ID</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Check-in Time</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attendanceData.length > 0 ? (
                attendanceData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.studentId}</TableCell>
                    <TableCell>{row.fullName}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        bgcolor: row.status === 'Present' ? 'success.light' : row.status === 'Late' ? 'warning.light' : 'error.light',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block'
                      }}>
                        {row.status}
                      </Box>
                    </TableCell>
                    <TableCell>{row.checkInTime || '-'}</TableCell>
                    <TableCell>{row.notes || '-'}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <span className="material-icons">edit</span>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      No attendance data available. Please take attendance first.
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<span className="material-icons">add</span>}
                      sx={{ mt: 1 }}
                    >
                      Take Attendance
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Attendance Statistics</Typography>
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, width: '30%' }}>
              <Typography variant="h4" align="center">
                {attendanceData.filter(d => d.status === 'Present').length}
              </Typography>
              <Typography variant="body1" align="center">Present</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2, width: '30%' }}>
              <Typography variant="h4" align="center">
                {attendanceData.filter(d => d.status === 'Late').length}
              </Typography>
              <Typography variant="body1" align="center">Late</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 2, width: '30%' }}>
              <Typography variant="h4" align="center">
                {attendanceData.filter(d => d.status === 'Absent').length}
              </Typography>
              <Typography variant="body1" align="center">Absent</Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default AttendanceView; 