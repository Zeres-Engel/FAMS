import React from "react";
import "./NotifyPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import Container from "@mui/material/Container";
import { Grid, CircularProgress, Typography, Alert } from "@mui/material";
import DataTable from "../../components/DataTable/DataTable";
import useNotifyPageHook from "./useNotifyPageHook";

function NotifyPage(): React.JSX.Element {
  const { state, handler } = useNotifyPageHook();
  
  return (
    <LayoutComponent pageHeader="Notification Page">
      <Container maxWidth={false} className="NotifyPage-Container">
        <Grid container size={11} className="NotifyPage-Grid">
          <Grid size={12} className="NotifyPage-Header">
            {state.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {state.error}
              </Alert>
            )}
            
            {state.loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                <CircularProgress />
              </div>
            ) : state.userMainData.length === 0 ? (
              <Typography variant="h6" sx={{ textAlign: 'center', padding: '50px' }}>
                No notifications found
              </Typography>
            ) : (
              <DataTable
                headCellsData={state.headCellsData}
                tableMainData={state.userMainData}
                tableTitle={state.tableTitle}
                isCheckBox={false}
                isNotifyPage={true}
                isAdmin={true}
                isNotifyRole={state.role || ''}
              />
            )}
          </Grid>
        </Grid>
      </Container>
    </LayoutComponent>
  );
}

export default NotifyPage;
