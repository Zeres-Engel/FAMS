import React from "react";
import "./ClassManagementPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import Container from "@mui/material/Container";
import {
  Box,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import DataTable from "../../components/DataTable/DataTable";
import useClassManagementPageHook from "./useClassManagementPageHook";
function ClassManagementPage(): React.JSX.Element {
  const { state, handler } = useClassManagementPageHook();
  return (
    <LayoutComponent pageHeader="Class Management">
      <Container maxWidth={false} className="classManagementPage-Container">
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold" mb={1}>
            Select Mode
          </Typography>
          <RadioGroup
            row
            value={state.mode}
            onChange={handler.handleModeChange}
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <FormControlLabel
              value="ClassManagement"
              control={<Radio />}
              label="Class Management"
            />
            <FormControlLabel
              value="ClassArrangement"
              control={<Radio />}
              label="Newly Enrolled Students"
            />
            <FormControlLabel
              value="NewSemester"
              control={<Radio />}
              label="Students for Promotion"
            />
          </RadioGroup>
        </Box>
        {state.mode === "ClassManagement" && (
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
        )}
        {state.mode === "ClassArrangement" && (
          <Grid container size={11} className="classManagementPage-Grid">
            <Grid size={12} className="classPage-Header">
              <DataTable
                headCellsData={state.classArrangementHeadCell}
                tableMainData={state.classArrangementMainData}
                tableTitle={"Newly Enrolled Students"}
                isCheckBox={true}
                isAdmin={true}
                isClassArrangement={true}
              ></DataTable>
            </Grid>
          </Grid>
        )}
        {state.mode === "NewSemester" && (
          <Grid container size={11} className="classManagementPage-Grid">
            <Grid size={12} className="classPage-Header">
              <DataTable
                headCellsData={state.newSemesterHeadCell}
                tableMainData={state.classArrangementMainData}
                tableTitle={"Students for Promotion"}
                isCheckBox={true}
                isAdmin={true}
                isNewSemester={true}
              ></DataTable>
            </Grid>
          </Grid>
        )}
      </Container>
    </LayoutComponent>
  );
}
export default ClassManagementPage;
