import { Container, Typography, Box, Toolbar } from "@mui/material";
import React, { ReactNode } from "react";
import "./Layout.scss";
import NavBar from "../../components/NavBar/NavBar";
import useLayoutHook from "./useLayoutHook";
import GlobalLoading from "../ShowLoading/ShowLoading";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

interface LayoutProps {
  children: ReactNode;
  pageHeader?: string;
}

function LayoutComponent({
  children,
  pageHeader,
}: LayoutProps): React.JSX.Element {
  const { state, handler } = useLayoutHook();
  const role = useSelector((state: RootState) => state.authUser.role);
  const isSidebarLayout = role === "admin" || role === "supervisor";
  const drawerWidth = 240;

  return (
    <Container maxWidth={false} disableGutters>
      <GlobalLoading />
      <Box sx={{ display: "flex" }}>
        <NavBar variant={isSidebarLayout ? "vertical" : "horizontal"} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: "100%",
            marginLeft: {
              xs: 0,
              //   sm: isSidebarLayout ? `${drawerWidth}px` : 0,
            },
          }}
        >
          {/* Push down content if mobile AppBar is showing */}
          {isSidebarLayout && <Toolbar sx={{ display: { sm: "none" } }} />}

          {pageHeader && (
            <Box
              sx={{
                marginTop: isSidebarLayout ? "20px" : "100px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography
                component="h1"
                variant="h4"
                fontWeight={600}
                textAlign="center"
                color="primary"
                className="pageHeader"
              >
                {pageHeader}
              </Typography>
            </Box>
          )}
          {children}
        </Box>
      </Box>
    </Container>
  );
}

export default LayoutComponent;
