/* Validation Schemas for Auth Forms and Admin */

import { z } from 'zod';
import { Role } from '@/types/auth';
import { StockType } from '@/types/admin';

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

/* Admin: Building */
export const buildingSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  maxCapacity: z.coerce
    .number({ error: 'Capacity must be a number' })
    .int('Capacity must be a whole number')
    .positive('Capacity must be greater than 0'),
  imageUrl: z
    .string()
    .max(512, 'Image URL must be less than 512 characters')
    .optional()
    .or(z.literal('')),
});

/* Admin: Batch */
export const batchSchema = z.object({
  batchNumber: z
    .string()
    .min(1, 'Batch number is required')
    .max(50, 'Batch number must be less than 50 characters'),
  strain: z
    .string()
    .min(1, 'Strain is required')
    .max(100, 'Strain must be less than 100 characters'),
  chickenCount: z.coerce
    .number({ error: 'Chicken count must be a number' })
    .int('Chicken count must be a whole number')
    .positive('Chicken count must be greater than 0'),
  arrivalDate: z.string().min(1, 'Arrival date is required'),
  purchasePrice: z.coerce
    .number({ error: 'Purchase price must be a number' })
    .positive('Purchase price must be greater than 0'),
  buildingId: z.string().optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
});

/* Admin: Stock */
export const stockSchema = z.object({
  type: z.nativeEnum(StockType, {
    error: 'Please select a type (Feed, Vaccine, or Vitamin)',
  }),
  name: z
    .string()
    .max(200, 'Name must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  quantity: z.coerce
    .number({ error: 'Quantity must be a number' })
    .positive('Quantity must be greater than 0'),
  unit: z
    .string()
    .min(1, 'Unit is required')
    .max(50, 'Unit must be less than 50 characters'),
});

/* Admin: Create user (Ouvrier or Veterinaire only) */
export const adminUserCreateSchema = z
  .object({
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
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    phoneNumber: z.string().optional().or(z.literal('')),
    role: z.enum([Role.Ouvrier, Role.Veterinaire] as const, {
      error: 'Role must be Ouvrier or Veterinaire',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) =>
      !data.phoneNumber ||
      data.phoneNumber === '' ||
      /^\+212[5-7]\d{8}$/.test(data.phoneNumber),
    {
      message: 'Please enter a valid Moroccan phone number (e.g., +212697110379)',
      path: ['phoneNumber'],
    }
  );

export type BuildingFormData = z.infer<typeof buildingSchema>;
export type BatchFormData = z.infer<typeof batchSchema>;
export type StockFormData = z.infer<typeof stockSchema>;
export type AdminUserCreateFormData = z.infer<typeof adminUserCreateSchema>;
