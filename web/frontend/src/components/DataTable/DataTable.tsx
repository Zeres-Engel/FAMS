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
  TableHead,
  Checkbox,
  Button,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Divider,
  IconButton,
  CircularProgress,
} from "@mui/material";
import "./DataTable.scss";
import TableToolBar from "./TableToolBar/TableToolBar";
import useDataTableHook from "./useDataTableHook";
import TableHeader from "./TableHeader/TableHeader";
import {
  AttendanceHeadCell,
  AttendanceLog,
  AttendanceSearchParam,
  ClassArrangementData,
  ClassArrangementHeadCellProps,
  ClassHeadCell,
  ClassPageList,
  ClassStudent,
  ClassStudentHeadCell,
  Data,
  HeadCell,
  NotifyHeadCell,
  NotifyProps,
  RFIDData,
  RFIDHeadCell,
  SubjectList,
  SystemRole,
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
import {
  ClassData,
  SearchClassFilters,
} from "../../model/classModels/classModels.model";
import EditAttendanceForm from "./EditAttendanceForm/EditAttendanceForm";
import CreateNotifyForm from "./CreateNotifyForm/CreateNotifyForm";
import ShowNotify from "./ShowNotify/ShowNotify";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";

// Thêm interface cho pagination
interface PaginationProps {
  page: number;
  limit: number;
  total: number;
}

interface DataTableProps {
  headCellsData:
    | HeadCell[]
    | UserHeadCell[]
    | ClassHeadCell[]
    | AttendanceHeadCell[]
    | ClassArrangementHeadCellProps[]
    | NotifyHeadCell[]
    | RFIDHeadCell[]
    | ClassStudentHeadCell[];
  tableMainData:
    | UserData[]
    | Data[]
    | ClassData[]
    | AttendanceLog[]
    | ClassArrangementData[]
    | NotifyProps[]
    | RFIDData[]
    | ClassStudent[];
  tableTitle: string;
  isCheckBox: boolean;
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
  isRoleTeacher?: boolean;
  isClassArrangement?: boolean;
  isNewSemester?: boolean;
  isTeacherView?: boolean;
  isRoleStudent?: boolean;
  isNotifyPage?: boolean;
  isNotifyRole?: string;
  isRFIDPage?: boolean;
  classOptions?: string[];
  classOptionsData?: Array<{ className: string; id: string }>;
  className?: string;
  onClassChange?: (className: string) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  isClassPage?: boolean;
  classPageList?: ClassPageList[];
  subjectList?: SubjectList[];
  availableAcademicYears?: string[];
  onShowMyAttendance?: () => void;
  onAcademicYearChange?: (year: string) => void;
  classYears?: Array<{ className: string; academicYear: string }>;
  isRoleParent?: boolean;
  importUsersButton?: React.ReactNode;
  createButtonAction?: () => void;
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
  setFiltersClass,
  isClassArrangement,
  isNewSemester,
  isTeacherView,
  isRoleStudent,
  isNotifyPage,
  isNotifyRole,
  isRFIDPage,
  classOptions,
  classOptionsData,
  className,
  onClassChange,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onShowMyAttendance,
  isClassPage,
  classPageList,
  setFiltersClassPage,
  availableAcademicYears,
  onAcademicYearChange,
  setFiltersAttendancePage,
  subjectList,
  classYears,
  isRoleParent,
  importUsersButton,
  createButtonAction,
}: DataTableProps) {
  const { state, handler } = useDataTableHook({ tableMainData });

  const renderActionCell = (row: any) => (
    <TableCell align="left">
      {isClassManagement && (
        <Button
          variant="outlined"
          color="info"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            handler.handleViewClick(row);
          }}
          sx={{ mr: 1 }}
        >
          View
        </Button>
      )}
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
          if (isClassManagement) {
            handler.handleEditClassClick(
              {
                className: row.className,
                grade: row.grade,
                teacherId: row.homeroomTeacherId,
                academicYear: row.academicYear,
              },
              row.id
            );
          } else if (isAttendance && isRoleTeacher) {
            handler.handleEditAttendanceClick({
              attendanceId: row.attendanceId,
              scheduleId: row.scheduleId,
              userId: row.userId,
              fullName: row.fullName,
              face: row.face,
              checkin: row.checkin,
              status: row.status,
              note: row.note || "",
              checkinFace: row.checkinFace || "",
            });
          } else if (isNotifyPage) {
            handler.handleShowNotify(row); // Gọi handler mở notify
          } else {
            handler.handleEditClick(row, row?.id);
          }
        }}
        sx={{ mr: 1 }}
      >
        {isNotifyPage ? "View" : "Edit"}
      </Button>

      {!isRoleTeacher && !isNotifyPage && (
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
    </TableCell>
  );

  const renderCommonCells = (
    row: any,
    labelId: string,
    isItemSelected: boolean
  ) => (
    <>
      <TableCell padding="checkbox">
        {isCheckBox && (
          <Checkbox
            checked={isItemSelected}
            color="primary"
            inputProps={{ "aria-labelledby": labelId }}
          />
        )}
      </TableCell>
      <TableCell component="th" id={labelId} scope="row" padding="none">
        {isClassManagement ? row.classId : row.id}
      </TableCell>
      {/* <TableCell align="left">{row.name}</TableCell> */}
    </>
  );

  const renderUserManagementCells = (row: any) => (
    <>
      {/* <TableCell align="left">{row.id}</TableCell> */}
      {/* <TableCell align="left">{row.username}</TableCell> */}
      <TableCell align="left">
        <img
          src={
            row.avatar
              ? row.avatar
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
      <TableCell align="left">{row.name}</TableCell>
      <TableCell align="left">{row.email}</TableCell>
      {/* <TableCell align="left">{row.backup_email}</TableCell> */}
      <TableCell align="left">{row.phoneSub}</TableCell>
      <TableCell align="left">{row.role}</TableCell>
      <TableCell align="left">{row.createdAt}</TableCell>
      <TableCell align="left">{row.updatedAt}</TableCell>
    </>
  );
  const renderClassPageCells = (row: any) => (
    <>
      <TableCell align="left">{row.fullName}</TableCell>
      <TableCell align="left">
        <img
          src={
            row.avatar
              ? row.avatar
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
      <TableCell align="left">{row.email}</TableCell>
      <TableCell align="left">{row.phone}</TableCell>
      <TableCell align="left">{row.role}</TableCell>
    </>
  );
  const renderClassManagementCells = (row: any) => (
    <>
      <TableCell align="left">{row.className}</TableCell>
      <TableCell align="left">{row.grade}</TableCell>
      <TableCell align="left">{row.homeroomTeacherId || "none"}</TableCell>
      <TableCell align="left">{row.studentNumber || 0}</TableCell>
      {/* <TableCell align="left">{row.batchId}</TableCell> */}
      <TableCell align="left">{row.academicYear}</TableCell>
      <TableCell align="left">{row.createdAt}</TableCell>
    </>
  );
  const renderClassArrangementNewCells = (row: any) => (
    <>
      <TableCell align="left">{row.username}</TableCell>
      <TableCell align="left">{row.name}</TableCell>
      <TableCell align="left">{row.email}</TableCell>
      <TableCell align="left">{row.phone}</TableCell>
    </>
  );
  const renderNewSemesterArrangementNewCells = (row: any) => (
    <>
      <TableCell align="left">{row.username}</TableCell>
      <TableCell align="left">{row.name}</TableCell>
      <TableCell align="left">{row.email}</TableCell>
      <TableCell align="left">{row.phone}</TableCell>
      <TableCell align="left">{row.grade}</TableCell>
      <TableCell align="left">{row.className}</TableCell>
    </>
  );
  const renderNotifyNewCells = (row: any) => (
    <>
      <TableCell align="left">{row.sendDate}</TableCell>
      <TableCell align="left">{row.message}</TableCell>
      <TableCell align="left">{row.sender}</TableCell>
      <TableCell align="left">{row.receiver}</TableCell>
    </>
  );
  const renderRFIDNewCells = (row: any) => (
    <>
      <TableCell align="left">{row.userid}</TableCell>
      <TableCell align="left">{row.rfid}</TableCell>
      <TableCell align="left">{row.expTime}</TableCell>
      <TableCell align="left">{row.faceAttendance}</TableCell>
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
      {(isRoleTeacher || isRoleStudent) && (
        <TableCell align="left">{row?.fullName || "none"}</TableCell>
      )}
      <TableCell align="left">{row.checkin || "none"}</TableCell>
      <TableCell align="left">{row?.note || "none"}</TableCell>
      <TableCell align="left">{row.status}</TableCell>
    </>
  );

  // Thêm hàm xử lý phân trang
  const handleChangePage = (event: unknown, newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage + 1); // API uses 1-based indexing
    }
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(parseInt(event.target.value, 10));
    }
  };

  return (
    <Box sx={{ width: "100%" }} className="dataTable-Container">
      {/* <Paper sx={{ width: "100%", mb: 2 }} className="dataTable-Table"> */}
      <Paper
        sx={{
          width: "100%",
          mb: 2,
          borderRadius: "8px",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <TableToolBar
          isClassPage={isClassPage}
          onShowMyAttendance={onShowMyAttendance}
          classYears={classYears}
          isUserManagement={isUserManagement}
          numSelected={state.selected.length}
          tableTitle={tableTitle}
          isAdmin={isAdmin}
          isClassManagement={isClassManagement}
          isAttendance={isAttendance}
          setFiltersUser={setFiltersUser}
          setFiltersClass={setFiltersClass}
          setFiltersClassPage={setFiltersClassPage}
          isClassArrangement={isClassArrangement}
          isTeacher={isRoleTeacher}
          classOptions={classOptions}
          classOptionsData={classOptionsData}
          defaultClass={className ?? ""}
          onClassChange={onClassChange}
          isNewSemester={isNewSemester}
          isRoleParent={isRoleParent}
          isTeacherView={isTeacherView}
          classPageList={classPageList}
          isRoleStudent={isRoleStudent}
          isNotifyPage={isNotifyPage}
          isRFIDPage={isRFIDPage}
          availableAcademicYears={availableAcademicYears}
          subjectList={subjectList}
          onAcademicYearChange={onAcademicYearChange}
          setFiltersAttendancePage={setFiltersAttendancePage}
          createButtonAction={createButtonAction}
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
              isNewSemester={isNewSemester}
              isClassArrangement={isClassArrangement}
              isRFIDPage={isRFIDPage}
            />
            <TableBody>
              {state.visibleRows.map((row, index) => {
                const labelId = `enhanced-table-checkbox-${index}`;
                const isItemSelected = state.selected.includes(
                  String(row.id || "")
                );
                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={`table-row-${row?.id || index}-${tableTitle}`}
                    sx={{ cursor: "pointer" }}
                    onClick={event =>
                      isCheckBox &&
                      handler.handleClick(event, String(row.id || ""))
                    }
                    aria-checked={isItemSelected}
                    selected={isItemSelected}
                  >
                    {renderCommonCells(row, labelId, isItemSelected)}
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
                    {isClassArrangement && renderClassArrangementNewCells(row)}
                    {isNewSemester && renderNewSemesterArrangementNewCells(row)}
                    {isNotifyPage && renderNotifyNewCells(row)}
                    {isNotifyPage && renderActionCell(row)}
                    {isRFIDPage && renderRFIDNewCells(row)}
                    {isClassPage && renderClassPageCells(row)}
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
            gap: 2,
            px: 2,
            pt: 2,
          }}
        >
          {isClassArrangement && state.selected.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="grade-select-label">Grade</InputLabel>
              <Select
                labelId="grade-select-label"
                value={state.selectedGrade}
                label="Grade"
                onChange={e => handler.setSelectedGrade(e.target.value)}
              >
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="11">11</MenuItem>
                <MenuItem value="12">12</MenuItem>
              </Select>
              {state.gradeError && (
                <Box sx={{ color: "error.main", fontSize: "0.75rem", mt: 0.5 }}>
                  Please select a grade.
                </Box>
              )}
            </FormControl>
          )}

          {/* Display import users button if provided and if we're in user management */}
          {isUserManagement && importUsersButton && importUsersButton}

          {isAdmin && isClassManagement && createButtonAction && (
            <Button
              variant="contained"
              color="primary"
              onClick={createButtonAction}
            >
              CREATE CLASS
            </Button>
          )}

          {isAdmin && !isAttendance && !isClassManagement && (
            <Button
              variant="contained"
              color="primary"
              startIcon={isUserManagement ? <PersonAddIcon /> : undefined}
              onClick={() => {
                if (isClassArrangement) {
                  handler.handleSubmitClassArrangement(isClassArrangement);
                } else if (isNewSemester) {
                  handler.handleSubmitNewSemesterArrangement(isNewSemester);
                } else {
                  handler.setIsCreateUser(!state.isCreateUser);
                }
              }}
            >
              {!state.isCreateUser
                ? isClassManagement || isClassArrangement
                  ? "Create Class"
                  : isNewSemester
                  ? "Submit"
                  : isNotifyPage
                  ? "Create Notify"
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
        {state.isCreateUser && !isAttendance && isNotifyPage && (
          <CreateNotifyForm role={isNotifyRole || ""} />
        )}

        {/* Pagination */}
        {pagination && isUserManagement && (
          <TablePagination
            rowsPerPageOptions={[]}
            component="div"
            count={pagination.total}
            rowsPerPage={5}
            page={pagination.page - 1}
            onPageChange={handleChangePage}
            labelDisplayedRows={({ from, to, count }) => {
              const totalPages = Math.ceil(count / 5);
              return `${from}–${to} of ${count} (Page ${pagination.page} of ${totalPages})`;
            }}
          />
        )}
        {!isUserManagement && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={state.rows.length}
            rowsPerPage={state.rowsPerPage}
            page={state.page}
            onPageChange={handler.handleChangePage}
            onRowsPerPageChange={handler.handleChangeRowsPerPage}
            labelRowsPerPage="Rows per page:"
            SelectProps={{
              sx: {
                minWidth: "64px",
                paddingRight: "15px",
              },
            }}
          />
        )}
      </Paper>
      {state.isEditOpen && isUserManagement && state.editingUser && (
        <EditUserModal
          open={state.isEditOpen}
          onClose={() => handler.setIsEditOpen(false)}
          onSave={handler.handleEditSave}
          userType={state.editingUser.role}
          formData={state.editingUser}
          idUser={state?.editingUserId || ""}
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
        state.editingAttendance &&
        isRoleTeacher && (
          <EditAttendanceForm
            open={state.isEditOpen}
            onClose={() => handler.setIsEditOpen(false)}
            onSave={handler.handleEditAttendanceSave}
            formData={state.editingAttendance}
          />
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
      {isNotifyPage && state.isShowNotifyOpen && state.selectedNotify && (
        <ShowNotify
          open={state.isShowNotifyOpen}
          onClose={() => handler.setIsShowNotifyOpen(false)}
          notifyData={state.selectedNotify}
        />
      )}

      {/* View Class Dialog */}
      {isClassManagement && state.selectedClassToView && (
        <Dialog
          open={state.isViewDialogOpen}
          onClose={() => handler.setIsViewDialogOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Class Details</Typography>
              <IconButton
                aria-label="close"
                onClick={() => handler.setIsViewDialogOpen(false)}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {state.selectedClassToView.className}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Class Information
                </Typography>
                <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Class ID</Typography>
                    <Typography variant="body1">{state.selectedClassToView.classId}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Grade</Typography>
                    <Typography variant="body1">{state.selectedClassToView.grade}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Academic Year</Typography>
                    <Typography variant="body1">{state.selectedClassToView.academicYear}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Homeroom Teacher</Typography>
                    <Typography variant="body1">{state.selectedClassToView.homeroomTeacherId || "Not assigned"}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Number of Students</Typography>
                    <Typography variant="body1">{state.selectedClassToView.studentNumber || 0}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Created At</Typography>
                    <Typography variant="body1">{new Date(state.selectedClassToView.createdAt).toLocaleDateString()}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handler.setIsViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Class Students Table */}
      {isClassManagement && state.selectedClassToView && (
        <Paper
          sx={{
            width: "100%",
            mt: 3,
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Students in {state.selectedClassToView.className}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Grade {state.selectedClassToView.grade} - Academic Year {state.selectedClassToView.academicYear}
            </Typography>
          </Box>
          <Divider />
          
          {state.isLoadingStudents ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : state.classStudents.length > 0 ? (
            <TableContainer>
              <Table sx={{ minWidth: 850 }} aria-label="students table">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Avatar</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Role</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {state.classStudents.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>
                        <img
                          src={
                            student.avatar
                              ? student.avatar
                              : `https://www.pngplay.com/wp-content/uploads/12/User-Avatar-Profile-Transparent-Clip-Art-PNG.png`
                          }
                          alt="Student Avatar"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      </TableCell>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{student.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No students found in this class
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
