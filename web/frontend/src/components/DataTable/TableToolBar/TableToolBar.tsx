import React from "react";
import "./TableToolBar.scss";
import {
  Toolbar,
  Typography,
  Tooltip,
  IconButton,
  Box,
  TextField,
  Button,
  Autocomplete,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { alpha } from "@mui/material/styles";
import useTableToolBarHook from "./useTableToolBarHook";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { SearchFilters } from "../../../model/userModels/userDataModels.model";
import { SearchClassFilters } from "../../../model/classModels/classModels.model";
import {
  AttendanceSearchParam,
  ClassPageList,
  SubjectList,
} from "../../../model/tableModels/tableDataModels.model";

interface EnhancedTableToolbarProps {
  isTeacher?: boolean;
  numSelected: number;
  tableTitle?: string;
  isAdmin?: boolean;
  isClassManagement?: boolean;
  isAttendance?: boolean;
  isUserManagement?: boolean;
  setFiltersUser?: React.Dispatch<React.SetStateAction<SearchFilters>>;
  setFiltersClass?: React.Dispatch<React.SetStateAction<SearchClassFilters>>;
  setFiltersClassPage?: React.Dispatch<React.SetStateAction<number>>;
  setFiltersAttendancePage?: React.Dispatch<
    React.SetStateAction<AttendanceSearchParam>
  >;
  isClassArrangement?: boolean;
  isNewSemester?: boolean;
  isRoleParent?: boolean;
  isTeacherView?: boolean;
  classOptions?: string[];
  subjectList?: SubjectList[];
  defaultClass?: string;
  isRoleStudent?: boolean;
  isNotifyPage?: boolean;
  isClassPage?: boolean;
  classOptionsData?: Array<{ className: string; id: string }>;
  isRFIDPage?: boolean;
  onShowMyAttendance?: () => void;
  onClassChange?: (className: string) => void;
  classPageList?: ClassPageList[];
  availableAcademicYears?: string[];
  onAcademicYearChange?: (year: string) => void;
  classYears?: Array<{ className: string; academicYear: string }>;
  createButtonAction?: () => void;
}

const roleOptions = ["student", "teacher", "parent"];
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const TableToolBar = (props: EnhancedTableToolbarProps): React.JSX.Element => {
  const {
    numSelected,
    tableTitle,
    isAdmin = false,
    isClassManagement = false,
    isAttendance = false,
    isUserManagement = false,
    setFiltersUser,
    setFiltersClass,
    isClassPage,
    setFiltersClassPage,
    setFiltersAttendancePage,
    isTeacher = false,
    isClassArrangement = false,
    isNewSemester = false,
    isTeacherView = false,
    classOptions = [],
    classOptionsData = [],
    isRoleParent,
    defaultClass = "",
    onShowMyAttendance,
    availableAcademicYears,
    isRoleStudent = false,
    isNotifyPage = false,
    isRFIDPage = false,
    onClassChange,
    onAcademicYearChange,
    classPageList = [],
    subjectList = [],
    classYears = [],
    createButtonAction,
  } = props;

  const { state, handler } = useTableToolBarHook({
    isAttendance,
    isClassManagement,
    isUserManagement,
    setFiltersUser,
    setFiltersClass,
    setFiltersClassPage,
    setFiltersAttendancePage,
    isClassArrangement,
    isNewSemester,
    defaultClass,
    isRoleStudent,
    isRoleParent,
    isNotifyPage,
    isRFIDPage,
    isTeacherView,
    isTeacher,
    classYears,
  });
  const { filters } = state;
  const { handleFilterChange, onSubmit } = handler;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const renderHeader = () => {
    if (numSelected > 0) {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 10px 0px 10px",
            width: "100%",
          }}
        >
          <Typography
            sx={{ fontSize: "1rem", fontWeight: 500 }}
            color="inherit"
          >
            {numSelected} selected
          </Typography>
          {/* <Tooltip title="Delete">
            <IconButton>
              <DeleteIcon />
            </IconButton>
          </Tooltip> */}
        </Box>
      );
    }
    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 10px 0px 10px",
        }}
      >
        <Typography variant="h6" id="tableTitle" marginLeft={5}>
          {tableTitle}
        </Typography>
        {/* {createButtonAction && (
          <Button
            variant="contained"
            color="primary"
            onClick={createButtonAction}
          >
            Create Class
          </Button>
        )} */}
        {/* {((isAttendance && !isRoleStudent) || isTeacherView) && (
          <Button
            variant="outlined"
            color="primary"
            onClick={onShowMyAttendance}
          >
            Show my Attendance
          </Button>
        )} */}
      </Box>
    );
  };

  const renderFilters = () => {
    if (isRFIDPage) {
      return (
        <TextField
          label="User ID"
          value={filters.userID}
          onChange={e => handleFilterChange("userID", e.target.value)}
          fullWidth={isMobile}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        />
      );
    }
    if (isNotifyPage) {
      return (
        <TextField
          label="Message"
          value={filters.message}
          onChange={e => handleFilterChange("message", e.target.value)}
          fullWidth={isMobile}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        />
      );
    }
    if (isRoleParent && isClassPage) {
      return (
        <>
          <TextField
            label="User ID"
            value={filters.userID}
            required
            onChange={e => {
              handleFilterChange("userID", e.target.value);
            }}
            onFocus={e => {
              handleFilterChange("classId", "");
              handleFilterChange("className", "");
            }}
            onBlur={handler.handleCallAPIClass}
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={filters.classId || ""}
              label="Class"
              required
              disabled={
                !filters?.userID || state.classAttendanceList.length === 0
              }
              onChange={e => {
                handleFilterChange("classId", e.target.value);
                const selectedClass = state.classAttendanceList.find(
                  s => s.classId === e.target.value
                );
                handleFilterChange("className", selectedClass?.className || "");
              }}
            >
              {state.classAttendanceList?.map((option, index) => {
                return (
                  <MenuItem key={index} value={option.classId}>
                    {option.className}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </>
      );
    }
    if (isTeacherView) {
      return (
        <FormControl
          fullWidth={isMobile}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        >
          <InputLabel id="class-select-label">Class</InputLabel>
          <Select
            labelId="class-select-label"
            value={filters.classId || ""}
            label="Class"
            onChange={e => handleFilterChange("classId", e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {classPageList?.map((option, index) => {
              return (
                <MenuItem
                  key={`class-option-${option}-${index}`}
                  value={option.classId}
                >
                  {option.className}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      );
    }
    if (isClassArrangement) {
      return (
        <TextField
          label="Name"
          value={filters.name}
          onChange={e => handleFilterChange("name", e.target.value)}
          fullWidth={isMobile}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        />
      );
    }
    if (isNewSemester) {
      return (
        <>
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="academicYear-select-label">
              Academic Year
            </InputLabel>
            <Select
              labelId="academicYear-select-label"
              value={filters.academicYear || ""}
              label="Academic Year"
              onChange={handleAcademicYearChangeInternal}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 48 * 7.5,
                    width: 250,
                  },
                },
              }}
              displayEmpty={false}
            >
              {availableAcademicYears && availableAcademicYears.length > 0 ? (
                availableAcademicYears.map(year => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  No academic years available
                </MenuItem>
              )}
            </Select>
          </FormControl>
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={filters.class || ""}
              label="Class"
              onChange={e => handleFilterChange("class", e.target.value)}
              displayEmpty={false}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classOptions?.map((option, index) => (
                <MenuItem
                  key={`class-option-${option}-${index}`}
                  value={option}
                >
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Name"
            value={filters.name || ""}
            onChange={e => handleFilterChange("name", e.target.value)}
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />
        </>
      );
    }
    if (isRoleParent) {
      return (
        <>
          <TextField
            label="User ID"
            value={filters.userID}
            required
            onChange={e => {
              handleFilterChange("userID", e.target.value);
            }}
            onFocus={e => {
              handleFilterChange("classId", "");
              handleFilterChange("className", "");
            }}
            onBlur={handler.handleCallAPIClass}
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={filters.classId || ""}
              label="Class"
              required
              disabled={
                !filters?.userID || state.classAttendanceList.length === 0
              }
              onChange={e => {
                handleFilterChange("classId", e.target.value);
                const selectedClass = state.classAttendanceList.find(
                  s => s.classId === e.target.value
                );
                handleFilterChange("className", selectedClass?.className || "");
              }}
            >
              {state.classAttendanceList?.map((option, index) => {
                return (
                  <MenuItem key={index} value={option.classId}>
                    {option.className}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="slot-id-select-label">Slot</InputLabel>
            <Select
              labelId="slot-id-select-label"
              value={filters.slotID}
              label="Slot"
              onChange={e => handleFilterChange("slotID", e.target.value)}
            >
              <MenuItem key={11} value={``}>
                Slot None
              </MenuItem>
              {[...Array(10)].map((_, index) => (
                <MenuItem key={index + 1} value={`${index + 1}`}>
                  Slot {index + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="From Date"
            type="date"
            value={filters.dateFrom}
            onChange={e => handleFilterChange("dateFrom", e.target.value)}
            fullWidth={isMobile}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />

          <TextField
            label="To Date"
            type="date"
            value={filters.dateTo}
            onChange={e => handleFilterChange("dateTo", e.target.value)}
            fullWidth={isMobile}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />
        </>
      );
    }
    if (isRoleStudent) {
      return (
        <>
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="slot-id-select-label">Slot</InputLabel>
            <Select
              labelId="slot-id-select-label"
              value={filters.slotID}
              label="Slot"
              onChange={e => handleFilterChange("slotID", e.target.value)}
            >
              <MenuItem key={11} value={``}>
                Slot None
              </MenuItem>
              {[...Array(10)].map((_, index) => (
                <MenuItem key={index + 1} value={`${index + 1}`}>
                  Slot {index + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="From Date"
            type="date"
            value={filters.dateFrom}
            onChange={e => handleFilterChange("dateFrom", e.target.value)}
            fullWidth={isMobile}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />

          <TextField
            label="To Date"
            type="date"
            value={filters.dateTo}
            onChange={e => handleFilterChange("dateTo", e.target.value)}
            fullWidth={isMobile}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />
        </>
      );
    }
    if (isTeacher) {
      return (
        <>
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={filters.classId || ""}
              label="Class"
              required
              onChange={e => {
                handleFilterChange("classId", e.target.value);
                const selectedClass = classPageList.find(
                  s => s.classId === e.target.value
                );
                handleFilterChange("className", selectedClass?.className || "");
              }}
            >
              {classPageList?.map((option, index) => {
                return (
                  <MenuItem key={index} value={option.classId}>
                    {option.className}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="slot-id-select-label">Slot</InputLabel>
            <Select
              labelId="slot-id-select-label"
              value={filters.slotID}
              label="Slot"
              onChange={e => handleFilterChange("slotID", e.target.value)}
            >
              <MenuItem key={11} value={``}>
                Slot None
              </MenuItem>
              {[...Array(10)].map((_, index) => (
                <MenuItem key={index + 1} value={`${index + 1}`}>
                  Slot {index + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Date"
            type="date"
            value={filters.date}
            onChange={e => handleFilterChange("date", e.target.value)}
            fullWidth={isMobile}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />
        </>
      );
    }
    if (isClassManagement) {
      return (
        <>
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="academicYear-select-label">
              Academic Year
            </InputLabel>
            <Select
              labelId="academicYear-select-label"
              value={filters.academicYear || ""}
              label="Academic Year"
              onChange={e => {
                handler.filterClassNamesByYear(e.target.value);
                handleFilterChange("academicYear", e.target.value);
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 48 * 7.5,
                    width: 250,
                  },
                },
              }}
              displayEmpty={false}
            >
              <MenuItem value="">All Academic Years</MenuItem>
              {availableAcademicYears && availableAcademicYears.length > 0 ? (
                availableAcademicYears.map((year, index) => (
                  <MenuItem key={index} value={year}>
                    {year}
                  </MenuItem>
                ))
              ) : state.academicYearsForClass &&
                state.academicYearsForClass.length > 0 ? (
                state.academicYearsForClass.map((year, index) => (
                  <MenuItem key={index} value={year}>
                    {year}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  No academic years available
                </MenuItem>
              )}
            </Select>
          </FormControl>
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={filters.class || ""}
              label="Class"
              onChange={e => handleFilterChange("class", e.target.value)}
              displayEmpty={false}
              disabled={!filters?.academicYear}
            >
              <MenuItem value="">All Classes</MenuItem>
              {state.classNamesFiltered?.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="grade-select-label">Grade</InputLabel>
            <Select
              labelId="grade-select-label"
              value={filters.grade || ""}
              label="Grade"
              onChange={e => handleFilterChange("grade", e.target.value)}
              displayEmpty={false}
            >
              <MenuItem value="">All Grades</MenuItem>
              <MenuItem value="10">Grade 10</MenuItem>
              <MenuItem value="11">Grade 11</MenuItem>
              <MenuItem value="12">Grade 12</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Homeroom Teacher ID"
            placeholder="Enter teacher ID..."
            value={filters.userID || ""}
            onChange={e => handleFilterChange("userID", e.target.value)}
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />
        </>
      );
    }
    if (isAttendance) {
      return (
        <>
          <TextField
            label="User ID"
            value={filters.userID}
            required
            onChange={e => {
              handleFilterChange("userID", e.target.value);
            }}
            onFocus={e => {
              handleFilterChange("classId", "");
              handleFilterChange("className", "");
            }}
            onBlur={handler.handleCallAPIClass}
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={filters.classId || ""}
              label="Class"
              required
              disabled={
                !filters?.userID || state.classAttendanceList.length === 0
              }
              onChange={e => {
                handleFilterChange("classId", e.target.value);
                const selectedClass = state.classAttendanceList.find(
                  s => s.classId === e.target.value
                );
                handleFilterChange("className", selectedClass?.className || "");
              }}
            >
              {state.classAttendanceList?.map((option, index) => {
                return (
                  <MenuItem key={index} value={option.classId}>
                    {option.className}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="class-select-label">Subject</InputLabel>
            <Select
              labelId="class-select-label"
              value={filters.subjectId}
              label="Subject"
              onChange={e => {
                handleFilterChange("subjectId", e.target.value);
                const selectedSubject = subjectList.find(
                  (s: SubjectList) => s.subjectId === e.target.value
                );
                handleFilterChange(
                  "subjectName",
                  selectedSubject?.subjectName || ""
                );
              }}
            >
              <MenuItem value={0}>None</MenuItem>
              {subjectList?.map((option: SubjectList, index: number) => {
                return (
                  <MenuItem key={index} value={option.subjectId}>
                    {option.subjectName}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {/* Status Select */}
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={filters.status}
              label="Status"
              onChange={e => handleFilterChange("status", e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="present">Present</MenuItem>
              <MenuItem value="late">Late</MenuItem>
              <MenuItem value="absent">Absent</MenuItem>
              <MenuItem value="not now">Not now</MenuItem>
            </Select>
          </FormControl>

          {/* Date */}
          <TextField
            label="Date"
            type="date"
            required
            value={filters.date}
            onChange={e => handleFilterChange("date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />

          {/* Slot Number */}
          <TextField
            label="Slot Number"
            type="number"
            value={filters.slotNumber}
            onChange={e => handleFilterChange("slotNumber", e.target.value)}
            inputProps={{ min: 1, max: 10 }}
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />
        </>
      );
    }

    return (
      <>
        {/* Academic Year luôn ở bên trái */}
        <FormControl
          fullWidth={isMobile}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        >
          <InputLabel id="academicYear-select-label">Academic Year</InputLabel>
          <Select
            labelId="academicYear-select-label"
            value={filters.academicYear || ""}
            label="Academic Year"
            onChange={handleAcademicYearChangeInternal}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 48 * 7.5,
                  width: 250,
                },
              },
            }}
            displayEmpty={false}
          >
            {availableAcademicYears && availableAcademicYears.length > 0 ? (
              availableAcademicYears.map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                No academic years available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        {/* Class ở bên phải */}
        {isUserManagement ? (
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={filters.className || ""}
              label="Class"
              onChange={e => {
                console.log("Class selection changed to:", e.target.value);
                if (onClassChange) {
                  onClassChange(e.target.value as string);
                }
                handleFilterChange("className", e.target.value as string);
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    width: 250,
                  },
                },
              }}
              displayEmpty={false}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classOptions?.map((option, index) => (
                <MenuItem
                  key={`class-option-${option}-${index}`}
                  value={option}
                >
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={filters.class || ""}
              label="Class"
              onChange={e => handleFilterChange("class", e.target.value)}
              displayEmpty={false}
            >
              <MenuItem value="">All Classes</MenuItem>
              {classOptions?.map((option, index) => (
                <MenuItem
                  key={`class-option-${option}-${index}`}
                  value={option}
                >
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          label="Name"
          value={filters.name || ""}
          onChange={e => {
            const value = e.target.value;
            if (value.length <= 50) {
              handleFilterChange("name", value);
            }
          }}
          onKeyDown={e => {
            if (e.key === "Enter") {
              onSubmit();
            }
          }}
          fullWidth={isMobile}
          inputProps={{ maxLength: 50 }}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        />

        <TextField
          label="Phone"
          value={filters.phone || ""}
          onChange={e => {
            const value = e.target.value;
            if (/^\d{0,11}$/.test(value)) {
              handleFilterChange("phone", value);
            }
          }}
          fullWidth={isMobile}
          inputProps={{ maxLength: 11 }}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        />
        <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 250px" }}>
          <Autocomplete
            multiple
            options={roleOptions}
            disableCloseOnSelect
            value={filters.roles || []}
            onChange={(_, newValue) => handleFilterChange("roles", newValue)}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={icon}
                  checkedIcon={checkedIcon}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option}
              </li>
            )}
            renderInput={params => (
              <TextField
                {...params}
                variant="outlined"
                label="Roles"
                placeholder="Select"
              />
            )}
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />
        </Box>
      </>
    );
  };
  const handleAcademicYearChangeInternal = (e: any) => {
    const newAcademicYear = e.target.value as string;

    // Cập nhật filters nội bộ
    handleFilterChange("academicYear", newAcademicYear);

    // Reset class khi thay đổi năm học
    handleFilterChange("className", "");
    handleFilterChange("class", "");

    // Thông báo ra bên ngoài về sự thay đổi
    if (onAcademicYearChange) {
      onAcademicYearChange(newAcademicYear);
    }

    // Submit filter ngay sau khi đổi năm học - đảm bảo academicYearOptions không bị thay đổi
    setTimeout(() => {
      if (setFiltersClass) {
        setFiltersClass(prevFilters => ({
          ...prevFilters,
          academicYear: newAcademicYear,
        }));
      }
    }, 100);
  };

  // Xử lý khi chọn Class thay đổi
  const handleClassChangeSelect = (className: string) => {
    // Cập nhật filters nội bộ
    handleFilterChange("className", className);

    // Thông báo ra bên ngoài về sự thay đổi
    if (onClassChange) {
      onClassChange(className);
    }

    // Submit filter ngay sau khi đổi lớp
    setTimeout(() => onSubmit(), 100);
  };
  return (
    <Toolbar
      sx={[
        {
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 2,
        },
        numSelected > 0 && {
          bgcolor: theme =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity
            ),
        },
      ]}
    >
      {/* Header */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {renderHeader()}
      </Box>

      {/* Filter Section */}
      {(isAdmin ||
        isClassManagement ||
        isAttendance ||
        isTeacher ||
        isTeacherView) && (
        <Box sx={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 2 }}>
          {renderFilters()}
          <Box
            sx={{
              flex: isMobile ? "1 1 100%" : "1 1 120px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={onSubmit}
                size="small"
                disabled={
                  isAttendance &&
                  !isRoleStudent &&
                  (!filters?.userID || !filters?.className) &&
                  !isTeacher
                }
                sx={{ px: 2, py: 1, minWidth: 100 }}
              >
                Search
              </Button>

              {isTeacher && !isRoleStudent && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={onShowMyAttendance}
                  size="small"
                  sx={{ px: 2, py: 1, ml: 2, minWidth: 160 }}
                >
                  Show My Attendance
                </Button>
              )}
            </>
          </Box>
        </Box>
      )}
    </Toolbar>
  );
};

export default TableToolBar;
