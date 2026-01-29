/* Validation Schemas for Auth Forms */

import { z } from 'zod';
import { Role } from '@/types/auth';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  phoneNumber: z
    .string()
    .optional(),
  role: z
    .nativeEnum(Role),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
).refine(
  (data) => !data.phoneNumber || /^\+212[5-7]\d{8}$/.test(data.phoneNumber),
  {
    message: 'Please enter a valid Moroccan phone number (e.g., +212697110379)',
    path: ['phoneNumber'],
  }
);

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.input<typeof registerSchema>;
