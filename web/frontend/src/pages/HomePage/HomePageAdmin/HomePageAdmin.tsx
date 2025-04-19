import React from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
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
} from "recharts";
import LayoutComponent from "../../../components/Layout/Layout";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"];

function HomePageAdmin(): React.JSX.Element {
  // Fake data (thay bằng API sau này nếu cần)
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

  // Dữ liệu biến thiên người dùng theo năm
  const userTrendData = [
    { year: "2020", students: 40, teachers: 10 },
    { year: "2021", students: 55, teachers: 15 },
    { year: "2022", students: 65, teachers: 18 },
    { year: "2023", students: 72, teachers: 22 },
    { year: "2024", students: 80, teachers: 25 },
  ];

  return (
    <LayoutComponent pageHeader="Admin Dashboard">
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
        <Divider sx={{ width: "100%", my: 3 }} />
        {/* Summary Stats */}
        {/* <Box
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
        </Box> */}
        {/* Pie Chart: User Roles */}
        <Box sx={{ width: "100%", maxWidth: 800 }}>
          <Typography variant="h6" gutterBottom color="primary">
            📊 User Distribution by Role
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleData}
                dataKey="value"
                nameKey="name"
                cx="50%"
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
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Line Chart: User Growth */}
        <Box sx={{ width: "100%", maxWidth: 800, mt: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            📈 User Population Over the Years
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

        <Divider sx={{ width: "100%", my: 3 }} />
      </Box>
    </LayoutComponent>
  );
}

export default HomePageAdmin;
