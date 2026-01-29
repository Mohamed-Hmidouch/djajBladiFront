import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-1)]">
      {/* Navbar */}
      <header className="h-[var(--navbar-height)] border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface-1)]/90 backdrop-blur-[10px] z-50">
        <div className="h-full max-w-[var(--container-max)] mx-auto px-[var(--space-lg)] flex items-center justify-between">
          <Link href="/">
            <Image
              src="/djajbladiLogo.png"
              alt="DjajBladi"
              width={140}
              height={46}
              priority
            />
          </Link>
          <nav className="flex items-center gap-[var(--space-md)]">
            <Link
              href="/login"
              className="px-4 py-2 text-[var(--color-text-body)] hover:text-[var(--color-primary)] font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-[var(--color-brand)] text-white rounded-[var(--radius-md)] font-semibold hover:bg-[var(--color-brand-hover)] transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/fermLogo.webp"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[var(--color-primary)]/80" />
        </div>
        
        <div className="relative z-10 max-w-[var(--container-max)] mx-auto px-[var(--space-lg)] py-[var(--space-section-lg)]">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              Your Trusted Partner in the Poultry Industry
            </h1>
            <p className="text-xl text-white/80 leading-relaxed mb-8">
              Join thousands of farmers, veterinarians, and clients who trust DjajBladi 
              for quality products and reliable service in Morocco.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-brand)] text-white rounded-[var(--radius-md)] font-semibold text-lg hover:bg-[var(--color-brand-hover)] transition-all active:scale-[0.98]"
              >
                Start Your Journey
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white border-2 border-white/30 rounded-[var(--radius-md)] font-semibold text-lg hover:bg-white/20 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-[var(--space-section)] bg-[var(--color-surface-2)]">
        <div className="max-w-[var(--container-max)] mx-auto px-[var(--space-lg)]">
          <div className="text-center mb-[var(--space-3xl)]">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Why Choose DjajBladi?
            </h2>
            <p className="text-lg text-[var(--color-text-muted)] max-w-2xl mx-auto">
              We provide comprehensive solutions for all stakeholders in the poultry industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[var(--space-lg)]">
            <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--space-lg)] text-center hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] transition-all">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-brand)]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">For Clients</h3>
              <p className="text-[var(--color-text-muted)]">Access quality poultry products with easy ordering and tracking.</p>
            </div>

            <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--space-lg)] text-center hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] transition-all">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">For Veterinarians</h3>
              <p className="text-[var(--color-text-muted)]">Manage health records, vaccinations, and consultations efficiently.</p>
            </div>

            <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--space-lg)] text-center hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] transition-all">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-brand)]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">For Workers</h3>
              <p className="text-[var(--color-text-muted)]">Track tasks, manage inventory, and view schedules seamlessly.</p>
            </div>

            <div className="bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-[var(--space-lg)] text-center hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] transition-all">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">For Admins</h3>
              <p className="text-[var(--color-text-muted)]">Full control over users, settings, and system management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-[var(--space-section)] bg-[var(--color-primary)]">
        <div className="max-w-[var(--container-max)] mx-auto px-[var(--space-lg)] text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join DjajBladi today and experience the future of poultry management in Morocco.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-[var(--color-brand)] text-white rounded-[var(--radius-md)] font-semibold text-lg hover:bg-[var(--color-brand-hover)] transition-all active:scale-[0.98]"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-[var(--space-3xl)] bg-[var(--color-primary)]">
        <div className="max-w-[var(--container-max)] mx-auto px-[var(--space-lg)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Image
              src="/djajbladiLogo.png"
              alt="DjajBladi"
              width={120}
              height={40}
              className="brightness-0 invert"
            />
            <p className="text-white/60 text-sm">
              2026 DjajBladi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
