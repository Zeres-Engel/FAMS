import React from "react";
import "./ClassPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import Container from "@mui/material/Container";
import { Box, Grid, Paper, Stack, Typography } from "@mui/material";
import DataTable from "../../components/DataTable/DataTable";
import useClassPageHook from "./useClassPageHook";
function ClassPage(): React.JSX.Element {
  const { state, handler } = useClassPageHook();
  return (
    <LayoutComponent pageHeader="Class Page">
      <Container maxWidth={false} className="classPage-Container">
        <Grid container size={11} className="classPage-Grid">
          <Grid size={12} className="classPage-Header">
            <Paper
              elevation={2}
              sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: "#fff" }}
            >
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                List of homeroom teachers
              </Typography>

              <Box
                display="flex"
                flexWrap="wrap"
                gap={1.5} // nhỏ hơn gap cũ
              >
                {state.hoomroomTeacherList.map((cls, index) => (
                  <Box
                    key={index}
                    sx={{
                      flex: "1 1 calc(50% - 12px)", // vẫn 2 cột
                      minWidth: "200px", // nhỏ hơn
                      bgcolor: "#f5f5f5",
                      p: 1.5, // giảm padding
                      borderRadius: 1,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Typography
                      fontWeight="medium"
                      fontSize="0.9rem"
                      color="primary.main"
                      mb={0.5}
                    >
                      {cls.className}
                    </Typography>
                    <Typography fontSize="0.85rem">
                      {cls.homeroomTeacherId || (
                        <Typography
                          component="span"
                          color="text.secondary"
                          fontStyle="italic"
                        >
                          Updating...
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            <DataTable
              isClassPage={true}
              headCellsData={state.headCellsData}
              tableMainData={state.classPageData}
              tableTitle={state.tableTitle}
              isCheckBox={false}
              isTeacherView={true}
              // classOptions={state.classOptions}
              isRoleParent={state.role === "parent"}
              classPageList={state.classPageList}
              setFiltersClassPage={handler.setFiltersClassPage}
            ></DataTable>
          </Grid>
        </Grid>
      </Container>
    </LayoutComponent>
  );
}
export default ClassPage;
