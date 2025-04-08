import React from "react";
import "./ClassPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import Container from '@mui/material/Container'
import { Grid } from "@mui/material";
import DataTable from "../../components/DataTable/DataTable";
import useClassPageHook from './useClassPageHook';
function ClassPage(): React.JSX.Element {
  const {state,handler}=useClassPageHook();
  return <LayoutComponent pageHeader="Class">
    <Container maxWidth={false} className="classPage-Container">
      <Grid container size={11} className='classPage-Grid'>
        <Grid size={12} className='classPage-Header'>
            <DataTable headCellsData={state.headCellsData} tableMainData={state.userMainData} tableTitle={state.tableTitle}></DataTable>
        </Grid>
      </Grid>
    </Container>
  </LayoutComponent>;
}
export default ClassPage;
