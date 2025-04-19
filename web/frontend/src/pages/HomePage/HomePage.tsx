import React from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
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
import LayoutComponent from "../../components/Layout/Layout";
import "./HomePage.scss";

// Màu sắc cho pie chart
const COLORS = ["#4caf50", "#ff9800", "#f44336"];

function HomePage(): React.JSX.Element {
  // Fake user info
  const userInfo = {
    className: "10A1",
    batchYear: "2022 - 2025",
    grade: "10",
  };

  // Fake attendance data
  const attendanceStats = [
    { name: "Present", value: 180 },
    { name: "Late", value: 15 },
    { name: "Absent", value: 5 },
  ];

  // Fake attendance rate by year
  const attendanceRateByYear = [
    { year: "2020", Present: 160, Late: 20, Absent: 20 },
    { year: "2021", Present: 170, Late: 15, Absent: 15 },
    { year: "2022", Present: 175, Late: 10, Absent: 15 },
    { year: "2023", Present: 180, Late: 8, Absent: 12 },
    { year: "2024", Present: 185, Late: 6, Absent: 9 },
  ];

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
        {/* Title */}
        <Typography variant="h4" fontWeight="bold" color="primary">
          Welcome to Your School Portal 🎓
        </Typography>

        <Typography variant="body1" maxWidth={900}>
          Stay informed and on top of your academic progress. Track attendance,
          view results, and check key updates from your school.
        </Typography>

        <Divider sx={{ width: "100%", my: 3 }} />

        {/* Student Info Cards */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 2,
            width: "100%",
            maxWidth: 1000,
          }}
        >
          {[
            { label: "Class Name", value: userInfo.className, emoji: "🏫" },
            { label: "Batch Year", value: userInfo.batchYear, emoji: "📅" },
            { label: "Grade", value: userInfo.grade, emoji: "🎓" },
          ].map((item, index) => (
            <Paper
              key={index}
              elevation={3}
              sx={{
                p: 2,
                width: 200,
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

        {/* Pie Chart - Attendance */}
        <Box sx={{ width: "100%", maxWidth: 500, mt: 4 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            🧮 Attendance Overview
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

        {/* Bar Chart - Pass Rate */}
        {/* Bar Chart - Attendance Rate Over Years */}
        {/* Bar Chart - Attendance Rate Over the Years */}
        {/* <Box sx={{ width: "100%", maxWidth: 800, mt: 4 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            📊 Attendance Rate Over the Years
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
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
        </Box> */}

        <Divider sx={{ width: "100%", my: 3 }} />

        {/* Quick Tips */}
        {/* <Box sx={{ maxWidth: 900, textAlign: "left" }}>
          <Typography variant="h5" color="primary" gutterBottom>
            🔍 Quick Tips
          </Typography>
          <ol>
            <li>
              <Typography variant="body1">
                Check your <strong>Schedule</strong> tab to see today’s classes.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                View <strong>Attendance</strong> for a detailed record.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Visit <strong>Notifications</strong> to get the latest updates.
              </Typography>
            </li>
          </ol>
        </Box> */}
      </Box>
    </LayoutComponent>
  );
}

export default HomePage;
