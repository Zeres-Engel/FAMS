import React, { useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Divider,
} from "@mui/material";

const sampleData = [
  {
    year: "2023-2024",
    semesters: [
      { name: "Semester 1", start: "2023-08-01", end: "2023-12-31" },
      { name: "Semester 2", start: "2024-01-10", end: "2024-05-25" },
    ],
  },
  {
    year: "2024-2025",
    semesters: [
      { name: "Semester 1", start: "2024-08-01", end: "2024-12-31" },
      { name: "Semester 2", start: "2025-05-10", end: "2025-10-25" },
    ],
  },
];

function AcademicYearSetting() {
  const [academicYears, setAcademicYears] = useState(sampleData);
  const [selectedYear, setSelectedYear] = useState(sampleData[0].year);
  const [newYearData, setNewYearData] = useState({
    year: "",
    semester: "Semester 1",
    start: "",
    end: "",
  });

  const now = dayjs();
  const currentYear = academicYears.find(y => y.year === selectedYear);

  const generateAcademicYearOptions = () => {
    const currentYear = now.year();
    return Array.from({ length: 6 }, (_, i) => {
      const start = currentYear + i;
      return `${start}-${start + 1}`;
    });
  };

  const handleDateChange = (index: number, field: "start" | "end", value: string) => {
    setAcademicYears(prev =>
      prev.map(y => {
        if (y.year !== selectedYear) return y;
        const updatedSemesters = y.semesters.map((s, i) => {
          const start = dayjs(s.start);
          const end = dayjs(s.end);
          const isFuture = now.isBefore(start);
          return i === index && isFuture ? { ...s, [field]: value } : s;
        });
        return { ...y, semesters: updatedSemesters };
      })
    );
  };

  const handleAddNew = () => {
    if (!newYearData.year || !newYearData.start || !newYearData.end) return;
    const yearExists = academicYears.find(y => y.year === newYearData.year);
    if (yearExists) return alert("Academic year already exists");

    const yearToAdd = {
      year: newYearData.year,
      semesters: [
        {
          name: newYearData.semester,
          start: newYearData.start,
          end: newYearData.end,
        },
      ],
    };

    setAcademicYears(prev => [...prev, yearToAdd]);
    setNewYearData({ year: "", semester: "Semester 1", start: "", end: "" });
  };

  const lastEnd = academicYears
    .flatMap(y => y.semesters)
    .filter(s => dayjs(s.end).isBefore(now))
    .sort((a, b) => dayjs(b.end).unix() - dayjs(a.end).unix())[0]?.end;

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Academic Year Setting
      </Typography>

      <TextField
        select
        label="Select Academic Year"
        value={selectedYear}
        onChange={e => setSelectedYear(e.target.value)}
        sx={{ mb: 3, minWidth: 200 }}
      >
        {academicYears.map(y => (
          <MenuItem key={y.year} value={y.year}>
            {y.year}
          </MenuItem>
        ))}
      </TextField>

      {currentYear && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6">{currentYear.year}</Typography>
            <Divider sx={{ my: 2 }} />
            {currentYear.semesters.slice(0, 2).map((s, i) => {
              const start = dayjs(s.start);
              const end = dayjs(s.end);
              const isEditable = now.isBefore(start);
              return (
                <Box
                  key={i}
                  display="flex"
                  flexDirection={{ xs: "column", sm: "row" }}
                  alignItems={{ sm: "center" }}
                  gap={2}
                  mb={2}
                >
                  <Typography minWidth={100}>{s.name}</Typography>
                  <TextField
                    type="date"
                    label="Start Date"
                    value={s.start}
                    disabled={!isEditable}
                    onChange={e => handleDateChange(i, "start", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    type="date"
                    label="End Date"
                    value={s.end}
                    disabled={!isEditable}
                    onChange={e => handleDateChange(i, "end", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Add New Academic Year
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={2}>
        <TextField
          select
          label="Academic Year"
          value={newYearData.year}
          onChange={e => setNewYearData({ ...newYearData, year: e.target.value })}
          sx={{ minWidth: 200 }}
        >
          {generateAcademicYearOptions().map(option => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Semester"
          value={newYearData.semester}
          onChange={e => setNewYearData({ ...newYearData, semester: e.target.value })}
          InputLabelProps={{ shrink: true }}
          variant="outlined"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="Semester 1">Semester 1</MenuItem>
          <MenuItem value="Semester 2">Semester 2</MenuItem>
        </TextField>
        <TextField
          type="date"
          label="Start Date"
          value={newYearData.start}
          onChange={e => setNewYearData({ ...newYearData, start: e.target.value })}
          InputProps={{ inputProps: { min: lastEnd || dayjs().format("YYYY-MM-DD") } }}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="End Date"
          value={newYearData.end}
          onChange={e => setNewYearData({ ...newYearData, end: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={handleAddNew}>
          Add
        </Button>
      </Box>
    </Box>
  );
}

export default AcademicYearSetting;