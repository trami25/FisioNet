import axios from 'axios';
import { ApiResponse, Exercise, ExerciseFilter, PaginatedResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_EXERCISE_API_URL || 'http://localhost:3002';

// Create axios instance for exercise service
const exerciseClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
exerciseClient.interceptors.request.use(
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

export const exerciseService = {
  async getAllExercises(filters?: ExerciseFilter): Promise<ApiResponse<Exercise[]>> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await exerciseClient.get<Exercise[]>(`/exercises?${params.toString()}`);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch exercises',
      };
    }
  },

  async getExerciseById(id: string): Promise<ApiResponse<Exercise>> {
    try {
      const response = await exerciseClient.get<Exercise>(`/exercises/${id}`);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch exercise',
      };
    }
  },

  async searchExercises(query: string, filters?: ExerciseFilter): Promise<ApiResponse<Exercise[]>> {
    try {
      const params = new URLSearchParams();
      params.append('search', query);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await exerciseClient.get<Exercise[]>(`/exercises/search?${params.toString()}`);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Search failed',
      };
    }
  },

  async getCategories(): Promise<ApiResponse<string[]>> {
    try {
      const response = await exerciseClient.get<string[]>('/exercises/categories');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch categories',
      };
    }
  },

  async createExercise(exerciseData: Omit<Exercise, 'id' | 'createdAt'>): Promise<ApiResponse<Exercise>> {
    try {
      const response = await exerciseClient.post<Exercise>('/exercises', exerciseData);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create exercise',
      };
    }
  },

  async updateExercise(id: string, exerciseData: Partial<Exercise>): Promise<ApiResponse<Exercise>> {
    try {
      const response = await exerciseClient.put<Exercise>(`/exercises/${id}`, exerciseData);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update exercise',
      };
    }
  },

  async deleteExercise(id: string): Promise<ApiResponse<void>> {
    try {
      await exerciseClient.delete(`/exercises/${id}`);
      
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete exercise',
      };
    }
  },

  async getSpecializedExercises(patientId: string): Promise<ApiResponse<Exercise[]>> {
    try {
      const response = await exerciseClient.get<Exercise[]>(`/exercises/specialized/${patientId}`);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch specialized exercises',
      };
    }
  },

  async assignExerciseToPatient(exerciseId: string, patientId: string): Promise<ApiResponse<void>> {
    try {
      await exerciseClient.post(`/exercises/${exerciseId}/assign`, { patientId });
      
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to assign exercise',
      };
    }
  },
};