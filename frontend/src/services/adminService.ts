import { User } from '../types';
import { normalizeUser } from './usersService';

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  birth_date?: string;
  height?: number;
  weight?: number;
  job_type?: string;
  role: 'patient' | 'physiotherapist' | 'admin';
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  birth_date?: string;
  height?: number;
  weight?: number;
  job_type?: string;
  role?: 'patient' | 'physiotherapist' | 'admin';
}

export interface UsersResponse {
  users: User[];
  total: number;
}

class AdminService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8001';

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Dobijanje svih korisnika
  async getAllUsers(): Promise<UsersResponse> {
    const response = await fetch(`${this.baseUrl}/admin/users`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Greška pri dobijanju korisnika');
    }

    const json = await response.json();
    const users: User[] = (json.users || []).map((u: any) => normalizeUser(u));
    return { users, total: json.total || users.length };
  }

  // Kreiranje novog korisnika
  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/admin/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Greška pri kreiranju korisnika');
    }

    const json = await response.json();
    return normalizeUser(json);
  }

  // Ažuriranje korisnika
  async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Greška pri ažuriranju korisnika');
    }

    const json = await response.json();
    return normalizeUser(json);
  }

  // Brisanje korisnika
  async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Greška pri brisanju korisnika');
    }
  }

  // Dobijanje korisnika po ID-u
  async getUserById(userId: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Greška pri dobijanju korisnika');
    }

    const json = await response.json();
    return normalizeUser(json);
  }

  // Dobijanje korisnika po ulozi
  async getUsersByRole(role: 'patient' | 'physiotherapist' | 'admin'): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/admin/users?role=${role}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Greška pri dobijanju korisnika po ulozi');
    }

    const data = await response.json();
    return (data.users || []).map((u: any) => normalizeUser(u));
  }

  // Statistike korisnika
  async getUserStats(): Promise<{
    total: number;
    patients: number;
    physiotherapists: number;
    admins: number;
  }> {
    const response = await fetch(`${this.baseUrl}/admin/users/stats`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Greška pri dobijanju statistika');
    }

    return response.json();
  }
}

export const adminService = new AdminService();