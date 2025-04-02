import { Container, Grid } from "@mui/material";
import React, { ReactNode } from "react";
import "./Layout.scss";
import NavBar from "../../components/NavBar/NavBar"

interface LayoutProps  {
    children: ReactNode;
}

function LayoutComponent({ children }: LayoutProps): React.JSX.Element {
    return (<Container maxWidth={false} disableGutters>
        <Grid container className="home-Page">
            <Grid size={12}>
                <NavBar></NavBar>
            </Grid>
            <Grid size={12}>
                {children}
            </Grid>
        </Grid>
    </Container>)
}
export default LayoutComponent;