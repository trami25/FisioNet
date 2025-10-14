import axios from 'axios';
import { ApiResponse, AuthResponse, RegisterRequest, UserProfile } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

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
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const authData = response.data;
      
      // Store token and user data
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify({
        id: authData.user_id,
        email: authData.email,
        firstName: authData.first_name,
        lastName: authData.last_name,
        role: authData.role,
      }));

      return {
        success: true,
        data: authData,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  },

  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        birth_date: data.birth_date,
        height: data.height,
        weight: data.weight,
        job_type: data.job_type,
        role: data.role || 'patient',
      });

      const authData = response.data;
      
      // Store token and user data
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify({
        id: authData.user_id,
        email: authData.email,
        firstName: authData.first_name,
        lastName: authData.last_name,
        role: authData.role,
      }));

      return {
        success: true,
        data: authData,
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  },

  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await apiClient.get('/auth/profile');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch user profile',
      };
    }
  },

  async verifyToken(): Promise<boolean> {
    try {
      await apiClient.get('/auth/verify');
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getStoredUser(): any {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};