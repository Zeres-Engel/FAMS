import React from "react";
import "./TableHeader.scss";
import {
  Box,
  Checkbox,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import {
  AttendanceHeadCell,
  AttendanceLog,
  ClassArrangementData,
  ClassArrangementHeadCellProps,
  ClassHeadCell,
  ClassStudent,
  ClassStudentHeadCell,
  Data,
  HeadCell,
  NotifyHeadCell,
  NotifyProps,
  Order,
  RFIDData,
  RFIDHeadCell,
  UserHeadCell,
} from "../../../model/tableModels/tableDataModels.model";
import useTableHeaderHook from "./useTableHeaderHook";
import { visuallyHidden } from "@mui/utils";
import { UserData } from "../../../model/userModels/userDataModels.model";
import { ClassData } from "../../../model/classModels/classModels.model";

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property:
      | keyof Data
      | keyof UserData
      | keyof ClassData
      | keyof AttendanceLog
      | keyof ClassArrangementData
      | keyof NotifyProps
      | keyof RFIDData
      | keyof ClassStudent
  ) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  headCellsData:
    | HeadCell[]
    | UserHeadCell[]
    | ClassHeadCell[]
    | AttendanceHeadCell[]
    | ClassArrangementHeadCellProps[]
    | NotifyHeadCell[]
    | RFIDHeadCell[]
    | ClassStudentHeadCell[];
  isCheckBox: boolean;
  isAdmin?: boolean;
  isTeacher?: boolean;
  isClassArrangement?: boolean;
  isNewSemester?: boolean;
  isRFIDPage?: boolean;
}

function TableHeader(props: EnhancedTableProps): React.JSX.Element {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
    headCellsData,
    isCheckBox,
    isAdmin,
    isTeacher,
    isClassArrangement,
    isNewSemester,
    isRFIDPage,
  } = props;

  const { state, handler } = useTableHeaderHook({
    onRequestSort,
    headCellsData,
  });

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          {isCheckBox && (
            <Checkbox
              color="primary"
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
              inputProps={{
                "aria-label": "select all row",
              }}
            />
          )}
        </TableCell>
        {state?.headCellsData.map((headCell, index) => (
          <TableCell
            key={`header-cell-${headCell.id}-${index}`}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={handler.createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}

        {isAdmin && !isClassArrangement && !isNewSemester && !isRFIDPage && (
          <TableCell align="left">Action</TableCell>
        )}
        {/* {isTeacher && <TableCell align="left">Action</TableCell>} */}
      </TableRow>
    </TableHead>
  );
}

export default TableHeader;
