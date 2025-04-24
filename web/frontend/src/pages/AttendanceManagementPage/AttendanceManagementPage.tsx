import React from "react";
import "./AttendanceManagementPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import DataTable from "../../components/DataTable/DataTable";
import { Container, Grid } from "@mui/material";
import useAttendanceManagementPageHook from "./useAttendanceManagementPageHook";
function AttendanceManagementPage(): React.JSX.Element {
  const { state, handler } = useAttendanceManagementPageHook();
  return (
    <LayoutComponent pageHeader="Attendance Management">
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
              subjectList={state.subjectList}
              classPageList={state.classPageList}
              setFiltersAttendancePage={handler.setFiltersAttendancePage}
              isAttendance={true}
            ></DataTable>
          </Grid>
        </Grid>
      </Container>
    </LayoutComponent>
  );
}
export default AttendanceManagementPage;
