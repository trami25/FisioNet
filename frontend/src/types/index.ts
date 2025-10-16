// User types
export interface Specialization {
  name: string;
  description?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date_obtained: string;  // Changed to match backend
  expiry_date?: string;   // Changed to match backend
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  jobType?: string;
  profileImage?: string;
  role: 'patient' | 'physiotherapist' | 'moderator' | 'admin';
  specializations?: Specialization[];
  certifications?: Certification[];
  yearsOfExperience?: number;
  education?: string;
  bio?: string;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;  // Changed to match backend
  last_name: string;   // Changed to match backend
  phone?: string;
  birth_date?: string; // Changed to match backend
  height?: number;
  weight?: number;
  job_type?: string;   // Changed to match backend
  role?: string;       // Added role option
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  birth_date?: string;
  height?: number;
  weight?: number;
  job_type?: string;
  profile_image?: string;
  specializations?: Specialization[];
  certifications?: Certification[];
  years_of_experience?: number;
  education?: string;
  bio?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user_id: string;     // Changed to match backend
  email: string;
  role: string;
  first_name: string;  // Changed to match backend
  last_name: string;   // Changed to match backend
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;  // Changed to match backend
  last_name: string;   // Changed to match backend
  phone?: string;
  birth_date?: string; // Changed to match backend
  height?: number;
  weight?: number;
  job_type?: string;   // Changed to match backend
  profile_image?: string; // Added profile image
  role: string;
  specializations?: Specialization[];
  certifications?: Certification[];
  years_of_experience?: number;
  education?: string;
  bio?: string;
  created_at: string;  // Changed to match backend
}

// Exercise types
export interface Exercise {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_minutes?: number;
  equipment_needed: string[];
  instructions: string[];
  image_url?: string;
  images?: string[];
  video_url?: string;
  youtube_url?: string;
  target_muscles: string[];
  created_at: number;
  is_specialized: boolean;
}

export interface CreateExerciseRequest {
  title: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_minutes?: number;
  equipment_needed: string[];
  instructions: string[];
  image_url?: string;
  video_url?: string;
  youtube_url?: string;
  target_muscles: string[];
  is_specialized?: boolean;
}

export interface UpdateExerciseRequest {
  title?: string;
  description?: string;
  category?: string;
  difficulty_level?: string;
  duration_minutes?: number;
  equipment_needed?: string[];
  instructions?: string[];
  image_url?: string;
  video_url?: string;
  youtube_url?: string;
  target_muscles?: string[];
}

export interface ExerciseFilter {
  category?: string;
  difficultyLevel?: string;
  targetMuscle?: string;
  equipment?: string;
  duration?: number;
  search?: string;
}

// Appointment types
export interface Appointment {
  id: string;
  patientId: string;
  physiotherapistId: string;
  dateTime: string;
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  prescription?: string; // Therapy plan
  createdAt: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface Physiotherapist {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  specializations: string[];
  certifications: string[];
  biography?: string;
  rating: number;
  reviewCount: number;
  availability: TimeSlot[];
}

// Forum types
export interface ForumPost {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
  comments_count: number;
}

export interface ForumComment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: number;
  updated_at: number;
}

export interface CreatePostRequest {
  title: string;
  content: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'document';
  fileUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  participants: User[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'appointment_reminder' | 'new_message' | 'exercise_assigned' | 'forum_reply' | 'system';
  title: string;
  content: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface FormErrors {
  [key: string]: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// New Appointment types for our appointment service
export interface NewAppointment {
  id: string;
  patient_id: string;
  physiotherapist_id: string;
  appointment_date: string;  // YYYY-MM-DD
  start_time: string;        // HH:MM
  end_time: string;          // HH:MM
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  patient_notes?: string;
}

export interface CreateAppointmentRequest {
  patient_id: string;
  physiotherapist_id: string;
  appointment_date: string;  // YYYY-MM-DD
  start_time: string;        // HH:MM
}

export interface AppointmentResponse {
  message: string;
  appointment?: NewAppointment;
}

export interface AvailableSlot {
  time: string;
  available: boolean;
  booked: boolean;
}