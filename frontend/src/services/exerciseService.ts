import axios from 'axios';
import { Exercise, ExerciseFilter, CreateExerciseRequest, UpdateExerciseRequest } from '../types';

const API_BASE_URL = process.env.REACT_APP_EXERCISE_API_URL || 'http://localhost:8005';

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
  async getAllExercises(filters?: ExerciseFilter): Promise<Exercise[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.difficultyLevel) params.append('difficulty', filters.difficultyLevel);
      if (filters.search) params.append('search', filters.search);
    }

    const response = await exerciseClient.get<Exercise[]>(`/exercises?${params.toString()}`);
    return response.data;
  },

  async getExerciseById(id: number): Promise<Exercise> {
    const response = await exerciseClient.get<Exercise>(`/exercises/${id}`);
    return response.data;
  },

  async searchExercises(query: string, filters?: ExerciseFilter): Promise<Exercise[]> {
    const params = new URLSearchParams();
    params.append('search', query);
    
    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.difficultyLevel) params.append('difficulty', filters.difficultyLevel);
    }

    const response = await exerciseClient.get<Exercise[]>(`/exercises?${params.toString()}`);
    return response.data;
  },

  async createExercise(exerciseData: CreateExerciseRequest): Promise<Exercise> {
    const response = await exerciseClient.post<Exercise>('/exercises', exerciseData);
    return response.data;
  },

  async updateExercise(id: number, exerciseData: UpdateExerciseRequest): Promise<Exercise> {
    const response = await exerciseClient.put<Exercise>(`/exercises/${id}`, exerciseData);
    return response.data;
  },

  async deleteExercise(id: number): Promise<void> {
    await exerciseClient.delete(`/exercises/${id}`);
  },
};