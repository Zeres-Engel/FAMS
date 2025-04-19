import React from "react";
import "./NotifyPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import Container from "@mui/material/Container";
import { Grid } from "@mui/material";
import DataTable from "../../components/DataTable/DataTable";
import useNotifyPageHook from "./useNotifyPageHook";
function NotifyPage(): React.JSX.Element {
  const { state, handler } = useNotifyPageHook();
  return (
    <LayoutComponent pageHeader="Notify Page">
      <Container maxWidth={false} className="NotifyPage-Container">
        <Grid container size={11} className="NotifyPage-Grid">
          <Grid size={12} className="NotifyPage-Header">
            <DataTable
              headCellsData={state.headCellsData}
              tableMainData={state.userMainData}
              tableTitle={state.tableTitle}
              isCheckBox={false}
              isNotifyPage={true}
              isAdmin={true}
              isNotifyRole={state.role || ''}
              //  isNotifyRole={'parent'}
            ></DataTable>
          </Grid>
        </Grid>
      </Container>
    </LayoutComponent>
  );
}
export default NotifyPage;
