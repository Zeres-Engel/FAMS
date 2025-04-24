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
  tableTitle: string;
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
  isTeacherView?: boolean;
  classOptions?: string[];
  classPageList?: ClassPageList[];
  subjectList?: SubjectList[];
  defaultClass?: string;
  isRoleStudent?: boolean;
  isNotifyPage?: boolean;
  isRFIDPage?: boolean;
  onShowMyAttendance?: () => void;
}

const roleOptions = ["teacher", "student", "parent"];
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
    setFiltersClassPage,
    setFiltersAttendancePage,
    isTeacher = false,
    isClassArrangement = false,
    isNewSemester = false,
    isTeacherView = false,
    classOptions = [],
    defaultClass = "",
    onShowMyAttendance,
    isRoleStudent = false,
    isNotifyPage = false,
    isRFIDPage = false,
    classPageList = [],
    subjectList = [],
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
    isNotifyPage,
    isRFIDPage,
    isTeacherView,
    isTeacher,
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
      <Typography
        sx={{
          width: "100%",
          textAlign: "center",
          fontWeight: 600,
          marginTop: 1,
        }}
        variant="h6"
      >
        {tableTitle}
      </Typography>
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
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={filters.class}
              label="Class"
              onChange={e => handleFilterChange("class", e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {classOptions?.map((option, index) => (
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
            <InputLabel id="academicYear-select-label">
              Academic Year
            </InputLabel>
            <Select
              labelId="academicYear-select-label"
              id="academicYear-select"
              name="academicYear"
              value={filters.academicYear}
              displayEmpty
              label="academicYear"
              onChange={e => handleFilterChange("academicYear", e.target.value)}
            >
              {handler.getAcademicYears(3).map((year, index) => (
                <MenuItem key={index} value={year}>
                  {year === "" ? "None" : year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Name"
            value={filters.name}
            onChange={e => handleFilterChange("name", e.target.value)}
            fullWidth={isMobile}
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
            <InputLabel id="class-select-label">Class</InputLabel>
            <Select
              labelId="class-select-label"
              value={filters.class}
              label="Class"
              onChange={e => handleFilterChange("class", e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {classOptions?.map((option, index) => (
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
            <InputLabel id="academicYear-select-label">
              Academic Year
            </InputLabel>
            <Select
              labelId="academicYear-select-label"
              id="academicYear-select"
              name="academicYear"
              value={filters.academicYear}
              label="academicYear"
              onChange={e => handleFilterChange("academicYear", e.target.value)}
            >
              {handler.getAcademicYears(3).map(year => (
                <MenuItem key={year} value={year}>
                  {year}
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
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="10">10</MenuItem>
              <MenuItem value="11">11</MenuItem>
              <MenuItem value="12">12</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="User ID"
            value={filters.userID}
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
                  s => s.subjectId === e.target.value
                );
                handleFilterChange(
                  "subjectName",
                  selectedSubject?.subjectName || ""
                );
              }}
            >
              <MenuItem value={0}>None</MenuItem>
              {subjectList?.map((option, index) => {
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
        <FormControl
          fullWidth={isMobile}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        >
          <InputLabel id="class-select-label">Class</InputLabel>
          <Select
            labelId="class-select-label"
            value={filters.class}
            label="Class"
            onChange={e => handleFilterChange("class", e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {classOptions?.map((option, index) => (
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
          <InputLabel id="academicYear-select-label">Academic Year</InputLabel>
          <Select
            labelId="academicYear-select-label"
            id="academicYear-select"
            name="academicYear"
            value={filters.academicYear}
            label="academicYear"
            onChange={e => handleFilterChange("academicYear", e.target.value)}
          >
            {handler.getAcademicYears(3).map(year => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Name"
          value={filters.name}
          onChange={e => handleFilterChange("name", e.target.value)}
          fullWidth={isMobile}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        />
        {isUserManagement && (
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
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="10">10</MenuItem>
              <MenuItem value="11">11</MenuItem>
              <MenuItem value="12">12</MenuItem>
            </Select>
          </FormControl>
        )}
        <TextField
          label="Phone"
          value={filters.phone}
          onChange={e => handleFilterChange("phone", e.target.value)}
          fullWidth={isMobile}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        />
        <Box sx={{ flex: isMobile ? "1 1 100%" : "1 1 250px" }}>
          <Autocomplete
            multiple
            id="multi-role-select"
            options={roleOptions}
            disableCloseOnSelect
            getOptionLabel={option => option}
            value={filters.roles}
            onChange={(event, value) => handleFilterChange("roles", value)}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props;
              return (
                <li key={key} {...optionProps}>
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option}
                </li>
              );
            }}
            renderInput={params => (
              <TextField {...params} label="Roles" placeholder="Select roles" />
            )}
            fullWidth
          />
        </Box>
      </>
    );
  };
  const renderTeacherAttendance = () => {
    if (state.showTeacherAttendance) {
      // Hiển thị filter cho Show My Attendance
      return (
        <>
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="semester-select-label">Semester</InputLabel>
            <Select
              labelId="semester-select-label"
              value={filters.semester || ""}
              label="Semester"
              onChange={e => handleFilterChange("semester", e.target.value)}
            >
              <MenuItem value={1}>Semester 1</MenuItem>
              <MenuItem value={2}>Semester 2</MenuItem>
            </Select>
          </FormControl>

          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select
              labelId="year-select-label"
              value={filters.year || ""}
              label="Year"
              onChange={e => handleFilterChange("year", e.target.value)}
            >
              {handler.getYears().map(year => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      );
    }
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
          {state?.showTeacherAttendance
            ? renderTeacherAttendance()
            : renderFilters()}
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
                sx={{ px: 2, py: 1, minWidth: 100 }}
                disabled={
                  isAttendance &&
                  !isTeacher &&
                  !isRoleStudent &&
                  (!filters.userID ||
                    !filters.classId ||
                    !filters.className ||
                    !filters.date)
                }
              >
                Search
              </Button>

              {/* {isTeacher && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() =>
                    handler.setShowTeacherAttendance(
                      !state.showTeacherAttendance
                    )
                  }
                  size="small"
                  sx={{ px: 2, py: 1, ml: 2, minWidth: 160 }}
                >
                  {!state?.showTeacherAttendance
                    ? "Show My Attendance"
                    : "Search Attendance"}
                </Button>
              )} */}
            </>
          </Box>
        </Box>
      )}
    </Toolbar>
  );
};

export default TableToolBar;
