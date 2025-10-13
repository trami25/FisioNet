import axios from 'axios';
import { Appointment, Physiotherapist, TimeSlot, User } from '../types';

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
  // Get user's appointments (for patients)
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

  // Get physiotherapist's appointments
  getPhysiotherapistAppointments: async (): Promise<Appointment[]> => {
    try {
      const response = await api.get('/api/appointments/physiotherapist');
      return response.data;
    } catch (error) {
      console.error('Error fetching physiotherapist appointments:', error);
      // Return mock data for now
      const today = new Date();
      return [
        {
          id: '1',
          patientId: '101',
          physiotherapistId: '1',
          dateTime: new Date(today.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
          duration: 60,
          status: 'scheduled',
          notes: 'Rehabilitacija ramena nakon povrede',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          patientId: '102',
          physiotherapistId: '1',
          dateTime: new Date(today.getTime() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
          duration: 40,
          status: 'scheduled',
          notes: 'Terapija za bol u leđima',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          patientId: '103',
          physiotherapistId: '1',
          dateTime: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
          duration: 60,
          status: 'scheduled',
          notes: 'Pregled stanja nakon operacije kolena',
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          patientId: '104',
          physiotherapistId: '1',
          dateTime: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          duration: 45,
          status: 'completed',
          notes: 'Kontrolni pregled',
          prescription: 'Nastaviti sa vežbama istezanja 2x dnevno, sledeći pregled za 2 nedelje',
          createdAt: new Date().toISOString(),
        },
      ];
    }
  },

  // Get patient details
  getPatient: async (id: string): Promise<User> => {
    try {
      const response = await api.get(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient:', error);
      // Return mock data for now
      const mockPatients: { [key: string]: User } = {
        '101': {
          id: '101',
          email: 'marija.petrovic@example.com',
          firstName: 'Marija',
          lastName: 'Petrović',
          phone: '+381 64 123 4567',
          birthDate: '1985-03-15',
          height: 165,
          weight: 60,
          jobType: 'Knjižvođa',
          profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b4c0?w=300&h=300&fit=crop&crop=face',
          role: 'patient',
          createdAt: '2024-01-15T10:00:00Z',
        },
        '102': {
          id: '102',
          email: 'stefan.nikolic@example.com',
          firstName: 'Stefan',
          lastName: 'Nikolić',
          phone: '+381 65 234 5678',
          birthDate: '1990-07-22',
          height: 180,
          weight: 75,
          jobType: 'Programer',
          profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
          role: 'patient',
          createdAt: '2024-02-10T14:30:00Z',
        },
        '103': {
          id: '103',
          email: 'ana.stojakovic@example.com',
          firstName: 'Ana',
          lastName: 'Stojaković',
          phone: '+381 66 345 6789',
          birthDate: '1992-11-08',
          height: 170,
          weight: 65,
          jobType: 'Dizajner',
          profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
          role: 'patient',
          createdAt: '2024-03-05T09:15:00Z',
        },
        '104': {
          id: '104',
          email: 'milan.jovanovic@example.com',
          firstName: 'Milan',
          lastName: 'Jovanović',
          phone: '+381 67 456 7890',
          birthDate: '1988-05-12',
          height: 175,
          weight: 80,
          jobType: 'Inženjer',
          profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
          role: 'patient',
          createdAt: '2024-01-20T16:45:00Z',
        },
      };
      return mockPatients[id] || mockPatients['101'];
    }
  },

  // Update appointment status and add prescription
  updateAppointment: async (appointmentId: string, updates: {
    status?: Appointment['status'];
    prescription?: string;
    notes?: string;
  }): Promise<Appointment> => {
    try {
      const response = await api.put(`/api/appointments/${appointmentId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },

  // Get available time slots for a specific date
  getAvailableSlots: async (date: string): Promise<TimeSlot[]> => {
    try {
      const response = await api.get(`/api/appointments/available-slots?date=${date}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available slots:', error);
      // Return mock available slots
      const slots: TimeSlot[] = [];
      for (let hour = 9; hour < 17; hour++) {
        for (let minutes of [0, 20, 40]) {
          const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          const startTime = `${date}T${time}:00.000Z`;
          const endTime = `${date}T${hour.toString().padStart(2, '0')}:${(minutes + 20).toString().padStart(2, '0')}:00.000Z`;
          
          slots.push({
            start: startTime,
            end: endTime,
            available: Math.random() > 0.3, // 70% of slots are available
          });
        }
      }
      return slots;
    }
  },
};