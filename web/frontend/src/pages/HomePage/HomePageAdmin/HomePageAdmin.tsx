import React from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
import "./HomePageAdmin.scss";
import LayoutComponent from "../../../components/Layout/Layout";

function HomePageAdmin(): React.JSX.Element {
  // Fake stats (you can replace with actual API data via useEffect later)
  const stats = {
    totalUsers: 120,
    students: 80,
    teachers: 25,
    classes: 10,
    parents: 10,
    notifications: 5,
  };

  return (
    <LayoutComponent pageHeader="Home Page Admin">
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
          School Management System Dashboard
        </Typography>

        {/* System Overview */}
        <Typography variant="body1" maxWidth={900}>
          Welcome to the central hub for school administrators. Our system is designed to streamline and simplify 
          day-to-day school operations, offering powerful tools to manage classes, schedules, attendance, 
          users, notifications, and more — all in one place, accessible anytime, anywhere.
        </Typography>

        <Divider sx={{ width: "100%", my: 2 }} />

        {/* System Statistics */}
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
            { label: "Total Users", value: stats.totalUsers, emoji: "🔢" },
            { label: "Students", value: stats.students, emoji: "🎓" },
            { label: "Teachers", value: stats.teachers, emoji: "👨‍🏫" },
            { label: "Parents", value: stats.parents, emoji: "👪" },
            { label: "Classes", value: stats.classes, emoji: "🏫" },
            { label: "Notifications", value: stats.notifications, emoji: "📢" },
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

        <Divider sx={{ width: "100%", my: 3 }} />
        {/* Key Benefits */}
        <Box sx={{ maxWidth: 900, textAlign: "left" }}>
          <Typography variant="h5" color="primary" gutterBottom>
            🌟 Key Benefits
          </Typography>
          <ul>
            <li><Typography variant="body1">User-friendly interface optimized for desktops and mobile devices.</Typography></li>
            <li><Typography variant="body1">Centralized management of all school operations.</Typography></li>
            <li><Typography variant="body1">Real-time attendance tracking and reporting.</Typography></li>
            <li><Typography variant="body1">Secure and role-based access control.</Typography></li>
            <li><Typography variant="body1">Quick setup and easy maintenance.</Typography></li>
          </ul>
        </Box>

        {/* Feature Highlights */}
        <Box sx={{ maxWidth: 900, textAlign: "left" }}>
          <Typography variant="h5" color="primary" gutterBottom>
            🧩 Feature Highlights
          </Typography>

          {[
            {
              title: "Profile Management",
              desc: "Update your personal profile and manage staff information."
            },
            {
              title: "System Configuration",
              desc: "Control system-wide settings and customize workflows."
            },
            {
              title: "User Management",
              desc: "Handle accounts of teachers, students, and staff efficiently."
            },
            {
              title: "Schedule Management",
              desc: "Design and update class schedules, assign subjects and rooms."
            },
            {
              title: "Class Management",
              desc: "Oversee class lists, student enrollments, and more."
            },
            {
              title: "Attendance Management",
              desc: "Monitor and export attendance reports with flexible filters."
            },
            {
              title: "Notification System",
              desc: "Send timely updates and alerts to staff and students."
            },
          ].map((item, index) => (
            <Box key={index} sx={{ my: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium" color="secondary">
                🔹 {item.title}
              </Typography>
              <Typography variant="body2" sx={{ pl: 2 }}>{item.desc}</Typography>
            </Box>
          ))}
        </Box>

        {/* Quick Start Guide */}
        <Box sx={{ maxWidth: 900, textAlign: "left", mt: 3 }}>
          <Typography variant="h5" color="primary" gutterBottom>
            🚀 Quick Start Guide
          </Typography>
          <Typography variant="body1">
            New here? Follow these simple steps:
          </Typography>
          <ol>
            <li><Typography variant="body1">Go to <strong>Profile</strong> and complete your personal information.</Typography></li>
            <li><Typography variant="body1">Visit <strong>User Management</strong> to add or update users.</Typography></li>
            <li><Typography variant="body1">Create schedules via <strong>Schedule Management</strong>.</Typography></li>
            <li><Typography variant="body1">Check and export reports under <strong>Attendance Management</strong>.</Typography></li>
            <li><Typography variant="body1">Use <strong>Notify Management</strong> to share announcements.</Typography></li>
          </ol>
        </Box>
      </Box>
    </LayoutComponent>
  );
}

export default HomePageAdmin;
