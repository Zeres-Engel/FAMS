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
  numSelected: number;
  tableTitle: string;
  isAdmin?: boolean;
  isClassManagement?: boolean;
  isAttendance?: boolean;
  isUserManagement?: boolean;
  setFiltersUser?: React.Dispatch<React.SetStateAction<SearchFilters>>;
}

const roleOptions = ["supervisor", "teacher", "student", "parent", "admin"];
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

function TableToolBar(props: EnhancedTableToolbarProps): React.JSX.Element {
  const {
    numSelected,
    tableTitle,
    isAdmin = false,
    isClassManagement = false,
    isAttendance = false,
    isUserManagement = false,
    setFiltersUser
  } = props;

  const { state, handler } = useTableToolBarHook({
    isAttendance,
    isClassManagement,
    isUserManagement,
    setFiltersUser
  });

  const { filters } = state;
  const { handleFilterChange, onSubmit } = handler;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        {numSelected > 0 ? (
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
            <Tooltip title="Delete">
              <IconButton>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
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
        )}
      </Box>

      {/* Filter Section */}
      {(isAdmin || isClassManagement || isAttendance) && (
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          {isAttendance ? (
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
              <TextField
                label="Date From"
                type="date"
                value={filters.dateFrom}
                onChange={e => handleFilterChange("dateFrom", e.target.value)}
                fullWidth={isMobile}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
              />
              <TextField
                label="Date To"
                type="date"
                value={filters.dateTo}
                onChange={e => handleFilterChange("dateTo", e.target.value)}
                fullWidth={isMobile}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
              />
            </>
          ) : isClassManagement ? (
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
              <FormControl
                fullWidth={isMobile}
                sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
              >
                <InputLabel id="batch-select-label">Batch</InputLabel>
                <Select
                  labelId="batch-select-label"
                  value={filters.batch}
                  label="Batch"
                  onChange={e => handleFilterChange("batch", e.target.value)}
                >
                  <MenuItem value="10">10</MenuItem>
                  <MenuItem value="11">11</MenuItem>
                  <MenuItem value="12">12</MenuItem>
                </Select>
              </FormControl>
            </>
          ) : (
            <>
              <TextField
                label="Class"
                value={filters.class}
                onChange={e => handleFilterChange("class", e.target.value)}
                fullWidth={isMobile}
                sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
              />
              <TextField
                label="Name"
                value={filters.name}
                onChange={e => handleFilterChange("name", e.target.value)}
                fullWidth={isMobile}
                sx={{ flex: isMobile ? "1 1 100%" : "1 1 200px" }}
              />
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
                  onChange={(event, value) =>
                    handleFilterChange("roles", value)
                  }
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
                    <TextField
                      {...params}
                      label="Roles"
                      placeholder="Select roles"
                    />
                  )}
                  fullWidth
                />
              </Box>
            </>
          )}

          <Box
            sx={{
              flex: isMobile ? "1 1 100%" : "1 1 120px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={onSubmit}
              size="small"
              sx={{ px: 2, py: 1, minWidth: 100 }}
            >
              Search
            </Button>
          </Box>
        </Box>
      )}
    </Toolbar>
  );
}

export default TableToolBar;
