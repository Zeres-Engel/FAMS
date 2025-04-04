import authService from './authService';

// Add NodeJS types definition
declare global {
  interface Window {
    setTimeout: typeof setTimeout;
    clearTimeout: typeof clearTimeout;
    setInterval: typeof setInterval;
    clearInterval: typeof clearInterval;
  }
}

type Timeout = ReturnType<typeof setTimeout>;

class TokenRefresher {
  private refreshInterval: number = 60 * 60 * 1000; // 1 hour in milliseconds
  private timerId: Timeout | null = null;
  
  // Start the token refresh timer
  public startTokenRefresh = (): void => {
    // Clear any existing timer
    this.stopTokenRefresh();
    
    // Set up a new timer
    this.timerId = setInterval(async () => {
      // Check if user is logged in
      if (authService.isAuthenticated()) {
        console.log('Refreshing authentication token...');
        const success = await authService.refreshToken();
        
        if (success) {
          console.log('Token refreshed successfully');
        } else {
          console.error('Failed to refresh token');
          this.stopTokenRefresh();
          
          // Redirect to login page if refresh fails
          window.location.href = '/login';
        }
      } else {
        // No need to refresh if not logged in
        this.stopTokenRefresh();
      }
    }, this.refreshInterval);
    
    console.log('Token refresh timer started');
  };
  
  // Stop the token refresh timer
  public stopTokenRefresh = (): void => {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
      console.log('Token refresh timer stopped');
    }
  };
}

const tokenRefresher = new TokenRefresher();
export default tokenRefresher; 