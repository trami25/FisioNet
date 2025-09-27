import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: AuthResponse }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
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
    case 'LOGOUT':
      localStorage.removeItem('token');
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

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.verifyToken(token);
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Invalid token' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Token verification failed' });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.login(email, password);
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.error || 'Login failed' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Login failed' });
    }
  };

  const register = async (userData: any) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.register(userData);
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: response.error || 'Registration failed' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Registration failed' });
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};