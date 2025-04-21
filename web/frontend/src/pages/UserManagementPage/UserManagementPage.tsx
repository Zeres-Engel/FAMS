import React from "react";
import "./UserManagementPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import Container from "@mui/material/Container";
import { Box, Paper } from "@mui/material";
import DataTable from "../../components/DataTable/DataTable";
import useUserManagementPageHook from "./useUserManagementPageHook";
import InitUserDataSection from "../../components/InitUserDataSection/InitUserDataSection";

function UserManagementPage(): React.JSX.Element {
  const { state, handler } = useUserManagementPageHook();

  return (
    <LayoutComponent pageHeader="User Management">
      <Container maxWidth={false} className="userManagementPage-Container">
        <Box className="userManagementPage-Box">
          <Box mb={4}>
            <DataTable
              headCellsData={state.headCellsData}
              tableMainData={state.userMainData}
              tableTitle={state.tableTitle}
              isCheckBox={state.isCheckBox}
              isAdmin={true}
              isUserManagement={true}
              setFiltersUser={handler.setFiltersUser}
              classOptions={state.classOptions}
            />
          </Box>

          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 2,
              maxWidth: 600,
              mx: "auto",
            }}
          >
            <InitUserDataSection
              initUserFile={state.initUserFile}
              onFileChange={handler.handleFileChange}
              onSubmit={handler.handleSubmitInitUserData}
            />
          </Paper>
        </Box>
      </Container>
    </LayoutComponent>
  );
}

export default UserManagementPage;
