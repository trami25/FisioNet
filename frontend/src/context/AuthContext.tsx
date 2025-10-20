import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User, AuthResponse, UserProfile } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  registrationSuccess: boolean;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthResponse }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'REGISTER_SUCCESS' }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  registrationSuccess: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        registrationSuccess: false,
      };
    case 'AUTH_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      // store a serialized user object for other parts of the app and for refresh persistence
      try {
        const storedUser = JSON.stringify({
          id: (action.payload as any).user_id,
          email: (action.payload as any).email,
          firstName: (action.payload as any).first_name,
          lastName: (action.payload as any).last_name,
          phone: (action.payload as any).phone,
          birthDate: (action.payload as any).birth_date,
          height: (action.payload as any).height,
          weight: (action.payload as any).weight,
          jobType: (action.payload as any).job_type,
          profileImage: (action.payload as any).profile_image,
          role: (action.payload as any).role,
          createdAt: (action.payload as any).created_at || new Date().toISOString(),
        });
        localStorage.setItem('user', storedUser);
      } catch (e) {
        // ignore storage errors
      }
      return {
        ...state,
        user: {
          id: action.payload.user_id,
          email: action.payload.email,
          firstName: action.payload.first_name,
          lastName: action.payload.last_name,
          phone: (action.payload as any).phone,
          birthDate: (action.payload as any).birth_date,
          height: (action.payload as any).height,
          weight: (action.payload as any).weight,
          jobType: (action.payload as any).job_type,
          profileImage: (action.payload as any).profile_image,
          role: action.payload.role as any,
          createdAt: (action.payload as any).created_at || new Date().toISOString(),
        },
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
        registrationSuccess: true,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        registrationSuccess: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (user: User) => void;
  updateProfile: (updateData: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const verifyToken = useCallback(async (token: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const isValid = await authService.verifyToken();
      if (isValid) {
        // Get user profile after successful verification
        const profileResponse = await authService.getCurrentUser();
        if (profileResponse.success && profileResponse.data) {
          // Convert backend format to frontend format
          const userData = {
            token,
            user_id: profileResponse.data.id,
            email: profileResponse.data.email,
            first_name: profileResponse.data.first_name,
            last_name: profileResponse.data.last_name,
            phone: profileResponse.data.phone,
            birth_date: profileResponse.data.birth_date,
            height: profileResponse.data.height,
            weight: profileResponse.data.weight,
            job_type: profileResponse.data.job_type,
            profile_image: profileResponse.data.profile_image,
            role: profileResponse.data.role,
            created_at: profileResponse.data.created_at,
          };
          dispatch({ type: 'AUTH_SUCCESS', payload: userData });
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: 'Failed to get user profile' });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Invalid token' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Token verification failed' });
    }
  }, []);

  // Check if user is authenticated on mount - run only once
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      verifyToken(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount



  const updateUser = useCallback((user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  const updateProfile = useCallback(async (updateData: Partial<UserProfile>): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.updateProfile(updateData);
      if (response.success && response.data) {
        // Convert backend format to frontend format with updated data
        const userData = {
          token: state.token || '',
          user_id: response.data.id,
          email: response.data.email,
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          phone: response.data.phone,
          birth_date: response.data.birth_date,
          height: response.data.height,
          weight: response.data.weight,
          job_type: response.data.job_type,
          profile_image: response.data.profile_image,
          role: response.data.role,
          created_at: response.data.created_at,
        };
        dispatch({ type: 'AUTH_SUCCESS', payload: userData });
        // persist a normalized `user` object in localStorage (both snake_case and camelCase fields)
        try {
          const normalized = JSON.stringify({
            id: response.data.id,
            email: response.data.email,
            firstName: response.data.first_name,
            lastName: response.data.last_name,
            phone: response.data.phone,
            birthDate: response.data.birth_date,
            height: response.data.height,
            weight: response.data.weight,
            jobType: response.data.job_type,
            // keep both shapes so other parts of the app (camelCase or snake_case) can read it
            profile_image: response.data.profile_image,
            profileImage: response.data.profile_image,
            role: response.data.role,
            createdAt: response.data.created_at,
          });
          localStorage.setItem('user', normalized);
        } catch (e) {
          // ignore storage errors
        }

        // notify other parts of the app that profile (including avatar) changed
        try { window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: { profile: response.data } })); } catch(e) {}
        try { window.dispatchEvent(new Event('userProfileLocalUpdated')); } catch(e) {}
        return true;
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.error || 'Profile update failed' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Profile update failed' });
      return false;
    }
  }, [state.token]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.login(email, password);
      if (response.success && response.data) {
        // Store token first
        localStorage.setItem('token', response.data.token);
        
        // Get complete user profile after login
        const profileResponse = await authService.getCurrentUser();
        if (profileResponse.success && profileResponse.data) {
          // Convert backend format to frontend format with complete data
          const userData = {
            token: response.data.token,
            user_id: profileResponse.data.id,
            email: profileResponse.data.email,
            first_name: profileResponse.data.first_name,
            last_name: profileResponse.data.last_name,
            phone: profileResponse.data.phone,
            birth_date: profileResponse.data.birth_date,
            height: profileResponse.data.height,
            weight: profileResponse.data.weight,
            job_type: profileResponse.data.job_type,
            profile_image: profileResponse.data.profile_image,
            role: profileResponse.data.role,
            created_at: profileResponse.data.created_at,
          };
          dispatch({ type: 'AUTH_SUCCESS', payload: userData });
        } else {
          // Fallback to basic data if profile fetch fails
          dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.error || 'Login failed' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Login failed' });
    }
  }, []);

  const register = useCallback(async (userData: any) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.register(userData);
      if (response.success && response.data) {
        dispatch({ type: 'REGISTER_SUCCESS' });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.error || 'Registration failed' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Registration failed' });
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
    updateProfile,
  }), [state, login, register, logout, clearError, updateUser, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};