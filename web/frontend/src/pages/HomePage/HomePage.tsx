import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { CheckCircle } from "@mui/icons-material";
import LayoutComponent from "../../components/Layout/Layout";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { fetchSchedules } from "../../store/slices/scheduleSlice";

// Sample data
const COLORS = ["#4caf50", "#ff9800", "#f44336"];

// Sample schedule for student/teacher
const schedule = [
  { time: "08:00 - 09:00", subject: "Toán" },
  { time: "09:15 - 10:15", subject: "Văn" },
  { time: "10:30 - 11:30", subject: "Anh" },
];

// Sample children schedule for parent
const childrenSchedules = [
  {
    childName: "hungdnst2",
    schedule: [
      { time: "08:00 - 09:00", subject: "Toán" },
      { time: "09:15 - 10:15", subject: "Văn" },
    ],
  },
  {
    childName: "thanhnspt1",
    schedule: [
      { time: "08:00 - 09:00", subject: "Lý" },
      { time: "10:30 - 11:30", subject: "Hóa" },
    ],
  },
];

// Sample attendance data
const attendanceStats = [
  { name: "Present", value: 180 },
  { name: "Late", value: 15 },
  { name: "Absent", value: 5 },
];

const attendanceRateByYear = [
  { year: "2023", Present: 180, Late: 8, Absent: 12 },
  { year: "2024", Present: 185, Late: 6, Absent: 9 },
];

// Sample notifications
const notifications = [
  { message: "Meeting at 10 AM", sender: "Admin", sendDate: "2025-04-28" },
  // { message: "Submit homework", sender: "Teacher", sendDate: "2025-04-27" },
];

// Attendance rules
const attendanceRules = [
  "Late arrival over 15 minutes counts as absent.",
  "Unexcused absence affects attendance score.",
  "Provide valid reasons for absences.",
];

// Assume role comes from context

function HomePage(): React.JSX.Element {
  const userData = useAppSelector(state => state.login.loginData);
  const role = userData?.role || "student";
  const dispatch = useAppDispatch();
  const scheduleData = useSelector(
    (state: RootState) => state.schedule.schedules
  );
  const parentData = useSelector((state: RootState) => state.parentData.data);
  const childrenList = React.useMemo(() => {
  if (!Array.isArray(parentData)) return [];
  interface Child {
    studentId: string;
    userId: string;
    fullName: string;
    gender: string;
    dateOfBirth: string;
    batchId: string;
    classes: string[];
    relationship: string;
  }

  interface ParentDetails {
    children: Child[];
  }

  interface ParentData {
    details?: ParentDetails;
  }

  return (parentData as ParentData[]).flatMap((parent: ParentData) =>
    parent.details && Array.isArray(parent.details.children)
      ? parent.details.children.map((child: Child) => ({
          studentId: child.studentId,
          userId: child.userId,
          fullName: child.fullName,
          gender: child.gender,
          dateOfBirth: child.dateOfBirth,
          batchId: child.batchId,
          classes: child.classes,
          relationship: child.relationship,
        }))
      : []
  );
}, [parentData]);
  const nearestSchedules = React.useMemo(() => {
    if (!Array.isArray(scheduleData)) return [];
    const now = new Date();
    // Sắp xếp theo khoảng cách tuyệt đối tới hiện tại
    const filtered = scheduleData
      .filter(item => item.sessionDate)
      .sort(
        (a, b) =>
          Math.abs(new Date(a.sessionDate).getTime() - now.getTime()) -
          Math.abs(new Date(b.sessionDate).getTime() - now.getTime())
      );
    return filtered.slice(0, 3);
  }, [scheduleData]);
  const scheduleFormattedData = nearestSchedules.map(item => ({
    className: item.className,
    subject: item.subjectName,
    time: `${item.startTime} - ${item.endTime}`,
    teacherName: item.teacherName,
    classroomNumber: item.classroomNumber,
    sessionDate: item.sessionDate
      ? new Date(item.sessionDate).toLocaleDateString("vi-VN")
      : "",
  }));

  useEffect(() => {
    if (role !== "admin") {
      dispatch(
        fetchSchedules({
          userId: userData?.userId,
          fromDate: "2023-01-01",
          toDate: "2025-12-31",
        })
      );
    }
  }, [dispatch, userData, role]);
  return (
    <LayoutComponent pageHeader="Home Page">
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          textAlign: "center",
        }}
      >
        {/* Divider */}
        <Divider sx={{ width: "100%", my: 3 }} />

        {/* Schedule and Attendance Rules */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 4,
            width: "100%",
            maxWidth: 1000,
          }}
        >
          {/* Schedule Section */}
          <Box sx={{ flex: "1 1 400px", minWidth: "300px" }}>
            <Typography variant="h6" gutterBottom color="primary">
              {role === "teacher"
                ? "📅 Nearest Teaching Schedule"
                : role === "parent"
                ? "📅 Children's Nearest Schedule"
                : "📅 Nearest Schedule"}
            </Typography>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
                backgroundColor: "#fff",
              }}
            >
              <List dense>
                {scheduleFormattedData.map((item, index) => (
                  <ListItem key={index} alignItems="flex-start">
                    <ListItemText
                      primary={
                        <span>
                          <b>{item.subject}</b> &nbsp;
                          <span style={{ color: "#888" }}>
                            ({item.className})
                          </span>
                        </span>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            📅 {item.sessionDate}
                          </Typography>
                          <br />
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            🕒 {item.time}
                          </Typography>
                          <br />
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            👨‍🏫 {item.teacherName}
                          </Typography>
                          <br />
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                          >
                            🏫 {item.classroomNumber}
                          </Typography>
                        </>
                      }
                      primaryTypographyProps={{ fontWeight: "bold" }}
                    />
                  </ListItem>
                ))}
              </List>
              {/* {role === "parent" ? (
                <>
                  {childrenSchedules.map((child, idx) => (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        color="secondary"
                        gutterBottom
                      >
                        {child.childName}
                      </Typography>
                      <List dense>
                        {child.schedule.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={item.subject}
                              secondary={item.time}
                              primaryTypographyProps={{ fontWeight: "bold" }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  ))}
                </>
              ) : (
                <List dense>
                  {scheduleFormattedData.map((item, index) => (
                    <ListItem key={index} alignItems="flex-start">
                      <ListItemText
                        primary={
                          <span>
                            <b>{item.subject}</b> &nbsp;
                            <span style={{ color: "#888" }}>
                              ({item.className})
                            </span>
                          </span>
                        }
                        secondary={
                          <>
                            <div>🕒 {item.time}</div>
                            <div>👨‍🏫 {item.teacherName}</div>
                            <div>🏫 {item.classroomNumber}</div>
                          </>
                        }
                        primaryTypographyProps={{ fontWeight: "bold" }}
                      />
                    </ListItem>
                  ))}
                </List>
              )} */}
            </Paper>
          </Box>

          {/* Attendance Rules */}
          <Box sx={{ flex: "1 1 400px", minWidth: "300px" }}>
            <Typography variant="h6" gutterBottom color="primary">
              📌 Attendance Rules
            </Typography>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)",
                backgroundColor: "#fff",
              }}
            >
              <List dense>
                {attendanceRules.map((rule, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={rule} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </Box>

        <Divider sx={{ width: "100%", my: 3 }} />

        {/* Latest Notifications */}
        <Box sx={{ width: "100%", maxWidth: 800 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            🛎️ Latest Notifications
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Message</TableCell>
                  <TableCell>Sender</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.map((note, index) => (
                  <TableRow key={index}>
                    <TableCell>{note.message}</TableCell>
                    <TableCell>{note.sender}</TableCell>
                    <TableCell>{note.sendDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Divider sx={{ width: "100%", my: 3 }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            width: "100%",
            maxWidth: 1000,
          }}
        >
          {role === "parent" ? (
            childrenList.map((child, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 4,
                  justifyContent: "center",
                }}
              >
                {/* Child's Attendance Pie Chart */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    🧮 {child.fullName}'s Attendance This Month
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={attendanceStats} // Bạn sẽ cần thay bằng attendanceStats riêng cho mỗi child nếu có
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {attendanceStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>

                {/* Child's Attendance Rate Over the Years */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    📊 {child.fullName}'s Attendance Rate Over the Years
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={attendanceRateByYear} // Bạn sẽ cần thay bằng data riêng cho mỗi child nếu có
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Present" fill="#4caf50" />
                      <Bar dataKey="Late" fill="#ff9800" />
                      <Bar dataKey="Absent" fill="#f44336" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            ))
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 4,
                justifyContent: "center",
              }}
            >
              {/* Attendance Pie Chart */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  🧮 Attendance This Month
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={attendanceStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {attendanceStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {/* Attendance Rate Bar Chart */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  📊 Attendance Rate Over the Years
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={attendanceRateByYear}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Present" fill="#4caf50" />
                    <Bar dataKey="Late" fill="#ff9800" />
                    <Bar dataKey="Absent" fill="#f44336" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </LayoutComponent>
  );
}

export default HomePage;
