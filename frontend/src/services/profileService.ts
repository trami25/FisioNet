import axios, { AxiosResponse } from 'axios';
import { UserProfile, UpdateProfileRequest } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const profileService = {
  // Get user profile by ID
  getUserProfile: async (userId: string): Promise<UserProfile> => {
    try {
      const response: AxiosResponse<UserProfile> = await api.get(`/users/profile/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
  },

  // Update current user profile
  updateProfile: async (updateData: UpdateProfileRequest): Promise<UserProfile> => {
    try {
      const response: AxiosResponse<UserProfile> = await api.put('/auth/profile', updateData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  // Get current user profile
  getCurrentProfile: async (): Promise<UserProfile> => {
    try {
      const response: AxiosResponse<UserProfile> = await api.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch current profile');
    }
  },
};