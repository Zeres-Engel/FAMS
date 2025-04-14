import "./ScheduleManagementPage.scss";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer } from "react-big-calendar";
import React, { useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Autocomplete,
  TextField,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import moment from "moment";
import LayoutComponent from "../../components/Layout/Layout";
import useScheduleManagementPageHook from "./useScheduleManagementPageHook";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

const localizer = momentLocalizer(moment);

const ScheduleManagementPage: React.FC = () => {
  const { state, handler } = useScheduleManagementPageHook();
  const isMobile = useMediaQuery("(max-width:600px)");
  const role = useSelector((state: RootState) => state.authUser.role);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    id: 0,
    subject: "",
    title: "",
    start: new Date(),
    end: new Date(),
    teacher: "",
  });

  return (
    <LayoutComponent pageHeader="Schedule">
      <Container maxWidth="xl" style={{ padding: "16px" }}>
        <Box className={state?.eventShow?.id !== 0 ? "schedule-Display" : ""}>
          <Paper elevation={3} sx={{ padding: "16px" }}>
            {(role === "admin" || role === "supervisor") && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                  alignItems: "center",
                }}
              >
                <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}>
                  <Autocomplete
                    disablePortal
                    options={state.classOptions}
                    value={state.filters.class}
                    onChange={(event, value) =>
                      handler.setFilters({
                        ...state.filters,
                        class: value || "",
                      })
                    }
                    renderInput={params => (
                      <TextField {...params} label="Class" />
                    )}
                    fullWidth
                  />
                </Box>
                <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}>
                  <TextField
                    label="Teacher ID"
                    fullWidth
                    value={state.filters.userId}
                    onChange={e =>
                      handler.setFilters({
                        ...state.filters,
                        userId: e.target.value,
                      })
                    }
                  />
                </Box>
                <Button variant="contained" onClick={handler.handleSearch}>
                  Search
                </Button>
              </Box>
            )}

            {role === "teacher" && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 2,
                  alignItems: "center",
                }}
              >
                <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}>
                  <Autocomplete
                    disablePortal
                    options={state.classOptions}
                    value={state.filters.class}
                    onChange={(event, value) =>
                      handler.setFilters({
                        ...state.filters,
                        class: value || "",
                      })
                    }
                    renderInput={params => (
                      <TextField {...params} label="Class" />
                    )}
                    fullWidth
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={handler.handleShowTeacherSchedule}
                >
                  Show My Schedule
                </Button>
              </Box>
            )}

            <Calendar
              localizer={localizer}
              view={state.view}
              events={state.events}
              date={state.currentDate}
              startAccessor="start"
              endAccessor="end"
              views={["month", "week", "day"]}
              style={{ height: 600, width: "100%" }}
              onSelectEvent={handler.handleSelectEvent}
              onView={handler.handleSetView}
              onNavigate={handler.handleSetDate}
            />

            {role === "admin" && (
              <Box textAlign="center" mt={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenCreateDialog(true)}
                >
                  Add new Schedule
                </Button>
              </Box>
            )}
          </Paper>

          <Dialog
            open={state.eventShow?.id !== 0}
            onClose={() => {
              handler.setIsEditing(false);
              handler.handleSelectEvent();
            }}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Event Detail</DialogTitle>
            <DialogContent dividers>
              {state.isEditing ? (
                <>
                  <TextField
                    label="Subject"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={state.eventShow?.title}
                    onChange={e =>
                      handler.setEventShow({
                        ...state.eventShow,
                        title: e.target.value,
                      })
                    }
                  />
                  <TextField
                    label="Start"
                    type="datetime-local"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={moment(state.eventShow?.start).format(
                      "YYYY-MM-DDTHH:mm"
                    )}
                    onChange={e =>
                      handler.setEventShow({
                        ...state.eventShow,
                        start: new Date(e.target.value),
                      })
                    }
                  />
                  <TextField
                    label="End"
                    type="datetime-local"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={moment(state.eventShow?.end).format(
                      "YYYY-MM-DDTHH:mm"
                    )}
                    onChange={e =>
                      handler.setEventShow({
                        ...state.eventShow,
                        end: new Date(e.target.value),
                      })
                    }
                  />
                  <TextField
                    label="Teacher"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={state.eventShow?.teacher}
                    onChange={e =>
                      handler.setEventShow({
                        ...state.eventShow,
                        teacher: e.target.value,
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <Typography>
                    <strong>Subject:</strong> {state.eventShow?.title}
                  </Typography>
                  <Typography>
                    <strong>Start:</strong>{" "}
                    {moment(state.eventShow?.start).format("YYYY-MM-DD HH:mm")}
                  </Typography>
                  <Typography>
                    <strong>End:</strong>{" "}
                    {moment(state.eventShow?.end).format("YYYY-MM-DD HH:mm")}
                  </Typography>
                  <Typography>
                    <strong>Teacher:</strong> {state.eventShow?.teacher}
                  </Typography>
                </>
              )}
            </DialogContent>

            <DialogActions>
              {role === "admin" &&
                (state.isEditing ? (
                  <>
                    <Button
                      variant="contained"
                      onClick={handler.handleSaveEdit}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handler.setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      onClick={() => handler.setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    <Button variant="contained" color="error">
                      Delete
                    </Button>
                  </>
                ))}
              <Button
                variant="outlined"
                onClick={() => {
                  handler.setIsEditing(false);
                  handler.handleSelectEvent();
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={openCreateDialog}
            onClose={() => setOpenCreateDialog(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Add new Schedule</DialogTitle>
            <DialogContent dividers>
              <TextField
                label="Subject"
                fullWidth
                sx={{ mb: 2 }}
                value={newEvent.title}
                onChange={e =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
              />
              <TextField
                label="Start"
                type="datetime-local"
                fullWidth
                sx={{ mb: 2 }}
                value={moment(newEvent.start).format("YYYY-MM-DDTHH:mm")}
                onChange={e =>
                  setNewEvent({ ...newEvent, start: new Date(e.target.value) })
                }
              />
              <TextField
                label="End"
                type="datetime-local"
                fullWidth
                sx={{ mb: 2 }}
                value={moment(newEvent.end).format("YYYY-MM-DDTHH:mm")}
                onChange={e =>
                  setNewEvent({ ...newEvent, end: new Date(e.target.value) })
                }
              />
              <TextField
                label="Teacher"
                fullWidth
                sx={{ mb: 2 }}
                value={newEvent.teacher}
                onChange={e =>
                  setNewEvent({ ...newEvent, teacher: e.target.value })
                }
              />
            </DialogContent>
            <DialogActions>
              <Button
                variant="contained"
                onClick={() => {
                  handler.addEvent(newEvent);
                  setOpenCreateDialog(false);
                  setNewEvent({
                    id: 0,
                    subject: "",
                    title: "",
                    start: new Date(),
                    end: new Date(),
                    teacher: "",
                  });
                }}
              >
                Add
              </Button>
              <Button
                variant="outlined"
                onClick={() => setOpenCreateDialog(false)}
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </LayoutComponent>
  );
};

export default ScheduleManagementPage;
