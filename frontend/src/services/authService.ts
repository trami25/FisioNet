import axios from 'axios';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  },

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  },

  async verifyToken(token: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.get<User>('/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Mock response structure since backend doesn't return full AuthResponse
      const authResponse: AuthResponse = {
        token,
        userId: response.data.id,
        user: response.data,
      };

      return {
        success: true,
        data: authResponse,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Token verification failed',
      };
    }
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get user data',
      };
    }
  },

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.put<User>('/auth/profile', userData);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Profile update failed',
      };
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password change failed',
      };
    }
  },

  logout() {
    localStorage.removeItem('token');
  },
};