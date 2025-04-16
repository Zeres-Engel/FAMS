import React from "react";
import "./ClassManagementPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import Container from "@mui/material/Container";
import { Grid } from "@mui/material";
import DataTable from "../../components/DataTable/DataTable";
import useClassManagementPageHook from "./useClassManagementPageHook";
function ClassManagementPage(): React.JSX.Element {
  const { state, handler } = useClassManagementPageHook();
  return (
    <LayoutComponent pageHeader="Class Management">
      <Container maxWidth={false} className="classManagementPage-Container">
        <Grid container size={11} className="classManagementPage-Grid">
          <Grid size={12} className="classPage-Header">
            <DataTable
              headCellsData={state.headCellsData}
              tableMainData={state.classMainData}
              tableTitle={state.tableTitle}
              isCheckBox={state.isCheckBox}
              isAdmin={true}
              isClassManagement={true}
            ></DataTable>
          </Grid>
        </Grid>
      </Container>
    </LayoutComponent>
  );
}
export default ClassManagementPage;
