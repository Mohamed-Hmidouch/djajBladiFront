/* Auth API Service */

import { apiRequest } from './api';
import type {
  LoginRequest,
  RegisterRequest,
  JwtResponse,
  UserResponse,
} from '@/types/auth';

export async function loginUser(data: LoginRequest): Promise<JwtResponse> {
  return apiRequest<JwtResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function registerUser(data: RegisterRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function refreshToken(refreshToken: string): Promise<JwtResponse> {
  return apiRequest<JwtResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}
