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
}
export default function NavBar(props: Props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { state, handler } = useNavBarHook();
  const handleDrawerToggle = () => {
    setMobileOpen(prevState => !prevState);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        FAMS
      </Typography>
      <Divider />
      <List>
        {state.navItems?.map(item => (
          <ListItem key={item} disablePadding>
            <ListItemButton sx={{ textAlign: "center" }}>
              <ListItemText
                onClick={() => {
                  handler.handleOnNavigate(item);
                }}
                primary={item}
                className="nav-Item"
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <Box className="navBar-container">
      <CssBaseline />
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
            // color="#1B78EC"
            sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
          >
            {state.userFullName || "FAMS"}
            <Box 
              component="span" 
              onClick={() => handler.handleOnNavigate("Profile")} 
              sx={{ cursor: 'pointer', display: 'inline-block', marginLeft: 2 }}
            >
              <img
                src={state.userAvatar || "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg"}
                alt="User Avatar"
                className="nav-User-Avatar"
              />
            </Box>
          </Typography>
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              justifyContent:"center",
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
                    sx={{ bgcolor: "white", height: 35, }}
                  />
                )}
              </React.Fragment>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <nav>
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
          {drawer}
        </Drawer>
      </nav>
      <Box component="main" sx={{ p: 3 }}>
        <Toolbar />
        <Typography></Typography>
      </Box>
    </Box>
  );
}
