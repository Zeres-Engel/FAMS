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
  Data,
  HeadCell,
  Order,
  UserHeadCell,
} from "../../../model/tableModels/tableDataModels.model";
import useTableHeaderHook from "./useTableHeaderHook";
import { visuallyHidden } from "@mui/utils";
import { UserData } from "../../../model/userModels/userDataModels.model";

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Data | keyof UserData
  ) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  headCellsData: HeadCell[] | UserHeadCell[];
  isCheckBox: boolean;
  isAdmin?: boolean;
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
        {state?.headCellsData.map(headCell => (
          <TableCell
            key={headCell.id}
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

        {/* 👇 Thêm cột Action nếu là admin */}
        {isAdmin && <TableCell align="left">Action</TableCell>}
      </TableRow>
    </TableHead>
  );
}

export default TableHeader;
