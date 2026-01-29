'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { loginUser } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { Button, Input } from '@/components/ui';

interface LoginFormProps {
  onSuccess?: (token: string) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const response = await loginUser(data);
      
      /* Store tokens based on Remember Me */
      const cookieOptions = rememberMe 
        ? { expires: 7, secure: true, sameSite: 'strict' as const }
        : { secure: true, sameSite: 'strict' as const };

      Cookies.set('djajbladi_token', response.token, cookieOptions);
      Cookies.set('djajbladi_refresh_token', response.refreshToken, { expires: 7, secure: true, sameSite: 'strict' as const });
      Cookies.set('djajbladi_role', response.role, cookieOptions);
      Cookies.set('djajbladi_email', response.email, cookieOptions);

      /* Also store in localStorage for persistence */
      if (rememberMe) {
        localStorage.setItem('djajbladi_token', response.token);
        localStorage.setItem('djajbladi_refresh_token', response.refreshToken);
        localStorage.setItem('djajbladi_role', response.role);
        localStorage.setItem('djajbladi_email', response.email);
      }
      
      onSuccess?.(response.token);
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="p-4 text-sm text-[var(--color-brand)] bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-[var(--radius-md)]">
          {serverError}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-brand)] focus:ring-[var(--color-brand)]"
          />
          <span className="text-sm text-[var(--color-text-body)]">
            Remember me
          </span>
        </label>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-[var(--color-brand)] hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Sign In
      </Button>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-[var(--color-brand)] hover:underline"
        >
          Create account
        </Link>
      </p>
    </form>
  );
}
