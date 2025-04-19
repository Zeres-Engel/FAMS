import "./NavBar.scss";
import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListIcon from "@mui/icons-material/List";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import useNavBarHook from "./useNavBarHook";

const drawerWidth = 240;

interface Props {
  window?: () => Window;
  variant?: "vertical" | "horizontal";
}

export default function NavBar({ window, variant = "horizontal" }: Props) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { state, handler } = useNavBarHook();
  const container =
    window !== undefined ? () => window().document.body : undefined;
  const isVertical = variant === "vertical";

  const handleDrawerToggle = () => {
    setMobileOpen(prev => !prev);
  };

  const drawerContent = (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        FAMS
      </Typography>
      <Divider />
      <List>
        {state.navItems?.map(item => (
          <ListItem
            key={item}
            onClick={() => {
              handler.handleOnNavigate(item);
              setMobileOpen(false);
            }}
            disablePadding
          >
            <ListItemButton sx={{ textAlign: "center" }}>
              <ListItemText primary={item} className="nav-Item" />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box className="navBar-container" sx={{ display: "flex" }}>
      <CssBaseline />
      {isVertical ? (
        <>
          {/* Sidebar on desktop */}
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              display: { xs: "none", sm: "block" },
              [`& .MuiDrawer-paper`]: {
                width: drawerWidth,
                boxSizing: "border-box",
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>

          {/* Mobile drawer */}
          <Drawer
            container={container}
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
          >
            {drawerContent}
          </Drawer>

          {/* Icon toggle mobile */}
          <AppBar
            position="fixed"
            sx={{ display: { sm: "none" }, zIndex: 1300 }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
              >
                <ListIcon />
              </IconButton>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ flexGrow: 1 }}
              >
                FAMS
              </Typography>
            </Toolbar>
          </AppBar>
        </>
      ) : (
        <AppBar component="nav" className="navBar-Logo">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <ListIcon className="navBar-MB-Icon" />
            </IconButton>
            <Typography
              variant="h5"
              component="div"
              className="navBar-Logo-font"
              sx={{
                flexGrow: 1,
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
              }}
            >
              HungDN
              <img
                src="https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg"
                alt="User Avatar"
                className="nav-User-Avatar"
              />
            </Typography>
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              {state.navItems?.map((item, index) => (
                <React.Fragment key={item}>
                  <Button
                    onClick={() => handler.handleOnNavigate(item)}
                    className="navBar-Item-Font"
                  >
                    {item}
                  </Button>
                  {index < state.navItems.length - 1 && (
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ bgcolor: "white", height: 35 }}
                    />
                  )}
                </React.Fragment>
              ))}
            </Box>
          </Toolbar>
        </AppBar>
      )}
    </Box>
  );
}
