import React from "react";
import "./UserManagementPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import Container from "@mui/material/Container";
import { Grid } from "@mui/material";
import DataTable from "../../components/DataTable/DataTable";
import useUserManagementPageHook from "./useUserManagementPageHook";
function UserManagementPage(): React.JSX.Element {
  const { state, handler } = useUserManagementPageHook();
  return (
    <LayoutComponent pageHeader="User Management">
      <Container maxWidth={false} className="userManagementPage-Container">
        <Grid container size={11} className="userManagementPage-Grid">
          <Grid size={12} className="classPage-Header">
            <DataTable
              headCellsData={state.headCellsData}
              tableMainData={state.userMainData}
              tableTitle={state.tableTitle}
              isCheckBox={state.isCheckBox}
              isAdmin={true}
              isUserManagement={true}
              setFiltersUser = {handler.setFiltersUser}
            ></DataTable>
          </Grid>
        </Grid>
      </Container>
    </LayoutComponent>
  );
}
export default UserManagementPage;
