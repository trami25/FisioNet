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

    const json = await response.json();
    // Normalize user objects to frontend shape
    const users: User[] = (json.users || []).map((u: any) => normalizeUser(u));
    return { users, total: json.total || users.length, user_role: json.user_role };
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

    const json = await response.json();
    const users: User[] = (json.users || []).map((u: any) => normalizeUser(u));
    return { users, total: json.total || users.length, user_role: json.user_role };
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

    const json = await response.json();
    const users: User[] = (json.users || []).map((u: any) => normalizeUser(u));
    return { users, total: json.total || users.length, user_role: json.user_role };
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

    const json = await response.json();
    return normalizeUser(json);
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

    const json = await response.json();
    return normalizeUser(json);
  }

  // Dobijanje korisnika po ID-u (generička metoda)
  async getUserById(id: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Greška pri dobijanju korisnika');
    }

    const json = await response.json();
    return normalizeUser(json);
  }
}

export function normalizeUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name || u.firstName || '',
    lastName: u.last_name || u.lastName || '',
    phone: u.phone || undefined,
    birthDate: u.birth_date || u.birthDate || undefined,
    height: u.height ?? undefined,
    weight: u.weight ?? undefined,
    jobType: u.job_type || u.jobType || undefined,
    profileImage: u.profile_image || u.profileImage || undefined,
    role: (u.role || 'patient') as any,
    specializations: u.specializations || u.specializations || undefined,
    certifications: u.certifications || u.certifications || undefined,
    yearsOfExperience: u.years_of_experience ?? u.yearsOfExperience ?? undefined,
    education: u.education || undefined,
    bio: u.bio || undefined,
    createdAt: u.created_at || u.createdAt || new Date().toISOString(),
  } as User;
}

export const usersService = new UsersService();