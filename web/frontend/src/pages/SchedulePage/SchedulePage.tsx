import "./SchedulePage.scss";
// Comment out problematic imports temporarily until we can install the packages
// import "react-big-calendar/lib/css/react-big-calendar.css";
// import { Calendar, momentLocalizer, View } from "react-big-calendar";
import React, { useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Grid,
  Tooltip,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
// import moment from "moment";
import LayoutComponent from "../../components/Layout/Layout";
import useSchedulePageHook from "./useSchedulePageHook";

// Temporarily replace with a simple function to format dates
const formatDate = (date?: Date): string => {
  if (!date) return '';
  return date.toLocaleString();
};

const SchedulePage: React.FC = () => {
  const { state, handler } = useSchedulePageHook();
  
  return (
    <LayoutComponent>
      <Container
        maxWidth="lg"
        style={{ padding: "16px" }}
        className="schedulePage-Container"
      >
        <Grid size={12}>
          <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
            📅 Thời khóa biểu
          </Typography>
        </Grid>
        
        {state.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {state.error}
          </Alert>
        )}
        
        <Grid
          container
          size={12}
          spacing={2}
          justifyContent="center"
          className={state?.eventShow?.id !== 0 ? "schedule-Display" : ""}
        >
          <Grid size={12}>
            <Paper elevation={3} sx={{ padding: "16px", overflowX: "auto", minHeight: "500px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {state.isLoading ? (
                <CircularProgress />
              ) : (
                <div className="schedule-placeholder">
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Chức năng xem thời khóa biểu đang được nâng cấp.
                  </Alert>
                  <Typography variant="h6">Danh sách lịch học:</Typography>
                  {state.events.length > 0 ? (
                    <ul>
                      {state.events.map(event => (
                        <li key={event.id} 
                            style={{cursor: 'pointer', margin: '10px 0', padding: '10px', border: '1px solid #eee'}}
                            onClick={() => handler.handleSelectEvent(event)}>
                          <strong>{event.title}</strong><br/>
                          Bắt đầu: {formatDate(event.start)}<br/>
                          Kết thúc: {formatDate(event.end)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Typography>Không có lịch học nào.</Typography>
                  )}
                </div>
              )}
            </Paper>
          </Grid>
        </Grid>
        
        {state.eventShow?.id !== 0 && (
          <Grid size={8} className="showEvent">
            <Typography variant="h4">Chi tiết lịch học</Typography>
            <Typography component="div">
              <strong>Môn học:</strong> {state.eventShow?.title}
            </Typography>
            <Typography component="div">
              <strong>Bắt đầu:</strong> {formatDate(state.eventShow?.start)}
            </Typography>
            <Typography component="div">
              <strong>Kết thúc:</strong> {formatDate(state.eventShow?.end)}
            </Typography>
            {state.eventShow.resource && (
              <>
                <Typography component="div">
                  <strong>Phòng học:</strong> {state.eventShow.resource.classroom?.name || 'Chưa xác định'}
                </Typography>
                <Typography component="div">
                  <strong>Giáo viên:</strong> {state.eventShow.resource.teacher?.name || 'Chưa xác định'}
                </Typography>
              </>
            )}
            <Button
              variant="contained"
              onClick={() => handler.handleSelectEvent()}
              sx={{ mt: 2 }}
            >
              Đóng
            </Button>
          </Grid>
        )}
      </Container>
    </LayoutComponent>
  );
};

export default SchedulePage;

