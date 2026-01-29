'use client';

import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <Card className="border-0 shadow-none bg-transparent p-0">
      <CardHeader className="text-center lg:text-left">
        <CardTitle className="text-[var(--text-h2-size)] mb-2">
          Sign in to your account
        </CardTitle>
        <CardDescription className="text-base">
          Enter your credentials to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm onSuccess={handleLoginSuccess} />
      </CardContent>
    </Card>
  );
}
