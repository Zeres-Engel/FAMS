import "./NavBar.scss";
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListIcon from '@mui/icons-material/List';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';

interface NavItem {
  label: string;
  path: string;
}

const drawerWidth = 240;
const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Profile', path: '/profile' },
  { label: 'Schedule', path: '/schedule' },
  // Other items can be added with their paths
];

interface Props {
  window?: () => Window;
}

export default function NavBar(props: Props) {
  const { window: windowFunc } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [currentPath, setCurrentPath] = React.useState(
    typeof windowFunc === 'function' 
      ? windowFunc().location.pathname 
      : typeof window !== 'undefined' 
        ? window.location.pathname 
        : '/'
  );

  // Update current path when location changes
  React.useEffect(() => {
    const handleLocationChange = () => {
      if (typeof windowFunc === 'function') {
        setCurrentPath(windowFunc().location.pathname);
      } else if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname);
      }
    };
    
    if (typeof windowFunc === 'function') {
      const win = windowFunc();
      win.addEventListener('popstate', handleLocationChange);
      return () => {
        win.removeEventListener('popstate', handleLocationChange);
      };
    } else if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleLocationChange);
      return () => {
        window.removeEventListener('popstate', handleLocationChange);
      };
    }
    return undefined;
  }, [windowFunc]);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const navigateTo = (path: string) => {
    if (typeof windowFunc === 'function') {
      const win = windowFunc();
      win.history.pushState({}, '', path);
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  const handleLogout = () => {
    document.cookie = "jwtToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // Redirect to login
    if (typeof windowFunc === 'function') {
      const win = windowFunc();
      win.location.href = '/login';
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        FASM
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton 
              sx={{ textAlign: 'center' }}
              onClick={() => navigateTo(item.path)}
              selected={currentPath === item.path}
            >
              <ListItemText primary={item.label} className="nav-Item"/>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const container = typeof windowFunc === 'function' ? windowFunc : undefined;

  return (
    <Box className='navBar-container'>
      <CssBaseline />
      <AppBar component="nav" className='navBar-Logo'>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <ListIcon className="navBar-MB-Icon"/>
          </IconButton>
          <Typography
            variant="h4"
            component="div"
            className="navBar-Logo-font"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
            onClick={() => navigateTo('/')}
            style={{ cursor: 'pointer' }}
          >
            FASM
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {navItems.map((item) => (
              <Button 
                key={item.label} 
                className={`navBar-Item-Font ${currentPath === item.path ? 'active' : ''}`}
                onClick={() => navigateTo(item.path)}
              >
                {item.label}
              </Button>
            ))}
            <Button 
              className="navBar-Item-Font logout-btn"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Đăng xuất
            </Button>
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
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
      <Box component="main" sx={{ p: 3 }}>
        <Toolbar />
      </Box>
    </Box>
  );
}
