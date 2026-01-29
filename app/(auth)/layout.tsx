import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding with Farm Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <Image
          src="/fermLogo.webp"
          alt=""
          fill
          priority
          className="object-cover"
        />
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-[var(--color-primary)]/70" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="inline-block">
            <Image
              src="/djajbladiLogo.png"
              alt="DjajBladi"
              width={180}
              height={60}
              priority
              className="brightness-0 invert"
            />
          </Link>

          {/* Middle Content */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white leading-tight mb-6">
              Welcome to DjajBladi
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Your trusted partner in the poultry industry. Join thousands of farmers, 
              veterinarians, and clients who trust our platform for quality and reliability.
            </p>
          </div>

          {/* Footer */}
          <div className="text-white/60 text-sm">
            2026 DjajBladi. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--color-surface-1)]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-block">
              <Image
                src="/djajbladiLogo.png"
                alt="DjajBladi"
                width={160}
                height={53}
                priority
              />
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
