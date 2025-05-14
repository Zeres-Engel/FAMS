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
import Skeleton from "@mui/material/Skeleton";
// Thêm các icon cho menu
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People"; 
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ClassIcon from "@mui/icons-material/Class";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import { ListItemIcon } from "@mui/material";

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

  // Function để lấy icon tương ứng với mỗi menu item
  const getIcon = (item: string) => {
    switch (item) {
      case "HomePage Admin":
      case "HomePage":
        return <DashboardIcon />;
      case "Profile":
        return <PersonIcon />;
      case "System Management":
        return <SettingsIcon />;
      case "User Management":
        return <PeopleIcon />;
      case "Schedule Management":
      case "Schedule":
        return <CalendarMonthIcon />;
      case "Class Management":
      case "Class":
        return <ClassIcon />;
      case "Attendance Management":
      case "Attendance":
        return <AssignmentTurnedInIcon />;
      case "Notify Management":
      case "Notify":
        return <NotificationsIcon />;
      case "Logout":
        return <LogoutIcon />;
      default:
        return <DashboardIcon />;
    }
  };

  // Tách riêng Logout ra khỏi các menu item khác (chỉ cho vertical mode)
  const nonLogoutItems = isVertical 
    ? state.navItems?.filter(item => item !== "Logout") || []
    : state.navItems || [];
  
  const logoutItem = "Logout";

  const drawerContent = (
    <Box
      sx={{
        textAlign: "center",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "#1b78ec", mb: 2 }}
        >
          FAMS
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          {state.isLoading ? (
            <Skeleton
              variant="circular"
              width={70}
              height={70}
              animation="wave"
            />
          ) : (
            <img
              src={
                state.userAvatar ||
                "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg"
              }
              alt="User Avatar"
              style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                cursor: "pointer",
                border: "2px solid #1b78ec",
                padding: "2px",
              }}
              onClick={() => {
                handler.handleOnNavigate("Profile");
                setMobileOpen(false);
              }}
            />
          )}
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          {state.formattedName || state.userFullName || "User"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {state.role === "admin" ? "Administrator" : "User"}
        </Typography>
      </Box>
      <Divider />

      {/* Menu Items */}
      <List sx={{ flexGrow: 1, py: 0 }}>
        {nonLogoutItems.map(item => (
          <ListItem
            key={item}
            onClick={() => {
              handler.handleOnNavigate(item);
              setMobileOpen(false);
            }}
            disablePadding
            sx={{
              "&:hover": {
                backgroundColor: "rgba(27, 120, 236, 0.08)",
              },
            }}
          >
            <ListItemButton sx={{ px: 3 }}>
              <ListItemIcon sx={{ color: "#1b78ec", minWidth: "36px" }}>
                {getIcon(item)}
              </ListItemIcon>
              <ListItemText
                primary={item}
                className="nav-Item"
                primaryTypographyProps={{
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {/* Logout Button (chỉ cho vertical layout) */}
      {isVertical && (
        <>
          <Divider />
          <List>
            <ListItem
              onClick={() => {
                handler.handleOnNavigate(logoutItem);
                setMobileOpen(false);
              }}
              disablePadding
              sx={{
                "&:hover": {
                  backgroundColor: "rgba(27, 120, 236, 0.08)",
                },
              }}
            >
              <ListItemButton sx={{ px: 3 }}>
                <ListItemIcon sx={{ color: "#1b78ec", minWidth: "36px" }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText
                  primary={logoutItem}
                  className="nav-Item"
                  primaryTypographyProps={{
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
      <Box
        sx={{
          width: "100%",
          py: 2,
          bgcolor: "#f5f5f5",
          textAlign: "center",
          borderTop: "1px solid #e0e0e0",
          fontSize: 13,
          color: "#888",
          mt: "auto",
        }}
      >
        © {new Date().getFullYear()} FAMS
      </Box>
    </Box>
  );

  return (
    <Box className="navBar-container" sx={{ display: "flex" }}>
      <CssBaseline />
      
      {/* Chỉ hiển thị AppBar ngang khi variant là horizontal */}
      {!isVertical && (
        <AppBar component="nav" className="navBar-Logo" position="fixed" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
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
              sx={{ display: { xs: "none", sm: "flex" }, alignItems: 'center' }}
            >
              <span style={{ fontWeight: 700, letterSpacing: '0.5px' }}>FAMS</span>
              <Box 
                component="span" 
                onClick={() => handler.handleOnNavigate("Profile")} 
                sx={{ cursor: 'pointer', display: 'inline-block', marginLeft: 2 }}
              >
                {state.isLoading ? (
                  <Skeleton 
                    variant="circular"
                    width={50}
                    height={50}
                    animation="wave"
                    className="nav-User-Avatar"
                  />
                ) : (
                  <img
                    src={state.userAvatar || "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg"}
                    alt="User Avatar"
                    className="nav-User-Avatar"
                    title={state.userFullName || "User profile"}
                  />
                )}
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
                    sx={{ 
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      position: 'relative',
                      padding: '8px 16px',
                      color: '#1b78ec',
                      '&:hover': {
                        backgroundColor: 'rgba(27, 120, 236, 0.08)',
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        width: '0%',
                        height: '2px',
                        backgroundColor: '#1b78ec',
                        transition: 'all 0.3s ease',
                        transform: 'translateX(-50%)'
                      },
                      '&:hover::after': {
                        width: '80%'
                      }
                    }}
                  >
                    {item}
                  </Button>
                  {index < state.navItems.length - 1 && (
                    <Divider
                      orientation="vertical"
                      flexItem
                      sx={{ bgcolor: "#1b78ec", height: 30, opacity: 0.5,margin:'auto' }}
                    />
                  )}
                </React.Fragment>
              ))}
            </Box>
          </Toolbar>
        </AppBar>
      )}
      
      {/* Mobile drawer - hiển thị ở tất cả chế độ */}
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
          {drawerContent}
        </Drawer>
      </nav>

      {/* Chỉ hiển thị box spacing khi là horizontal */}
      {/* {!isVertical && (
        <Box component="main" sx={{ p: 3 }}>
          <Toolbar />
          <Typography></Typography>
        </Box>
      )} */}

      {/* Chỉ hiển thị sidebar bên trái khi variant là vertical */}
      {isVertical && (
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
                boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.1)',
                backgroundColor: "#fff"
              },
            }}
            open
          >
            {drawerContent}
            {/* <Box
              sx={{
                width: "100%",
                py: 2,
                bgcolor: "#f5f5f5",
                textAlign: "center",
                borderTop: "1px solid #e0e0e0",
                fontSize: 13,
                color: "#888",
                mt: "auto"
              }}
            >
              © {new Date().getFullYear()} FAMS
            </Box> */}
          </Drawer>

          {/* Mobile navbar dành cho vertical layout */}
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
                {state.formattedName || state.userFullName || "FAMS"}
                <img
                  src={state.userAvatar || "https://i.pinimg.com/236x/5e/e0/82/5ee082781b8c41406a2a50a0f32d6aa6.jpg"}
                  alt="User Avatar"
                  style={{ 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '50%',
                    marginLeft: '10px',
                    verticalAlign: 'middle'
                  }}
                />
              </Typography>
            </Toolbar>
          </AppBar>
        </>
      )}
    </Box>
  );
}
