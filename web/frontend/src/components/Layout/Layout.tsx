import { Container, Typography, Box, Toolbar } from "@mui/material";
import React, { ReactNode } from "react";
import "./Layout.scss";
import NavBar from "../../components/NavBar/NavBar";
import useLayoutHook from "./useLayoutHook";
import GlobalLoading from "../ShowLoading/ShowLoading";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import AnnounceComponent from "../AnnounceComponent/AnnounceComponent";

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
        {/* Chỉ hiển thị NavBar nếu không phải là trang admin hoặc supervisor */}
        {!isSidebarLayout ? (
          <NavBar variant="horizontal" />
        ) : (
          <NavBar variant="vertical" />
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: "100%",
            minHeight: "95vh",
            marginLeft: {
              xs: 0,
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
      <AnnounceComponent />
      {role !== "admin" && (
        <Box
          component="footer"
          sx={{
            width: "100%",
            py: 2,
            bgcolor: "#f5f5f5",
            textAlign: "center",
            borderTop: "1px solid #e0e0e0",
            fontSize: 14,
            color: "#888",
            position: "sticky",
            left: 0,
            bottom: 0,
            zIndex: 1200,
          }}
        >
          © {new Date().getFullYear()} FAMS. All rights reserved.
        </Box>
      )}
    </Container>
  );
}

export default LayoutComponent;
