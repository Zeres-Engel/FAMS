import api from './api';
import { LoginForm } from '../model/loginModels/loginModels.model';
import tokenRefresher from './tokenRefresher';

interface AuthResponse {
  success: boolean;
  data?: {
    userId: string;
    name: string;
    email: string;
    role: string;
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

interface TokenResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
}

const authService = {
  // Login user and store tokens
  login: async (credentials: LoginForm): Promise<User> => {
    try {
      // Adapt to backend API naming (userName -> userId)
      const payload = {
        userId: credentials.userName,
        password: credentials.password
      };
      
      console.log('Sending login request to:', `${api.defaults.baseURL}/auth/login`);
      console.log('Payload:', payload);
      
      const response = await api.post<AuthResponse>('/auth/login', payload);
      
      console.log('Login response:', response.data);
      
      if (response.data.success && response.data.data) {
        // Store tokens in localStorage
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        
        // Store user info
        const user: User = {
          userId: response.data.data.userId,
          name: response.data.data.name,
          email: response.data.data.email,
          role: response.data.data.role
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        
        return user;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Auth service error:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw new Error(error.response.data.message || 'Login failed');
      }
      throw error;
    }
  },
  
  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  },
  
  // Manually refresh the token
  refreshToken: async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post<TokenResponse>('/auth/refresh-token', { refreshToken });
      
      if (response.data.success && response.data.data) {
        // Save new tokens
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens on refresh failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return false;
    }
  },
  
  // Logout user and clear storage
  logout: async (): Promise<void> => {
    try {
      // Call logout API if needed
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Stop token refresher
      tokenRefresher.stopTokenRefresh();
      
      // Clear all stored data regardless of API result
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  }
};

export default authService; 