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

interface EnhancedTableToolbarProps {
  isTeacher?: boolean;
  numSelected: number;
  tableTitle: string;
  isAdmin?: boolean;
  isClassManagement?: boolean;
  isAttendance?: boolean;
  isUserManagement?: boolean;
  setFiltersUser?: React.Dispatch<React.SetStateAction<SearchFilters>>;
  isClassArrangement?: boolean;
  isNewSemester?: boolean;
  isTeacherView?: boolean;
  classOptions?: string[];
  defaultClass?: string;
  isRoleStudent?: boolean;
  isNotifyPage?: boolean;
  onShowMyAttendance?: () => void;
}

const roleOptions = ["supervisor", "teacher", "student", "parent", "admin"];
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const FilterInputs = ({ filters, handleFilterChange, isMobile }: any) => (
  <>
    <TextField
      label="Class Name"
      value={filters.className}
      onChange={e => handleFilterChange("className", e.target.value)}
      fullWidth={isMobile}
      sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
    />
    <TextField
      label="User ID"
      value={filters.userID}
      onChange={e => handleFilterChange("userID", e.target.value)}
      fullWidth={isMobile}
      sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
    />
  </>
);

const TableToolBar = (props: EnhancedTableToolbarProps): React.JSX.Element => {
  const {
    numSelected,
    tableTitle,
    isAdmin = false,
    isClassManagement = false,
    isAttendance = false,
    isUserManagement = false,
    setFiltersUser,
    isTeacher = false,
    isClassArrangement = false,
    isNewSemester = false,
    isTeacherView = false,
    classOptions = [],
    defaultClass = "",
    onShowMyAttendance,
    isRoleStudent = false,
    isNotifyPage = false,
  } = props;

  const { state, handler } = useTableToolBarHook({
    isAttendance,
    isClassManagement,
    isUserManagement,
    setFiltersUser,
    isClassArrangement,
    isNewSemester,
    defaultClass,
    isRoleStudent,
    isNotifyPage,
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
            value={filters.class}
            label="Class"
            onChange={e => handleFilterChange("class", e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {classOptions?.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
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
              {classOptions?.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
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
              value={filters.class}
              label="Class"
              onChange={e => handleFilterChange("class", e.target.value)}
            >
              {classOptions?.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
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

    if (isAttendance || isClassManagement) {
      return (
        <FilterInputs
          filters={filters}
          handleFilterChange={handleFilterChange}
          isMobile={isMobile}
        />
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
            {classOptions?.map(option => (
              <MenuItem key={option} value={option}>
                {option}
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
        {!isUserManagement && (
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
                sx={{ px: 2, py: 1, minWidth: 100 }}
              >
                Search
              </Button>

              {isTeacher && (
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
