// DataTable.tsx
import * as React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  Checkbox,
  Button,
} from "@mui/material";
import "./DataTable.scss";
import TableToolBar from "./TableToolBar/TableToolBar";
import useDataTableHook from "./useDataTableHook";
import TableHeader from "./TableHeader/TableHeader";
import {
  Data,
  HeadCell,
  UserHeadCell,
} from "../../model/tableModels/tableDataModels.model";
import AddUserForm from "./AddUserForm/AddUserForm";
import EditUserModal from "./EditUserForm/EditUserForm";
import DeleteUserDialog from "./DeleteUserDialog/DeleteUserDialog";
import EditClassForm from "./EditClassForm/EditClassForm";
import AddClassForm from "./AddClassForm/AddClassForm";
import {
  SearchFilters,
  UserData,
} from "../../model/userModels/userDataModels.model";
import useState from "react";

interface DataTableProps {
  headCellsData: HeadCell[] | UserHeadCell[];
  tableMainData: UserData[] | Data[];
  tableTitle: string;
  isCheckBox: boolean;
  isAdmin?: boolean;
  isClassManagement?: boolean;
  isAttendance?: boolean;
  isUserManagement?: boolean;
  setFiltersUser?: React.Dispatch<React.SetStateAction<SearchFilters>>;
}

export default function DataTable({
  headCellsData,
  tableMainData,
  tableTitle,
  isCheckBox,
  isAdmin,
  isClassManagement,
  isAttendance,
  isUserManagement,
  setFiltersUser,
}: DataTableProps) {
  const { state, handler } = useDataTableHook({ tableMainData });

  const renderActionCell = (row: any) =>  (
    <TableCell align="left">
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
          isClassManagement
            ? handler.handleEditClassClick({
                className: row.name,
                batch: row.batch,
                teacherId: row.teacherId,
              })
            : handler.handleEditClick(row, row?.id);
        }}
        sx={{ mr: 1 }}
      >
        Edit
      </Button>

      {state.isEditOpen && isUserManagement && state.editingUser && (
        <EditUserModal
          open={state.isEditOpen}
          onClose={() => handler.setIsEditOpen(false)}
          onSave={handler.handleEditSave}
          userType={row?.role || state.editingUser.role}
          formData={state.editingUser}
          idUser={row?.id}
        />
      )}

      {state.isEditOpen && isClassManagement && state.editingClass && (
        <EditClassForm
          open={state.isEditOpen}
          onClose={() => handler.setIsEditOpen(false)}
          onSave={handler.handleEditClassSave}
          formData={state.editingClass}
        />
      )}

      <Button
        variant="outlined"
        color="error"
        size="small"
        onClick={e => {
          e.stopPropagation();
          handler.handleDeleteClick(row);
        }}
      >
        Delete
      </Button>

      {state.isDeleteDialogOpen && state.selectedUserToDelete && (
        <DeleteUserDialog
          open={state.isDeleteDialogOpen}
          onClose={() => handler.setIsDeleteDialogOpen(false)}
          onConfirm={handler.handleConfirmDelete}
          userName={state.selectedUserToDelete.name}
        />
      )}
    </TableCell>
  );

  const renderCommonCells = (row: any, labelId: string) => (
    <>
      <TableCell padding="checkbox">
        {isCheckBox && (
          <Checkbox
            color="primary"
            inputProps={{ "aria-labelledby": labelId }}
          />
        )}
      </TableCell>
      <TableCell component="th" id={labelId} scope="row" padding="none">
        {row.id}
      </TableCell>
      {/* <TableCell align="left">{row.name}</TableCell> */}
    </>
  );

  const renderUserManagementCells = (row: any) => (
    <>
      {/* <TableCell align="left">{row.id}</TableCell> */}
      <TableCell align="left">{row.username}</TableCell>
      <TableCell align="left">{row.email}</TableCell>
      {/* <TableCell align="left">{row.backup_email}</TableCell> */}
      <TableCell align="left">{row.name}</TableCell>
      <TableCell align="left">{row.phoneSub}</TableCell>
      <TableCell align="left">{row.role}</TableCell>
      <TableCell align="left">{row.classSubId}</TableCell>
      <TableCell align="left">{row.gradeSub}</TableCell>
      <TableCell align="left">{row.createdAt}</TableCell>
      <TableCell align="left">{row.updatedAt}</TableCell>
    </>
  );

  const renderClassManagementCells = (row: any) => (
    <>
      <TableCell align="left">{row.teacherId}</TableCell>
      <TableCell align="left">{row.batch}</TableCell>
    </>
  );

  return (
    <Box sx={{ width: "100%" }} className="dataTable-Container">
      <Paper sx={{ width: "100%", mb: 2 }} className="dataTable-Table">
        <TableToolBar
          isUserManagement={isUserManagement}
          numSelected={state.selected.length}
          tableTitle={tableTitle}
          isAdmin={isAdmin}
          isClassManagement={isClassManagement}
          isAttendance={isAttendance}
          setFiltersUser={setFiltersUser}
        />
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
              isCheckBox={isCheckBox}
              isAdmin={isAdmin}
            />
            <TableBody>
              {state.visibleRows.map((row, index) => {
                const labelId = `enhanced-table-checkbox-${index}`;
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={row.id}
                    sx={{ cursor: "pointer" }}
                  >
                    {renderCommonCells(row, labelId)}
                    {isUserManagement && renderUserManagementCells(row)}
                    {/* {isClassManagement && renderClassManagementCells(row)} */}
                    {isAdmin &&
                      !isAttendance &&
                      isUserManagement &&
                      row?.role !== "admin" &&
                      renderActionCell(row)}
                  </TableRow>
                );
              })}
              {state.emptyRows > 0 && (
                <TableRow style={{ height: 53 * state.emptyRows }}>
                  <TableCell colSpan={12} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Add Button */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            px: 2,
            pt: 2,
          }}
        >
          {isAdmin && !isAttendance && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handler.setIsCreateUser(!state.isCreateUser)}
            >
              {!state.isCreateUser
                ? isClassManagement
                  ? "Create Class"
                  : "Create User"
                : "Close"}
            </Button>
          )}
        </Box>

        {/* Add Form */}
        {state.isCreateUser && !isAttendance && isUserManagement && (
          <AddUserForm />
        )}
        {state.isCreateUser && !isAttendance && isClassManagement && (
          <AddClassForm />
        )}

        {/* Pagination */}
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
