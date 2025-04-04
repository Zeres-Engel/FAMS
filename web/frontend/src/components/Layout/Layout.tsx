import { Container, Grid, Typography } from "@mui/material";
import React, { ReactNode } from "react";
import "./Layout.scss";
import NavBar from "../../components/NavBar/NavBar"

interface LayoutProps  {
    children: ReactNode;
    pageHeader?: string;
}

function LayoutComponent({ children,pageHeader }: LayoutProps): React.JSX.Element {
    return (<Container maxWidth={false} disableGutters>
        <Grid container className="mainLayout">
            <Grid size={12}>
                <NavBar></NavBar>
            </Grid>
            <Grid>
                <Typography component='div' variant="h4" className="pageHeader">
                    {pageHeader}
                </Typography>
            </Grid>
            <Grid size={12}>
                {children}
            </Grid>
        </Grid>
    </Container>)
}
export default LayoutComponent;