'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { registerUser } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { Button, Input, Select, PhoneInput } from '@/components/ui';
import { Role, type UserResponse } from '@/types/auth';

interface RegisterFormProps {
  onSuccess?: (user: UserResponse) => void;
}

const roleOptions = [
  { value: Role.Client, label: 'Client' },
  { value: Role.Ouvrier, label: 'Ouvrier (Worker)' },
  { value: Role.Veterinaire, label: 'Veterinaire' },
];

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      role: Role.Client,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    try {
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
      const { confirmPassword, phoneNumber, ...rest } = data;
      const registerData = {
        ...rest,
        ...(phoneNumber?.trim() && { phoneNumber: phoneNumber.trim() }),
      };
      const user = await registerUser(registerData);
      onSuccess?.(user);
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="p-4 text-sm text-[var(--color-brand)] bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-[var(--radius-md)]">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="First Name"
          type="text"
          placeholder="Enter your first name"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register('firstName')}
        />

        <Input
          label="Last Name"
          type="text"
          placeholder="Enter your last name"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Controller
        name="phoneNumber"
        control={control}
        render={({ field }) => (
          <PhoneInput
            label="Numéro de téléphone (Optionnel)"
            value={field.value}
            onChange={field.onChange}
            error={errors.phoneNumber?.message}
            defaultCountryCode="MA"
          />
        )}
      />

      <Select
        label="Account Type"
        options={roleOptions}
        error={errors.role?.message}
        {...register('role')}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            required
            className="mt-1 w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]"
          />
          <span className="text-sm text-[var(--color-text-body)]">
            I agree to the{' '}
            <Link href="/terms" className="text-[var(--color-brand)] hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[var(--color-brand)] hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
      </div>

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Create Account
      </Button>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-[var(--color-brand)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
