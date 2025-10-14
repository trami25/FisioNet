import axios, { AxiosResponse } from 'axios';
import { NewAppointment, CreateAppointmentRequest, AppointmentResponse, AvailableSlot } from '../types';

const API_BASE_URL = process.env.REACT_APP_APPOINTMENT_API_URL || 'http://localhost:8002';

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

export const appointmentService = {
  // Create new appointment
  createAppointment: async (appointmentData: CreateAppointmentRequest): Promise<AppointmentResponse> => {
    try {
      const response: AxiosResponse<AppointmentResponse> = await api.post('/appointments', appointmentData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create appointment');
    }
  },

  // Get user's appointments
  getMyAppointments: async (): Promise<NewAppointment[]> => {
    try {
      const response: AxiosResponse<{ appointments: NewAppointment[] }> = await api.get('/appointments');
      return response.data.appointments;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch appointments');
    }
  },

  // Get appointments by patient ID
  getPatientAppointments: async (patientId: string): Promise<NewAppointment[]> => {
    try {
      const response: AxiosResponse<NewAppointment[]> = await api.get(`/appointments/patient/${patientId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient appointments');
    }
  },

  // Get appointments by physiotherapist ID
  getPhysiotherapistAppointments: async (physiotherapistId: string): Promise<NewAppointment[]> => {
    try {
      const response: AxiosResponse<NewAppointment[]> = await api.get(`/appointments/physiotherapist/${physiotherapistId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch physiotherapist appointments');
    }
  },


  // Update appointment status
  updateAppointmentStatus: async (appointmentId: string, status: string, notes?: string): Promise<NewAppointment> => {
    try {
      const response: AxiosResponse<NewAppointment> = await api.put(`/appointments/${appointmentId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update appointment');
    }
  },

  // Complete appointment (convenience method)
  completeAppointment: async (appointmentId: string, data: { notes?: string }): Promise<NewAppointment> => {
    try {
      const response: AxiosResponse<NewAppointment> = await api.put(`/appointments/${appointmentId}/status`, {
        status: 'completed',
        notes: data.notes
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to complete appointment');
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId: string, reason?: string): Promise<void> => {
    try {
      await api.put(`/appointments/${appointmentId}/cancel`, { reason });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  },

  // Get available time slots for a physiotherapist on a specific date
  getAvailableSlots: async (physiotherapistId: string, date: string): Promise<AvailableSlot[]> => {
    try {
      const response: AxiosResponse<{ date: string; slots: AvailableSlot[] }> = await api.get(
        `/physiotherapists/${physiotherapistId}/available-slots?date=${date}`
      );
      return response.data.slots;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch available slots');
    }
  },
};