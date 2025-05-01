import React from "react";
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
import { useAppSelector } from "../../store/useStoreHook";

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
  { year: "2020", Present: 160, Late: 20, Absent: 20 },
  { year: "2021", Present: 170, Late: 15, Absent: 15 },
  { year: "2022", Present: 175, Late: 10, Absent: 15 },
  { year: "2023", Present: 180, Late: 8, Absent: 12 },
  { year: "2024", Present: 185, Late: 6, Absent: 9 },
];

// Sample notifications
const notifications = [
  { message: "Meeting at 10 AM", sender: "Admin", sendDate: "2025-04-28" },
  { message: "Submit homework", sender: "Teacher", sendDate: "2025-04-27" },
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
                ? "📅 Today's Teaching Schedule"
                : role === "parent"
                ? "📅 Children's Schedule"
                : "📅 Today's Schedule"}
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
              {role === "parent" ? (
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
                  {schedule.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={item.subject}
                        secondary={item.time}
                        primaryTypographyProps={{ fontWeight: "bold" }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
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
            childrenSchedules.map((child, idx) => (
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
                    🧮 {child.childName}'s Attendance This Month
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
                    📊 {child.childName}'s Attendance Rate Over the Years
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
