import React from "react";
import { 
  Box, Typography, Divider, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  List, ListItem, ListItemIcon, ListItemText 
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import LayoutComponent from "../../../components/Layout/Layout";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

function HomePageAdmin(): React.JSX.Element {
  const stats = {
    totalUsers: 120,
    students: 80,
    teachers: 25,
    parents: 10,
    others: 5,
  };

  const roleData = [
    { name: "Students", value: stats.students },
    { name: "Teachers", value: stats.teachers },
    { name: "Parents", value: stats.parents },
    { name: "Others", value: stats.others },
  ];

  const userTrendData = [
    { year: "2020", students: 40, teachers: 10 },
    { year: "2021", students: 55, teachers: 15 },
    { year: "2022", students: 65, teachers: 18 },
    { year: "2023", students: 72, teachers: 22 },
    { year: "2024", students: 80, teachers: 25 },
  ];

  const notifyData = [
    { message: "Bạn Hùng đi trễ", sender: "anbttc12", sendDate: "2025-04-28" },
    { message: "New class schedule updated", sender: "Admin", sendDate: "2025-04-27" },
  ];

  const attendanceRules = [
    "Check-in within 5 minutes → Present",
    "Check-in between 5-15 minutes → Late",
    "Check-in after 15 minutes → Absent",
  ];

  return (
    <LayoutComponent pageHeader="Admin Dashboard">
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* Title */}
        <Divider sx={{ width: "100%", my: 3 }} />

        {/* Summary Statistics */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 2,
            width: "100%",
            maxWidth: 1000,
            mx: "auto",
          }}
        >
          {[
            { label: "Total Users", value: stats.totalUsers, emoji: "🔢" },
            { label: "Students", value: stats.students, emoji: "🎓" },
            { label: "Teachers", value: stats.teachers, emoji: "👨‍🏫" },
            { label: "Parents", value: stats.parents, emoji: "👪" },
            { label: "Others", value: stats.others, emoji: "🧑‍💼" },
          ].map((item, index) => (
            <Paper
              key={index}
              elevation={3}
              sx={{
                p: 2,
                width: 180,
                textAlign: "center",
                borderRadius: 2,
                backgroundColor: "#f5f5f5",
              }}
            >
              <Typography variant="h5" fontWeight="bold" color="primary">
                {item.emoji} {item.value}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                {item.label}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Notify and Attendance Rules */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 4,
            width: "100%",
            justifyContent: "center",
          }}
        >
          {/* Notify Table */}
          <Box sx={{ flex: "1 1 400px", minWidth: "300px" }}>
            <Typography variant="h6" gutterBottom color="primary">
              🛎️ Latest Notifications
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Message</TableCell>
                    <TableCell>Sender</TableCell>
                    <TableCell>Send Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {notifyData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.message}</TableCell>
                      <TableCell>{item.sender}</TableCell>
                      <TableCell>{item.sendDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Attendance Rules List */}
          <Box sx={{ flex: "1 1 400px", minWidth: "300px" }}>
            <Typography variant="h6" gutterBottom color="primary">
              📋 Attendance Rules
            </Typography>
            <Paper sx={{ p: 2 }}>
              <List>
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

        {/* Top Charts */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 4,
            width: "100%",
          }}
        >
          {/* Pie Chart */}
          <Box sx={{ flex: "1 1 400px", minWidth: "300px" }}>
            <Typography variant="h6" gutterBottom color="primary" textAlign="center">
              📊 User Distribution by Role
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleData}
                  dataKey="value"
                  nameKey="name"
                  cx="40%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {roleData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Line Chart */}
          <Box sx={{ flex: "1 1 400px", minWidth: "300px" }}>
            <Typography variant="h6" gutterBottom color="primary" textAlign="center">
              📈 User Growth Over the Years
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="#8884d8"
                  name="Students"
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="teachers"
                  stroke="#82ca9d"
                  name="Teachers"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Bottom Charts: Attendance Summary and Class Overview */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 4,
            width: "100%",
          }}
        >
          {/* Attendance Summary Bar Chart */}
          <Box sx={{ flex: "1 1 400px", minWidth: "300px" }}>
            <Typography variant="h6" gutterBottom color="primary" textAlign="center">
              📝 Attendance Summary
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: "Today", present: 45, late: 5, absent: 2 },
                { name: "This Week", present: 250, late: 20, absent: 10 },
                { name: "This Month", present: 1000, late: 80, absent: 50 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" stackId="a" fill="#82ca9d" name="Present" />
                <Bar dataKey="late" stackId="a" fill="#ffc658" name="Late" />
                <Bar dataKey="absent" stackId="a" fill="#ff7f50" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Class Overview Bar Chart */}
          <Box sx={{ flex: "1 1 400px", minWidth: "300px" }}>
            <Typography variant="h6" gutterBottom color="primary" textAlign="center">
              🏫 Class Overview
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { class: "10A1", students: 20 },
                { class: "10A2", students: 18 },
                { class: "10A3", students: 21 },
                { class: "10A4", students: 19 },
                { class: "11A1", students: 17 },
                { class: "11A2", students: 22 },
                { class: "11A3", students: 23 },
                { class: "11A4", students: 17 },
                { class: "12A1", students: 20 },
                { class: "12A2", students: 19 },
                { class: "12A3", students: 21 },
                { class: "12A4", students: 18 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#8884d8" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Divider sx={{ width: "100%", my: 3 }} />
      </Box>
    </LayoutComponent>
  );
}

export default HomePageAdmin;
