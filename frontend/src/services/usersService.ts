import { User } from '../types';

export interface UsersListResponse {
  users: User[];
  total: number;
  user_role: string;
}

class UsersService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8001';

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Dobijanje fizioterapeuta (za pacijente)
  async getPhysiotherapists(): Promise<UsersListResponse> {
    const response = await fetch(`${this.baseUrl}/users/physiotherapists`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Greška pri dobijanju fizioterapeuta');
    }

    return response.json();
  }

  // Dobijanje pacijenata (za fizioterapeute)
  async getPatients(): Promise<UsersListResponse> {
    const response = await fetch(`${this.baseUrl}/users/patients`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Greška pri dobijanju pacijenata');
    }

    return response.json();
  }

  // Generička metoda - dobija korisnike na osnovu trenutne uloge
  async getUsersByRole(): Promise<UsersListResponse> {
    const response = await fetch(`${this.baseUrl}/users/by-role`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Greška pri dobijanju korisnika');
    }

    return response.json();
  }

  // Dobijanje fizioterapeuta po ID-u (za detalje)
  async getPhysiotherapistById(id: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/physiotherapists/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Greška pri dobijanju fizioterapeuta');
    }

    return response.json();
  }

  // Dobijanje pacijenta po ID-u (za detalje)
  async getPatientById(id: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/patients/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Greška pri dobijanju pacijenta');
    }

    return response.json();
  }
}

export const usersService = new UsersService();