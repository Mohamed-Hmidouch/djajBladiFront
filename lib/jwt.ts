/* ============================================
   JWT Security Utilities - DjajBladi
   ============================================
   
   SECURITY ARCHITECTURE:
   ----------------------
   1. Le rôle est UNIQUEMENT extrait du JWT, jamais stocké séparément
   2. Le token est validé à chaque vérification de route
   3. Si le token est modifié manuellement, la signature devient invalide
   
   COMMENT ÇA FONCTIONNE:
   ----------------------
   Un JWT est composé de 3 parties séparées par des points:
   - Header: algorithme de signature (ex: HS256)
   - Payload: données (email, role, exp, etc.)
   - Signature: HMAC du header + payload avec la clé secrète du serveur
   
   Si un utilisateur modifie le payload (ex: changer "Client" en "Admin"),
   la signature ne correspondra plus. Le backend rejettera le token car:
   - Il recalcule la signature avec sa clé secrète
   - Compare avec la signature du token reçu
   - Si différent → 401 Unauthorized
   
   L'utilisateur NE PEUT PAS recalculer une signature valide car il
   n'a pas accès à la clé secrète du serveur (stockée uniquement côté backend).
   ============================================ */

import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

/* Token storage keys */
const TOKEN_KEY = 'djajbladi_token';
const REFRESH_TOKEN_KEY = 'djajbladi_refresh_token';

/* JWT Payload structure from backend */
export interface JwtPayload {
  sub: string;          // Subject (user email)
  email: string;        // User email
  role: string;         // User role (Admin, Client, etc.)
  iat: number;          // Issued at (timestamp)
  exp: number;          // Expiration (timestamp)
}

/* Decoded user info */
export interface DecodedUser {
  email: string;
  role: string;
  isExpired: boolean;
  expiresAt: Date;
}

/* Result type for token operations */
export type TokenResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get the stored JWT token
 * Checks both cookies (for SSR) and localStorage (fallback)
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

/**
 * Get the stored refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return Cookies.get(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Decode and validate a JWT token
 * Returns the payload if valid, or an error if invalid/expired
 */
export function decodeToken(token: string): TokenResult<JwtPayload> {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    
    // Validate required fields exist
    if (!decoded.role || !decoded.email) {
      return { 
        success: false, 
        error: 'Token invalide: champs requis manquants' 
      };
    }
    
    return { success: true, data: decoded };
  } catch {
    return { 
      success: false, 
      error: 'Token invalide ou corrompu' 
    };
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const result = decodeToken(token);
  if (!result.success) return true;
  
  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = result.data.exp * 1000;
  const now = Date.now();
  
  // Add a 30-second buffer to account for clock skew
  return now >= expirationTime - 30000;
}

/**
 * Get the current authenticated user from the JWT
 * This is the ONLY way to get the user's role - never from localStorage
 */
export function getCurrentUser(): DecodedUser | null {
  const token = getToken();
  if (!token) return null;
  
  const result = decodeToken(token);
  if (!result.success) return null;
  
  const { email, role, exp } = result.data;
  const expiresAt = new Date(exp * 1000);
  const isExpired = isTokenExpired(token);
  
  return {
    email,
    role,
    isExpired,
    expiresAt,
  };
}

/**
 * Get the user's role from the JWT
 * Returns null if no valid token or if expired
 */
export function getUserRole(): string | null {
  const user = getCurrentUser();
  if (!user || user.isExpired) return null;
  return user.role;
}

/**
 * Check if the current user has a specific role
 */
export function hasRole(requiredRole: string): boolean {
  const role = getUserRole();
  return role === requiredRole;
}

/**
 * Check if the current user has any of the specified roles
 */
export function hasAnyRole(roles: string[]): boolean {
  const role = getUserRole();
  return role !== null && roles.includes(role);
}

/**
 * Check if the current user is authenticated with a valid (non-expired) token
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

/**
 * Store tokens securely
 * @param token - JWT access token
 * @param refreshToken - Refresh token
 * @param remember - If true, persist in localStorage for "Remember Me" functionality
 */
export function storeTokens(
  token: string, 
  refreshToken: string, 
  remember: boolean = false
): void {
  const cookieOptions = remember
    ? { expires: 7, secure: true, sameSite: 'strict' as const }
    : { secure: true, sameSite: 'strict' as const };

  // Always store in cookies (for SSR compatibility)
  Cookies.set(TOKEN_KEY, token, cookieOptions);
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { 
    expires: 7, 
    secure: true, 
    sameSite: 'strict' as const 
  });

  // Store in localStorage only if "Remember Me" is enabled
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Clear all stored tokens (logout)
 */
export function clearTokens(): void {
  // Remove from cookies
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  
  // Remove from localStorage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  
  // SECURITY: Also remove any legacy role/email storage
  // This ensures old insecure storage is cleaned up
  Cookies.remove('djajbladi_role');
  Cookies.remove('djajbladi_email');
  localStorage.removeItem('djajbladi_role');
  localStorage.removeItem('djajbladi_email');
}

/**
 * Get time until token expiration
 * Returns null if no valid token
 */
export function getTokenExpirationTime(): number | null {
  const token = getToken();
  if (!token) return null;
  
  const result = decodeToken(token);
  if (!result.success) return null;
  
  const expirationTime = result.data.exp * 1000;
  const timeRemaining = expirationTime - Date.now();
  
  return timeRemaining > 0 ? timeRemaining : 0;
}