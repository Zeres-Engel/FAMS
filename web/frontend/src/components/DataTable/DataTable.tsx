import * as React from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import "./DataTable.scss";
import TableToolBar from "./TableToolBar/TableToolBar";
import useDataTableHook from "./useDataTableHook";
import TableHeader from "./TableHeader/TableHeader";
import { Data, HeadCell } from "../../model/tableModels/tableDataModels.model";

interface DataTableProps {
  headCellsData: HeadCell[];
  tableMainData: Data[];
  tableTitle: string;
}
export default function DataTable(props: DataTableProps) {
  const { headCellsData, tableMainData,tableTitle } = props;
  const { state, handler } = useDataTableHook({ tableMainData });

  return (
    <Box sx={{ width: "100%" }} className="dataTable-Container">
      <Paper sx={{ width: "100%", mb: 2 }} className="dataTable-Table">
        <TableToolBar numSelected={state.selected.length} tableTitle={tableTitle} />
        <TableContainer>
          <Table sx={{ minWidth: 850 }} aria-labelledby="tableTitle">
            <TableHeader
              numSelected={state.selected.length}
              order={state.order}
              orderBy={state.orderBy}
              onSelectAllClick={handler.handleSelectAllClick}
              onRequestSort={handler.handleRequestSort}
              rowCount={state.rows.length}
              headCellsData={headCellsData}
            />
            <TableBody>
              {state.visibleRows.map((row, index) => {
                const isItemSelected = state.selected.includes(row.id);
                const labelId = `enhanced-table-checkbox-${index}`;
                return (
                  <TableRow
                    hover
                    onClick={event => handler.handleClick(event, row.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        inputProps={{
                          "aria-labelledby": labelId,
                        }}
                      />
                    </TableCell>
                    <TableCell
                      component="th"
                      id={labelId}
                      scope="row"
                      padding="none"
                    >
                      {row.name}
                    </TableCell>
                    <TableCell align="left">
                      <img src={row.avatar} alt="" width={40} height={40} />
                    </TableCell>
                    <TableCell align="left">{row.creationAt}</TableCell>
                    <TableCell align="left">{row.email}</TableCell>
                    <TableCell align="left">{row.role}</TableCell>
                    <TableCell align="left">{row.updatedAt}</TableCell>
                  </TableRow>
                );
              })}
              {state.emptyRows > 0 && (
                <TableRow
                  style={{
                    height: 53 * state.emptyRows,
                  }}
                >
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={state.rows.length}
          rowsPerPage={state.rowsPerPage}
          page={state.page}
          onPageChange={handler.handleChangePage}
          onRowsPerPageChange={handler.handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
