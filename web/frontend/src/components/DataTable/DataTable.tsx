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
  AttendanceHeadCell,
  AttendanceLog,
  ClassHeadCell,
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
import { ClassData } from "../../model/classModels/classModels.model";
import EditAttendanceForm from "./EditAttendanceForm/EditAttendanceForm";

interface DataTableProps {
  headCellsData:
    | HeadCell[]
    | UserHeadCell[]
    | ClassHeadCell[]
    | AttendanceHeadCell[];
  tableMainData: UserData[] | Data[] | ClassData[] | AttendanceLog[];
  tableTitle: string;
  isCheckBox: boolean;
  isAdmin?: boolean;
  isClassManagement?: boolean;
  isAttendance?: boolean;
  isUserManagement?: boolean;
  setFiltersUser?: React.Dispatch<React.SetStateAction<SearchFilters>>;
  isRoleTeacher?: boolean;
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
  isRoleTeacher,
  setFiltersUser,
}: DataTableProps) {
  const { state, handler } = useDataTableHook({ tableMainData });

  const renderActionCell = (row: any) => (
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
                className: row.className,
                grade: row.grade,
                teacherId: row.homeroomTeacherd,
                academicYear: row.academicYear,
              })
            : isAttendance && isRoleTeacher
            ? handler.handleEditAttendanceClick({
                attendanceId: row.attendanceId,
                scheduleId: row.scheduleId,
                userId: row.userId,
                fullName: row.fullName,
                face: row.face,
                checkin: row.checkin,
                status: row.status,
                note: row.note || "",
                checkinFace: row.checkinFace || "",
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
      {state.isEditOpen &&
        isAttendance &&
        state.editingClass &&
        isRoleTeacher && (
          <EditAttendanceForm
            open={state.isEditOpen}
            onClose={() => handler.setIsEditOpen(false)}
            onSave={handler.handleEditAttendanceSave}
            formData={state.editingAttendance}
          />
        )}
      {!isRoleTeacher && (
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
      )}
      {state.isDeleteDialogOpen && state.selectedUserToDelete && (
        <DeleteUserDialog
          open={state.isDeleteDialogOpen}
          onClose={() => handler.setIsDeleteDialogOpen(false)}
          onConfirm={() =>
            handler.handleConfirmDelete(
              isUserManagement
                ? "userDelete"
                : isClassManagement
                ? "classDelete"
                : "nothing"
            )
          }
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
      <TableCell align="left">{row.className}</TableCell>
      <TableCell align="left">{row.grade}</TableCell>
      <TableCell align="left">{row.homeroomTeacherd || "none"}</TableCell>
      <TableCell align="left">{row.batchId}</TableCell>
      <TableCell align="left">{row.academicYear}</TableCell>
      <TableCell align="left">{row.createdAt}</TableCell>
    </>
  );
  const renderAttendanceManagementCells = (row: any) => (
    <>
      <TableCell align="left">{row.scheduleId}</TableCell>
      <TableCell align="left">
        <img
          src={
            row.face
              ? row.face
              : `https://www.pngplay.com/wp-content/uploads/12/User-Avatar-Profile-Transparent-Clip-Art-PNG.png`
          }
          alt="User Avatar"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </TableCell>
      <TableCell align="left">
        <img
          src={
            row.checkinFace
              ? row.checkinFace
              : `https://www.pngplay.com/wp-content/uploads/12/User-Avatar-Profile-Transparent-Clip-Art-PNG.png`
          }
          alt="Checkin Face"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </TableCell>
      <TableCell align="left">{row.userId || "none"}</TableCell>
      {row?.fullName && (
        <TableCell align="left">{row?.fullName || "none"}</TableCell>
      )}
      <TableCell align="left">{row.checkin || "none"}</TableCell>
      <TableCell align="left">{row.status}</TableCell>
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
          isTeacher={isRoleTeacher}
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
              isTeacher={isRoleTeacher}
            />
            <TableBody>
              {state.visibleRows.map((row, index) => {
                const labelId = `enhanced-table-checkbox-${index}`;
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={row?.id}
                    sx={{ cursor: "pointer" }}
                  >
                    {renderCommonCells(row, labelId)}
                    {isUserManagement && renderUserManagementCells(row)}
                    {isAdmin &&
                      !isAttendance &&
                      isUserManagement &&
                      row?.role !== "admin" &&
                      renderActionCell(row)}
                    {isClassManagement && renderClassManagementCells(row)}
                    {isClassManagement && renderActionCell(row)}
                    {isAttendance && renderAttendanceManagementCells(row)}
                    {isAttendance && isRoleTeacher && renderActionCell(row)}
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
