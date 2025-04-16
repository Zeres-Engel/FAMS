import React from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
import "./HomePage.scss";
import LayoutComponent from "../../components/Layout/Layout";

function HomePage(): React.JSX.Element {
  // Fake user data (can replace with real user info from API later)
  const userInfo = {
    className: "10A1",
    batchYear: "2022 - 2025",
    grade: "10",
  };

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
        {/* Welcome Title */}
        <Typography variant="h4" fontWeight="bold" color="primary">
          Welcome to School Portal
        </Typography>

        <Typography variant="body1" maxWidth={900}>
          Whether you're a student, teacher, or parent, this dashboard helps you stay on top of classes, attendance, updates,
          and academic progress — all in one place.
        </Typography>

        <Divider sx={{ width: "100%", my: 2 }} />

        {/* User Info Cards */}
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

        <Divider sx={{ width: "100%", my: 3 }} />

        {/* Features Overview */}
        <Box sx={{ maxWidth: 900, textAlign: "left" }}>
          <Typography variant="h5" color="primary" gutterBottom>
            🌟 What You Can Do Here
          </Typography>
          <ul>
            <li><Typography variant="body1">View your personal schedule and upcoming classes.</Typography></li>
            <li><Typography variant="body1">Check attendance records and performance.</Typography></li>
            <li><Typography variant="body1">Receive important announcements from your school.</Typography></li>
            <li><Typography variant="body1">Parents can track their child’s academic progress.</Typography></li>
          </ul>
        </Box>

        {/* Quick Tips */}
        <Box sx={{ maxWidth: 900, textAlign: "left", mt: 3 }}>
          <Typography variant="h5" color="primary" gutterBottom>
            🚀 Quick Tips
          </Typography>
          <ol>
            <li><Typography variant="body1">Check your <strong>Schedule</strong> tab to see today’s classes.</Typography></li>
            <li><Typography variant="body1">Visit <strong>Attendance</strong> to monitor presence or absence.</Typography></li>
            <li><Typography variant="body1">Go to <strong>Notifications</strong> for important updates.</Typography></li>
          </ol>
        </Box>
      </Box>
    </LayoutComponent>
  );
}

export default HomePage;
