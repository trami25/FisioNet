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

// Also attach x-user-id automatically from localStorage when present
exerciseClient.interceptors.request.use((config) => {
  const getUserId = () => {
    const uid = localStorage.getItem('user_id');
    if (uid) return uid;
    const user = localStorage.getItem('user');
    if (user) {
      try { const u = JSON.parse(user); return u.id?.toString(); } catch { return null; }
    }
    return null;
  };
  const userId = getUserId();
  if (userId) {
    config.headers = config.headers || {};
    (config.headers as any)['x-user-id'] = userId;
  }
  // DEBUG: print outgoing request and headers so we can verify x-user-id in browser console
  try {
    // avoid noisy logs for frequent GETs in prod; only log for mutating requests
    const method = (config.method || '').toLowerCase();
    if (method === 'post' || method === 'put' || method === 'delete') {
      // eslint-disable-next-line no-console
      console.debug('[exerciseClient] outgoing', method, config.url, 'headers=', config.headers);
    }
  } catch (e) {
    // ignore logging errors
  }
  return config;
}, (error) => Promise.reject(error));

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
    const getUserId = () => {
      const uid = localStorage.getItem('user_id');
      if (uid) return uid;
      const user = localStorage.getItem('user');
      if (user) {
        try { const u = JSON.parse(user); return u.id?.toString(); } catch { return null; }
      }
      return null;
    };
    const userId = getUserId();
    const headers: any = {};
    if (userId) headers['x-user-id'] = userId;
    const response = await exerciseClient.post<Exercise>('/exercises', exerciseData, { headers });
    return response.data;
  },

  async updateExercise(id: number, exerciseData: UpdateExerciseRequest): Promise<Exercise> {
    const getUserId = () => {
      const uid = localStorage.getItem('user_id');
      if (uid) return uid;
      const user = localStorage.getItem('user');
      if (user) {
        try { const u = JSON.parse(user); return u.id?.toString(); } catch { return null; }
      }
      return null;
    };
    const userId = getUserId();
    const headers: any = {};
    if (userId) headers['x-user-id'] = userId;
    const response = await exerciseClient.put<Exercise>(`/exercises/${id}`, exerciseData, { headers });
    return response.data;
  },

  async deleteExercise(id: number): Promise<void> {
    const getUserId = () => {
      const uid = localStorage.getItem('user_id');
      if (uid) return uid;
      const user = localStorage.getItem('user');
      if (user) {
        try { const u = JSON.parse(user); return u.id?.toString(); } catch { return null; }
      }
      return null;
    };
    const userId = getUserId();
    const headers: any = {};
    if (userId) headers['x-user-id'] = userId;
    await exerciseClient.delete(`/exercises/${id}`, { headers });
  },

  async uploadExerciseImages(exerciseId: number, files: File[]): Promise<string[]> {
    const getUserId = () => {
      const uid = localStorage.getItem('user_id');
      if (uid) return uid;
      const user = localStorage.getItem('user');
      if (user) {
        try { const u = JSON.parse(user); return u.id?.toString(); } catch { return null; }
      }
      return null;
    };
    const userId = getUserId();
    const headers: any = {};
    if (userId) headers['x-user-id'] = userId;

    const form = new FormData();
    files.forEach((f) => form.append('file', f));

    // Let the browser/axios set the multipart Content-Type (boundary)
    const response = await exerciseClient.post<string[]>(`/exercises/${exerciseId}/images`, form);

    return response.data;
  },
};