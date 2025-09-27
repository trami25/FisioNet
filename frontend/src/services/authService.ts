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
      // Mock successful login for demo/testing purposes
      if (email && password) {
        // Create mock user based on email
        let role: 'patient' | 'physiotherapist' | 'admin' | 'moderator' = 'patient';
        let firstName = 'Test';
        let lastName = 'User';

        if (email.includes('physio')) {
          role = 'physiotherapist';
          firstName = 'Dr. Ana';
          lastName = 'Petrović';
        } else if (email.includes('admin')) {
          role = 'admin';
          firstName = 'Admin';
          lastName = 'User';
        } else if (email.includes('moderator')) {
          role = 'moderator';
          firstName = 'Moderator';
          lastName = 'User';
        } else {
          firstName = 'Marko';
          lastName = 'Nikolić';
        }

        const mockUser: User = {
          id: 'user_' + Math.random().toString(36).substr(2, 9),
          email,
          firstName,
          lastName,
          phone: '+381 60 123 4567',
          role,
          createdAt: new Date().toISOString(),
          birthDate: '1990-01-01',
          height: 175,
          weight: 70,
          jobType: 'Office work',
        };

        const mockResponse: AuthResponse = {
          token: 'mock_jwt_token_' + Date.now(),
          userId: mockUser.id,
          user: mockUser,
        };

        return {
          success: true,
          data: mockResponse,
        };
      }

      // Fallback to actual API call if backend is running
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
        error: error.response?.data?.message || 'Neispravni podaci za prijavu',
      };
    }
  },

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // Mock successful registration for demo/testing purposes
      const mockUser: User = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: 'patient', // Default role for new registrations
        createdAt: new Date().toISOString(),
        birthDate: userData.birthDate,
        height: userData.height,
        weight: userData.weight,
        jobType: userData.jobType,
      };

      const mockResponse: AuthResponse = {
        token: 'mock_jwt_token_' + Date.now(),
        userId: mockUser.id,
        user: mockUser,
      };

      return {
        success: true,
        data: mockResponse,
      };

      // Fallback to actual API call if backend is running
      // const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      // return {
      //   success: true,
      //   data: response.data,
      // };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registracija nije uspešna',
      };
    }
  },

  async verifyToken(token: string): Promise<ApiResponse<AuthResponse>> {
    try {
      // Mock token verification for demo purposes
      if (token.startsWith('mock_jwt_token_')) {
        // Create a mock user from stored token (in real app, this would be decoded from JWT)
        const mockUser: User = {
          id: 'user_stored',
          email: 'stored@example.com',
          firstName: 'Stored',
          lastName: 'User',
          role: 'patient',
          createdAt: new Date().toISOString(),
        };

        const authResponse: AuthResponse = {
          token,
          userId: mockUser.id,
          user: mockUser,
        };

        return {
          success: true,
          data: authResponse,
        };
      }

      // Fallback to actual API call
      const response = await apiClient.get<User>('/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
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