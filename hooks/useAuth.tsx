'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { loginUser, registerUser } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import {
  getToken,
  getCurrentUser,
  getUserRole,
  hasRole,
  hasAnyRole,
  isAuthenticated as checkIsAuthenticated,
  storeTokens,
  clearTokens,
  isTokenExpired,
  getTokenExpirationTime,
  type DecodedUser,
} from '@/lib/jwt';
import type {
  JwtResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '@/types/auth';

/* ============================================
   SECURE AUTH STATE
   ============================================
   Le rôle est TOUJOURS extrait du JWT, jamais stocké séparément.
   Cela empêche la manipulation manuelle du rôle via localStorage.
   ============================================ */

interface SecureAuthState {
  user: DecodedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends SecureAuthState {
  /* Auth actions */
  login: (data: LoginRequest, remember?: boolean) => Promise<JwtResponse>;
  register: (data: RegisterRequest) => Promise<UserResponse>;
  logout: () => void;
  
  /* Secure role checking - always from JWT */
  getRole: () => string | null;
  checkRole: (role: string) => boolean;
  checkAnyRole: (roles: string[]) => boolean;
  
  /* Token utilities */
  refreshAuthState: () => void;
  getTimeUntilExpiry: () => number | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<SecureAuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  /* Initialize and refresh auth state from JWT */
  const refreshAuthState = useCallback(() => {
    const token = getToken();
    
    if (token && !isTokenExpired(token)) {
      const user = getCurrentUser();
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      // Token missing or expired - clear everything
      if (token && isTokenExpired(token)) {
        clearTokens();
      }
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  /* Initialize on mount */
  useEffect(() => {
    refreshAuthState();
  }, [refreshAuthState]);

  /* Auto-refresh when token is about to expire */
  useEffect(() => {
    if (!state.token) return;

    const timeUntilExpiry = getTokenExpirationTime();
    if (!timeUntilExpiry || timeUntilExpiry <= 0) return;

    // Refresh state 1 minute before expiry
    const refreshTimeout = Math.max(timeUntilExpiry - 60000, 0);
    
    const timer = setTimeout(() => {
      refreshAuthState();
    }, refreshTimeout);

    return () => clearTimeout(timer);
  }, [state.token, refreshAuthState]);

  /* Login - stores tokens securely, extracts role from JWT */
  const login = useCallback(async (
    data: LoginRequest, 
    remember: boolean = false
  ): Promise<JwtResponse> => {
    try {
      const response = await loginUser(data);
      
      // Store only the tokens - role comes from JWT
      storeTokens(response.token, response.refreshToken, remember);
      
      // Update state with user info from JWT
      const user = getCurrentUser();
      setState({
        user,
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
  }, []);

  /* Register - no token storage, user must login after */
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

  /* Logout - clears all tokens and legacy storage */
  const logout = useCallback(() => {
    clearTokens();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  /* Secure role getters - always from JWT */
  const getRole = useCallback(() => getUserRole(), []);
  const checkRole = useCallback((role: string) => hasRole(role), []);
  const checkAnyRole = useCallback((roles: string[]) => hasAnyRole(roles), []);
  const getTimeUntilExpiry = useCallback(() => getTokenExpirationTime(), []);

  const value: AuthContextValue = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    getRole,
    checkRole,
    checkAnyRole,
    refreshAuthState,
    getTimeUntilExpiry,
  }), [
    state,
    login,
    register,
    logout,
    getRole,
    checkRole,
    checkAnyRole,
    refreshAuthState,
    getTimeUntilExpiry,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* Main hook for authentication */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/* ============================================
   CONVENIENCE HOOKS FOR ROLE CHECKING
   ============================================ */

/**
 * Hook to check if user has a specific role
 * Role is ALWAYS extracted from JWT in real-time
 */
export function useRole(requiredRole: string): boolean {
  const { checkRole, isAuthenticated } = useAuth();
  return isAuthenticated && checkRole(requiredRole);
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useAnyRole(roles: string[]): boolean {
  const { checkAnyRole, isAuthenticated } = useAuth();
  return isAuthenticated && checkAnyRole(roles);
}

/**
 * Hook to check if user is an Admin
 * Shortcut for useRole('Admin')
 */
export function useIsAdmin(): boolean {
  return useRole('Admin');
}
