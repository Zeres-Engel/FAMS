import "./SchedulePage.scss";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
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
import moment from "moment";
import LayoutComponent from "../../components/Layout/Layout";
import useSchedulePageHook from "./useSchedulePageHook";

const localizer = momentLocalizer(moment);
const SchedulePage: React.FC = () => {
  const { state, handler } = useSchedulePageHook();
  return (
    <LayoutComponent pageHeader="Schedule">
      <Container
        maxWidth="lg"
        style={{ padding: "16px" }}
        className="schedulePage-Container"
      >
        {/* <Grid size={12}>
          <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
            📅 Schedule
          </Typography>
        </Grid> */}
        <Grid
          container
          size={12}
          spacing={2}
          justifyContent="center"
          className={state?.eventShow?.id !== 0 ? "schedule-Display" : ""}
        >
          {/* <Grid size={{xs:12, sm:10, md:8, lg:6}}> */}
          <Grid size={12}>
            <Paper elevation={3} sx={{ padding: "16px", overflowX: "auto" }}>
              {state.isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                  <CircularProgress />
                </div>
              ) : state.error ? (
                <Alert severity="error">{state.error}</Alert>
              ) : (
                <Calendar
                  localizer={localizer}
                  view={state.view}
                  events={state.events}
                  date={state.currentDate}
                  startAccessor="start"
                  endAccessor="end"
                  views={["month", "week", "day"]}
                  style={{ height: 500, minWidth: "100%" }}
                  onSelectEvent={handler.handleSelectEvent}
                  onView={(newView) => {
                    handler.handleSetNewView(newView)
                  }}
                  onNavigate={(newDate)=>{
                    handler.handleSetNewViewDate(newDate)
                  }}
                />
              )}
            </Paper>
          </Grid>
        </Grid>
        {state.eventShow?.id !== 0 && (
          <Grid size={8} className="showEvent">
            <Typography variant="h4">EVENT</Typography>
            <Typography component="div">
              Event: {state.eventShow?.title}
            </Typography>
            <Typography component="div">
              Start: {moment(state.eventShow?.start).format("YYYY-MM-DD HH:mm")}
            </Typography>
            <Typography component="div">
              End: {moment(state.eventShow?.end).format("YYYY-MM-DD HH:mm")}
            </Typography>
            {state.eventShow?.resource && (
              <>
                <Typography component="div">
                  Subject ID: {state.eventShow.resource.subjectId}
                </Typography>
                <Typography component="div">
                  Classroom: {state.eventShow.resource.classroomId}
                </Typography>
                <Typography component="div">
                  Teacher ID: {state.eventShow.resource.teacherId}
                </Typography>
              </>
            )}
            <Button
              variant="contained"
              onClick={() => handler.handleSelectEvent()}
            >
              Close
            </Button>
          </Grid>
        )}
      </Container>
    </LayoutComponent>
  );
};

export default SchedulePage;
