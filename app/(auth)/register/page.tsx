'use client';

import { useRouter } from 'next/navigation';
import { RegisterForm } from '@/components/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();

  const handleRegisterSuccess = () => {
    router.push('/login?registered=true');
  };

  return (
    <Card className="border-0 shadow-none bg-transparent p-0">
      <CardHeader className="text-center lg:text-left">
        <CardTitle className="text-[var(--text-h2-size)] mb-2">
          Create your account
        </CardTitle>
        <CardDescription className="text-base">
          Join DjajBladi and start managing your poultry business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm onSuccess={handleRegisterSuccess} />
      </CardContent>
    </Card>
  );
}
