import axios from 'axios';
import { Appointment, Physiotherapist, TimeSlot } from '../types';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const appointmentService = {
  // Get user's appointments
  getUserAppointments: async (): Promise<Appointment[]> => {
    try {
      const response = await api.get('/api/appointments/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      // Return mock data for now
      return [
        {
          id: '1',
          patientId: '1',
          physiotherapistId: '1',
          dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          duration: 60,
          status: 'scheduled',
          notes: 'Rehabilitacija ramena nakon povrede',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          patientId: '1',
          physiotherapistId: '2',
          dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
          duration: 40,
          status: 'scheduled',
          notes: 'Terapija za bol u leđima',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          patientId: '1',
          physiotherapistId: '1',
          dateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // last week
          duration: 60,
          status: 'completed',
          notes: 'Kontrolni pregled',
          prescription: 'Nastaviti sa vežbama istezanja 2x dnevno',
          createdAt: new Date().toISOString(),
        },
      ];
    }
  },

  // Get physiotherapist details
  getPhysiotherapist: async (id: string): Promise<Physiotherapist> => {
    try {
      const response = await api.get(`/api/physiotherapists/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching physiotherapist:', error);
      // Return mock data for now
      const mockPhysiotherapists: { [key: string]: Physiotherapist } = {
        '1': {
          id: '1',
          firstName: 'Dr. Marko',
          lastName: 'Petković',
          email: 'marko.petkovic@example.com',
          phone: '+381 11 234 5678',
          profileImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=300&fit=crop&crop=face',
          specializations: ['Sportska medicina', 'Rehabilitacija'],
          certifications: ['Fizioterapeut', 'Sportski rehabilitator'],
          biography: 'Iskusan fizioterapeut sa preko 10 godina rada sa sportistima.',
          rating: 4.8,
          reviewCount: 124,
          availability: [],
        },
        '2': {
          id: '2',
          firstName: 'Dr. Ana',
          lastName: 'Stojanović',
          email: 'ana.stojanovic@example.com',
          phone: '+381 11 345 6789',
          profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
          specializations: ['Ortopedska rehabilitacija', 'Masaža'],
          certifications: ['Fizioterapeut', 'Masažni terapeut'],
          biography: 'Specijalizovana za ortopedsku rehabilitaciju i terapijsku masažu.',
          rating: 4.9,
          reviewCount: 89,
          availability: [],
        },
      };
      return mockPhysiotherapists[id] || mockPhysiotherapists['1'];
    }
  },

  // Book new appointment
  bookAppointment: async (appointmentData: {
    physiotherapistId: string;
    dateTime: string;
    duration: number;
    notes?: string;
  }): Promise<Appointment> => {
    try {
      const response = await api.post('/api/appointments', appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error booking appointment:', error);
      throw error;
    }
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId: string): Promise<void> => {
    try {
      await api.put(`/api/appointments/${appointmentId}/cancel`);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  },

  // Reschedule appointment
  rescheduleAppointment: async (appointmentId: string, newDateTime: string): Promise<Appointment> => {
    try {
      const response = await api.put(`/api/appointments/${appointmentId}/reschedule`, {
        dateTime: newDateTime,
      });
      return response.data;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  },
};