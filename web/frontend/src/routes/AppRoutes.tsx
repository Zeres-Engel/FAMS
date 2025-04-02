import React from 'react';
import LoginPage from '../pages/LoginPage/LoginPage';
import HomePage from '../pages/HomePage/HomePage';
import ProfilePage from '../pages/ProfilePage/ProfilePage';
import SchedulePage from '../pages/SchedulePage/SchedulePage';
import Navigation from '../components/Navigation/Navigation';

// Simple router implementation without react-router-dom
function AppRoutes() {
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname);
  const isAuthenticated = document.cookie.includes('jwtToken');
  
  // Listen for path changes
  React.useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', onLocationChange);
    
    return () => {
      window.removeEventListener('popstate', onLocationChange);
    };
  }, []);
  
  // Navigation function
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };
  
  // Check auth and redirect if needed
  React.useEffect(() => {
    if (!isAuthenticated && currentPath !== '/login') {
      navigateTo('/login');
    }
  }, [currentPath, isAuthenticated]);
  
  // Render the correct component based on path
  const renderRoute = () => {
    // Allow access to login page even when not authenticated
    if (currentPath === '/login') {
      return <LoginPage />;
    }
    
    // Protected routes
    if (!isAuthenticated) {
      return null; // Will redirect in useEffect
    }
    
    // For protected routes, show navigation and the current page
    return (
      <>
        <Navigation currentPath={currentPath} onNavigate={navigateTo} />
        {(() => {
          switch (currentPath) {
            case '/':
              return <HomePage />;
            case '/profile':
              return <ProfilePage />;
            case '/schedule':
              return <SchedulePage />;
            default:
              // Redirect to home for unknown routes
              navigateTo('/');
              return null;
          }
        })()}
      </>
    );
  };
  
  return renderRoute();
}

export default AppRoutes;