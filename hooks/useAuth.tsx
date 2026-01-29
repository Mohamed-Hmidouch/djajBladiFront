'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import Cookies from 'js-cookie';
import { loginUser, registerUser } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import type {
  AuthState,
  JwtResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '@/types/auth';

const TOKEN_KEY = 'djajbladi_token';
const REFRESH_TOKEN_KEY = 'djajbladi_refresh_token';

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<JwtResponse>;
  register: (data: RegisterRequest) => Promise<UserResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /* Initialize auth state from stored token */
  useEffect(() => {
    const token = Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    
    if (token) {
      setState({
        user: null,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const setTokens = useCallback((token: string, refreshToken: string) => {
    /* Store in both cookie (for SSR) and localStorage (for client) */
    Cookies.set(TOKEN_KEY, token, { expires: 1, secure: true, sameSite: 'strict' });
    Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 7, secure: true, sameSite: 'strict' });
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }, []);

  const clearTokens = useCallback(() => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<JwtResponse> => {
    try {
      const response = await loginUser(data);
      setTokens(response.token, response.refreshToken);
      
      setState({
        user: null,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Login failed');
    }
  }, [setTokens]);

  const register = useCallback(async (data: RegisterRequest): Promise<UserResponse> => {
    try {
      const user = await registerUser(data);
      return user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Registration failed');
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, [clearTokens]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
