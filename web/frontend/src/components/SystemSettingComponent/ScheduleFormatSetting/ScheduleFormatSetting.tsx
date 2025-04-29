import React, { useState } from "react";
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
} from "@mui/material";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function ScheduleFormatSetting() {
  const [selectedDays, setSelectedDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [daySlots, setDaySlots] = useState<Record<string, { count: number; slots: { start: string; end: string }[] }>>(() => {
    const initial: Record<string, { count: number; slots: { start: string; end: string }[] }> = {};
    DAYS.forEach(day => {
      initial[day] = {
        count: 5,
        slots: Array.from({ length: 5 }, () => ({ start: "", end: "" })),
      };
    });
    return initial;
  });

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const updateSlotCount = (day: string, count: number) => {
    setDaySlots(prev => ({
      ...prev,
      [day]: {
        count,
        slots: Array.from({ length: count }, (_, i) => prev[day].slots[i] || { start: "", end: "" }),
      },
    }));
  };

  const updateSlotTime = (day: string, index: number, field: "start" | "end", value: string) => {
    const updatedSlots = [...daySlots[day].slots];
    updatedSlots[index] = {
      ...updatedSlots[index],
      [field]: value,
    };
    setDaySlots(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: updatedSlots,
      },
    }));
  };

  const handleSave = () => {
    const config: Record<string, { slot: number; start: string; end: string }[]> = {};
    selectedDays.forEach(day => {
      config[day] = daySlots[day].slots.map((s, i) => ({
        slot: i + 1,
        start: s.start,
        end: s.end,
      }));
    });
    console.log("Saved Schedule Format:", config);
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Schedule Format Setting
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1">1. Select Days</Typography>
          <FormGroup row>
            {DAYS.map(day => (
              <FormControlLabel
                key={day}
                control={<Checkbox checked={selectedDays.includes(day)} onChange={() => toggleDay(day)} />}
                label={day}
              />
            ))}
          </FormGroup>
        </CardContent>
      </Card>

      {selectedDays.map(day => (
        <Card key={day} variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {day}
            </Typography>

            <Box maxWidth={150} mb={2}>
              <TextField
                label="Number of slots"
                type="number"
                value={daySlots[day].count}
                onChange={e => updateSlotCount(day, Number(e.target.value))}
                inputProps={{ min: 1, max: 15 }}
                fullWidth
              />
            </Box>

            <Box display="flex" flexWrap="wrap" gap={2}>
              {Array.from({ length: daySlots[day].count }).map((_, index) => (
                <Box
                  key={index}
                  display="flex"
                  flexDirection="column"
                  gap={1}
                  sx={{ border: '1px solid #ddd', p: 2, borderRadius: 2, minWidth: 260 }}
                >
                  <Typography fontWeight="medium">Slot {index + 1}</Typography>
                  <TextField
                    type="time"
                    label="Start Time"
                    value={daySlots[day].slots[index]?.start || ""}
                    onChange={e => updateSlotTime(day, index, "start", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    fullWidth
                  />
                  <TextField
                    type="time"
                    label="End Time"
                    value={daySlots[day].slots[index]?.end || ""}
                    onChange={e => updateSlotTime(day, index, "end", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ step: 300 }}
                    fullWidth
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      ))}

      <Button variant="contained" onClick={handleSave}>
        Save Schedule Format
      </Button>
    </Box>
  );
}

export default ScheduleFormatSetting;