import React from "react";
import LayoutComponent from "../../components/Layout/Layout";
import DataTable from "../../components/DataTable/DataTable";
import { Container, Grid } from "@mui/material";
import useAttendancePageHook from "./useAttendancePageHook";

function AttendanceManagementPage(): React.JSX.Element {
  const { state, handler } = useAttendancePageHook();
  return (
    <LayoutComponent pageHeader="Attendance Page">
      <Container
        maxWidth={false}
        className="attendanceManagementPage-Container"
      >
        <Grid container size={11} className="attendanceManagementPage-Grid">
          <Grid size={12} className="attendanceManagementPage-Header">
            <DataTable
              headCellsData={state.headCellsData}
              tableMainData={state.attendanceFormattedData}
              tableTitle={state.tableTitle}
              isCheckBox={state.isCheckBox}
              isAttendance={true}
              isRoleTeacher={state.role === "teacher"}
              isRoleStudent={state.role === "student" || state.role ==="parent"}
              isRoleParent={state.role ==="parent"}
              setFiltersAttendancePage={handler.setFiltersAttendancePage}
              classPageList={state.classAttendanceList}
              onShowMyAttendance={handler.onShowMyAttendance}
            ></DataTable>
          </Grid>
        </Grid>
      </Container>
    </LayoutComponent>
  );
}
export default AttendanceManagementPage;
