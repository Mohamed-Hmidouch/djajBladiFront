'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  getCurrentUser, 
  isAuthenticated, 
  clearTokens,
  type DecodedUser 
} from '@/lib/jwt';

/* ============================================
   SECURE DASHBOARD PAGE
   ============================================
   
   Le rôle et l'email sont extraits du JWT en temps réel.
   Aucune donnée sensible n'est stockée séparément.
   
   ============================================ */

interface UserInfo {
  email: string;
  role: string;
  firstName: string;
}

/* ============================================
   STATIC DEMO DATA - Dashboard Overview
   ============================================ */
const dashboardStats = {
  totalChickens: 25500,
  totalBuildings: 4,
  activeBatches: 3,
  stockItems: 9,
  monthlyRevenue: 485000,
  mortalityRate: 1.4,
  occupancyRate: 78,
  pendingOrders: 12,
};

const recentActivities = [
  { id: 1, type: 'batch', action: 'Nouveau lot enregistre', details: 'BL-2026-002 - 7200 poussins Ross 308', time: '2h', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'emerald' },
  { id: 2, type: 'stock', action: 'Stock mis a jour', details: 'Aliment Demarrage +200 sacs', time: '4h', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'amber' },
  { id: 3, type: 'user', action: 'Nouvel utilisateur', details: 'Sara Chraibi - Client', time: '1j', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'violet' },
  { id: 4, type: 'vaccine', action: 'Vaccination effectuee', details: 'Lot BL-2026-001 - Newcastle', time: '1j', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', color: 'rose' },
  { id: 5, type: 'building', action: 'Inspection terminee', details: 'Batiment Alpha - Tout est OK', time: '2j', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'blue' },
];

const upcomingTasks = [
  { id: 1, title: 'Vaccination Gumboro', batch: 'BL-2026-002', dueDate: '06 Fev', priority: 'high' },
  { id: 2, title: 'Pesee hebdomadaire', batch: 'BL-2026-001', dueDate: '07 Fev', priority: 'medium' },
  { id: 3, title: 'Commande aliment', type: 'stock', dueDate: '08 Fev', priority: 'high' },
  { id: 4, title: 'Inspection sanitaire', batch: 'Tous', dueDate: '10 Fev', priority: 'low' },
];

const quickAccessLinks = [
  { href: '/dashboard/admin/buildings', label: 'Batiments', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', gradient: 'from-[var(--color-primary)] to-[#2d4a6f]' },
  { href: '/dashboard/admin/batches', label: 'Lots', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', gradient: 'from-emerald-500 to-emerald-600' },
  { href: '/dashboard/admin/stock', label: 'Stock', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', gradient: 'from-amber-500 to-amber-600' },
  { href: '/dashboard/admin/users', label: 'Equipe', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', gradient: 'from-[var(--color-brand)] to-[#e85d4a]' },
];

/* Mini Line Chart Component */
function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 50" className="w-full h-12">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polygon
        fill={`url(#gradient-${color})`}
        points={`0,50 ${points} 100,50`}
      />
    </svg>
  );
}

/* Circular Progress Component */
function CircularProgress({ value, color, size = 80 }: { value: number; color: string; size?: number }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="transform -rotate-90">
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        className="text-[var(--color-surface-2)]"
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // SECURITY: Get user info from JWT, not from localStorage/cookies
    if (!isAuthenticated()) {
      clearTokens();
      router.push('/login');
      return;
    }

    const decodedUser = getCurrentUser();
    
    if (!decodedUser || decodedUser.isExpired) {
      clearTokens();
      router.push('/login');
      return;
    }

    // Extract first name from email and capitalize
    const extractedName = decodedUser.email.split('@')[0] || 'User';
    const formattedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1);
    
    setUser({
      email: decodedUser.email,
      role: decodedUser.role,
      firstName: formattedName,
    });
    setIsLoading(false);

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-[var(--color-brand)] border-t-transparent rounded-full" />
      </div>
    );
  }

  const greeting = currentTime.getHours() < 12 ? 'Bonjour' : currentTime.getHours() < 18 ? 'Bon apres-midi' : 'Bonsoir';

  // Show Admin Dashboard
  if (user?.role === 'Admin') {
    return (
      <div className="space-y-8">
        {/* ==========================================
            WELCOME HEADER WITH FARM IMAGE
            ========================================== */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--color-primary)] to-[#2d4a6f] p-8 text-white animate-fadeIn">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <p className="text-white/70 text-sm font-medium mb-1">
                {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                {greeting}, {user?.firstName}!
              </h1>
              <p className="text-white/80 text-lg">
                Voici un apercu de votre exploitation avicole aujourd&apos;hui.
              </p>
            </div>
            
            {/* Quick Access Buttons */}
            <div className="flex gap-3">
              <Link 
                href="/dashboard/admin/batches"
                className="px-5 py-3 bg-white text-[var(--color-primary)] font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all duration-200 shadow-lg"
              >
                + Nouveau Lot
              </Link>
              <Link 
                href="/dashboard/admin/stock"
                className="px-5 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 active:scale-[0.98] transition-all duration-200 backdrop-blur-sm"
              >
                Gerer Stock
              </Link>
            </div>
          </div>
        </div>

        {/* ==========================================
            MAIN STATS GRID
            ========================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Chickens */}
          <div
            className="animate-slideUp stagger-1 bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-5 hover:shadow-lg hover:border-[var(--color-primary)]/30 transition-all duration-300 group"
            style={{ opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">+12%</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
              {dashboardStats.totalChickens.toLocaleString()}
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Poussins Total</p>
            <MiniChart data={[18000, 19500, 21000, 22500, 24000, 25500]} color="#10b981" />
          </div>

          {/* Monthly Revenue */}
          <div
            className="animate-slideUp stagger-2 bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-5 hover:shadow-lg hover:border-[var(--color-brand)]/30 transition-all duration-300 group"
            style={{ opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-[var(--color-brand)]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-[var(--color-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2 py-1 rounded-full">+8%</span>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
              {(dashboardStats.monthlyRevenue / 1000).toFixed(0)}K
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Revenu (DH)</p>
            <MiniChart data={[320, 380, 350, 420, 450, 485]} color="#C84630" />
          </div>

          {/* Occupancy Rate */}
          <div
            className="animate-slideUp stagger-3 bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-5 hover:shadow-lg hover:border-sky-400/30 transition-all duration-300 group"
            style={{ opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
                  {dashboardStats.occupancyRate}%
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">Taux Occupation</p>
              </div>
              <div className="relative">
                <CircularProgress value={dashboardStats.occupancyRate} color="#38bdf8" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-sky-500">
                  {dashboardStats.occupancyRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Mortality Rate */}
          <div
            className="animate-slideUp stagger-4 bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-5 hover:shadow-lg hover:border-teal-400/30 transition-all duration-300 group"
            style={{ opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-teal-500 bg-teal-50 px-2 py-1 rounded-full">Bon</span>
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
                  {dashboardStats.mortalityRate}%
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">Taux Mortalite</p>
              </div>
              <div className="relative">
                <CircularProgress value={100 - dashboardStats.mortalityRate * 10} color="#2dd4bf" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-teal-500">
                  OK
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            QUICK ACCESS & ACTIVITIES ROW
            ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Access */}
          <div className="animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-6" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Acces Rapide</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickAccessLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br ${link.gradient} text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
                >
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                  </svg>
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="lg:col-span-2 animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-6" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Activites Recentes</h2>
              <button className="text-sm text-[var(--color-primary)] hover:underline">Voir tout</button>
            </div>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const colorClasses: Record<string, string> = {
                  emerald: 'bg-emerald-100 text-emerald-600',
                  amber: 'bg-amber-100 text-amber-600',
                  violet: 'bg-violet-100 text-violet-600',
                  rose: 'bg-rose-100 text-rose-600',
                  blue: 'bg-blue-100 text-blue-600',
                };
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                    style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[activity.color]}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={activity.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-text-primary)] truncate">{activity.action}</p>
                      <p className="text-sm text-[var(--color-text-muted)] truncate">{activity.details}</p>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">{activity.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==========================================
            TASKS & OVERVIEW ROW
            ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Tasks */}
          <div className="animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-6" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Taches a Venir</h2>
              <span className="px-2 py-1 bg-[var(--color-brand)]/10 text-[var(--color-brand)] text-xs font-semibold rounded-full">
                {upcomingTasks.length} taches
              </span>
            </div>
            <div className="space-y-3">
              {upcomingTasks.map((task) => {
                const priorityColors: Record<string, string> = {
                  high: 'border-l-[var(--color-brand)]',
                  medium: 'border-l-amber-500',
                  low: 'border-l-emerald-500',
                };
                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3 bg-[var(--color-surface-2)]/50 rounded-xl border-l-4 ${priorityColors[task.priority]} hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer`}
                  >
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">{task.title}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {task.batch ? `Lot ${task.batch}` : task.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{task.dueDate}</p>
                      <p className={`text-xs ${task.priority === 'high' ? 'text-[var(--color-brand)]' : task.priority === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {task.priority === 'high' ? 'Urgent' : task.priority === 'medium' ? 'Normal' : 'Faible'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Farm Overview Image */}
          <div className="animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] overflow-hidden" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="relative h-48 lg:h-full min-h-[200px]">
              <Image
                src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80"
                alt="Ferme avicole"
                fill
                className="object-cover"
                unoptimized
              />
              {/* Warm overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-[#8B4513]/[0.05]" />
              
              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-1">Vue d&apos;ensemble</h3>
                <p className="text-white/80 text-sm mb-3">
                  {dashboardStats.totalBuildings} batiments - {dashboardStats.activeBatches} lots actifs
                </p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.stockItems}</p>
                    <p className="text-xs text-white/70">Articles en stock</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboardStats.pendingOrders}</p>
                    <p className="text-xs text-white/70">Commandes en attente</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            MINI STATS BAR
            ========================================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn" style={{ animationDelay: '0.7s' }}>
          {[
            { label: 'Batiments', value: dashboardStats.totalBuildings, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5', color: 'primary' },
            { label: 'Lots Actifs', value: dashboardStats.activeBatches, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2', color: 'emerald' },
            { label: 'Stock Items', value: dashboardStats.stockItems, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'amber' },
            { label: 'Commandes', value: dashboardStats.pendingOrders, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'violet' },
          ].map((stat) => {
            const colorClasses: Record<string, string> = {
              primary: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10',
              emerald: 'text-emerald-600 bg-emerald-100',
              amber: 'text-amber-600 bg-amber-100',
              violet: 'text-violet-600 bg-violet-100',
            };
            return (
              <div
                key={stat.label}
                className="bg-[var(--color-surface-1)] rounded-xl border border-[var(--color-border)] p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[stat.color]}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default Dashboard for other roles (simplified)
  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--color-primary)] to-[#2d4a6f] p-8 text-white">
        <div className="relative">
          <p className="text-white/70 text-sm font-medium mb-1">
            {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-3xl font-bold mb-2">{greeting}!</h1>
          <p className="text-white/80">
            Connecte en tant que <span className="font-semibold">{user?.email}</span>
            {' '} - Role: <span className="font-bold text-white">{user?.role}</span>
          </p>
        </div>
      </div>

      {/* Role-specific content placeholder */}
      <div className="bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-surface-2)] rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          Dashboard {user?.role}
        </h2>
        <p className="text-[var(--color-text-muted)]">
          Le contenu specifique pour le role {user?.role} sera disponible bientot.
        </p>
      </div>
    </div>
  );
}
