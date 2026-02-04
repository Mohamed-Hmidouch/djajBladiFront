'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { loginUser } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { storeTokens } from '@/lib/jwt';
import { Button, Input } from '@/components/ui';

/* ============================================
   SECURE LOGIN FORM
   ============================================
   
   ⚠️ SECURITY: Ce formulaire stocke UNIQUEMENT les tokens JWT.
   
   Le rôle n'est JAMAIS stocké séparément car:
   1. Un utilisateur pourrait le modifier dans localStorage
   2. Le rôle doit être extrait du JWT à chaque vérification
   3. Le JWT est signé - toute modification invalide la signature
   
   ============================================ */

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
      
      /* 
       * SECURITY: Store ONLY the tokens
       * Role and email are extracted from JWT when needed
       * This prevents manual role manipulation via localStorage
       */
      storeTokens(response.token, response.refreshToken, rememberMe);
      
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
