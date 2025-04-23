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
  isClassArrangement?: boolean;
  isNewSemester?: boolean;
  isTeacherView?: boolean;
  classOptions?: string[];
  classOptionsData?: Array<{className: string, id: string}>;
  defaultClass?: string;
  isRoleStudent?: boolean;
  isNotifyPage?: boolean;
  isRFIDPage?: boolean;
  onShowMyAttendance?: () => void;
  onClassSearchChange?: (value: string) => void;
  searchClass?: string;
}

const roleOptions = ["student", "teacher", "parent", "supervisor"];
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
    isTeacher = false,
    isClassArrangement = false,
    isNewSemester = false,
    isTeacherView = false,
    classOptions = [],
    classOptionsData = [],
    defaultClass = "",
    onShowMyAttendance,
    isRoleStudent = false,
    isNotifyPage = false,
    isRFIDPage = false,
    onClassSearchChange,
    searchClass = "",
  } = props;
  
  // Debug logs for props
  console.log("TableToolBar props:", {
    isUserManagement,
    classOptionsData,
    searchClass,
    hasOnClassSearchChange: !!onClassSearchChange
  });

  const { state, handler } = useTableToolBarHook({
    isAttendance,
    isClassManagement,
    isUserManagement,
    setFiltersUser,
    setFiltersClass,
    isClassArrangement,
    isNewSemester,
    defaultClass,
    isRoleStudent,
    isNotifyPage,
    isRFIDPage,
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
        {(isAttendance || isTeacherView) && isRoleStudent && (
          <Button
            variant="outlined"
            color="primary"
            onClick={onShowMyAttendance}
          >
            Show my Attendance
          </Button>
        )}
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
            {classOptions?.map((option, index) => (
              <MenuItem key={`class-option-${option}-${index}`} value={option}>
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
              {classOptions?.map((option, index) => (
                <MenuItem key={`class-option-${option}-${index}`} value={option}>
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
              value={filters.academicYear || ''}
              label="Academic Year"
              onChange={e => handleFilterChange("academicYear", e.target.value)}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 48 * 7.5,
                    width: 250,
                  },
                },
              }}
            >
              <MenuItem value="">All Years</MenuItem>
              {handler.getAcademicYears().map((year) => (
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
              value={filters.grade || ''}
              label="Grade"
              onChange={e => handleFilterChange("grade", e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="10">Grade 10</MenuItem>
              <MenuItem value="11">Grade 11</MenuItem>
              <MenuItem value="12">Grade 12</MenuItem>
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
            label="Class Name"
            value={filters.className}
            onChange={e => handleFilterChange("className", e.target.value)}
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          />
          <FormControl
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
          >
            <InputLabel id="academicYear-select-label">
              Academic Year
            </InputLabel>
            <Select
              labelId="academicYear-select-label"
              value={filters.academicYear || ''}
              label="Academic Year"
              onChange={e => handleFilterChange("academicYear", e.target.value)}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 48 * 7.5,
                    width: 250,
                  },
                },
              }}
            >
              <MenuItem value="">All Years</MenuItem>
              {handler.getAcademicYears().map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
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

    return (
      <>
        {isUserManagement ? (
          <Autocomplete
            options={classOptions || []}
            value={searchClass}
            inputValue={searchClass}
            onInputChange={(e, newValue) => {
              if (onClassSearchChange) {
                onClassSearchChange(newValue);
              }
              
              // Apply filter immediately when class changes
              handleFilterChange("class", newValue);
            }}
            renderInput={(params) => <TextField {...params} label="Class" />}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
            fullWidth={isMobile}
          />
        ) : (
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
                <MenuItem key={`class-option-${option}-${index}`} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl
          fullWidth={isMobile}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        >
          <InputLabel id="academicYear-select-label">
            Academic Year
          </InputLabel>
          <Select
            labelId="academicYear-select-label"
            value={filters.academicYear || ''}
            label="Academic Year"
            onChange={e => handleFilterChange("academicYear", e.target.value)}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 48 * 7.5,
                  width: 250,
                },
              },
            }}
          >
            <MenuItem value="">All Years</MenuItem>
            {handler.getAcademicYears().map((year) => (
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
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onSubmit();
            }
          }}
          fullWidth={isMobile}
          sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
        />
        
        <TextField
          label="Phone"
          value={filters.phone}
          onChange={e => handleFilterChange("phone", e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onSubmit();
            }
          }}
          fullWidth={isMobile}
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
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="Roles" placeholder="Select" />
            )}
            fullWidth={isMobile}
            sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
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
      {(isAdmin || isClassManagement || isTeacher) && (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            p: 1,
            alignItems: "center",
          }}
        >
          {renderFilters()}
        </Box>
      )}
    </Toolbar>
  );
};

export default TableToolBar;
