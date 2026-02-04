/* Auth Types - DjajBladi API */

export enum Role {
  Admin = 'Admin',
  Ouvrier = 'Ouvrier',
  Veterinaire = 'Veterinaire',
  Client = 'Client',
}

/* Request DTOs */
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role?: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/* Response DTOs */
export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: Role;
  isActive: boolean;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface JwtResponse {
  token: string;
  refreshToken: string;
  type: 'Bearer';
  email: string;
  role: string;
}

/* Error Types */
export interface ValidationError {
  errors: Record<string, string>;
}

export interface ApiError {
  error?: string;
  message?: string;
  status: number;
}

/* ============================================
   LEGACY: AuthState - DEPRECATED
   ============================================
   
   ⚠️ Ne pas utiliser ce type pour stocker le rôle!
   
   Le rôle doit être extrait du JWT via:
   - getUserRole() from '@/lib/jwt'
   - getCurrentUser() from '@/lib/jwt'
   
   Voir lib/jwt.ts pour l'implémentation sécurisée.
   ============================================ */

/** @deprecated Use SecureAuthState from useAuth hook instead */
export interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
