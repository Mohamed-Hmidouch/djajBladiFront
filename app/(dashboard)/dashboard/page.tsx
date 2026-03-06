'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  getCurrentUser,
  isAuthenticated,
  clearTokens,
  getToken,
} from '@/lib/jwt';
import {
  getBuildings,
  getBatches,
  getStock,
  getUsers,
  getSupervisionDashboard,
  approveHealthRecord,
  rejectHealthRecord,
} from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type {
  BuildingResponse,
  BatchResponse,
  StockItemResponse,
  SupervisionDashboardResponse,
  BatchDailySummary,
  HealthAlertSummary,
  BatchFcrSummary,
} from '@/types/admin';
import type { UserResponse } from '@/types/auth';

interface UserInfo {
  email: string;
  role: string;
  firstName: string;
}

interface DashboardData {
  buildings: BuildingResponse[];
  batches: BatchResponse[];
  stock: StockItemResponse[];
  users: UserResponse[];
}

const quickAccessLinks = [
  { href: '/dashboard/admin/buildings', label: 'Batiments', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', gradient: 'from-[var(--color-primary)] to-[#2d4a6f]' },
  { href: '/dashboard/admin/batches', label: 'Lots', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', gradient: 'from-emerald-500 to-emerald-600' },
  { href: '/dashboard/admin/stock', label: 'Stock', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', gradient: 'from-amber-500 to-amber-600' },
  { href: '/dashboard/admin/users', label: 'Equipe', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', gradient: 'from-[var(--color-brand)] to-[#e85d4a]' },
];

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
        <linearGradient id={`gradient-${color.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <polygon fill={`url(#gradient-${color.replace('#','')})`} points={`0,50 ${points} 100,50`} />
    </svg>
  );
}

function CircularProgress({ value, color, size = 80 }: { value: number; color: string; size?: number }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="transform -rotate-90">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-[var(--color-surface-2)]" />
      <circle cx="40" cy="40" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
    </svg>
  );
}

/* Dual-axis batch chart: area curve (feeding) + bars (mortality) */
function BatchMiniChart({
  feedValues,
  mortValues,
  hasAnomaly,
}: {
  feedValues: number[];
  mortValues: number[];
  hasAnomaly: boolean;
}) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: number; feed: number; mort: number } | null>(null);
  const W = 240;
  const H = 80;
  const PAD = { top: 8, right: 6, bottom: 16, left: 28 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const n = feedValues.length;
  if (n === 0) return null;

  const maxFeed = Math.max(...feedValues, 1);
  const maxMort = Math.max(...mortValues, 1);

  const feedColor = hasAnomaly ? '#f59e0b' : '#f59e0b';
  const mortColor = hasAnomaly ? '#C84630' : '#10b981';

  const xPos = (i: number) => PAD.left + (i / Math.max(n - 1, 1)) * innerW;
  const yFeed = (v: number) => PAD.top + innerH - (v / maxFeed) * innerH;
  const yMort = (v: number) => PAD.top + innerH - (v / maxMort) * innerH;

  const feedPath = feedValues
    .map((v, i) => {
      const x = xPos(i);
      const y = yFeed(v);
      if (i === 0) return `M ${x} ${y}`;
      const px = xPos(i - 1);
      const py = yFeed(feedValues[i - 1]);
      const cx = (px + x) / 2;
      return `C ${cx} ${py} ${cx} ${y} ${x} ${y}`;
    })
    .join(' ');

  const areaPath =
    feedPath +
    ` L ${xPos(n - 1)} ${PAD.top + innerH} L ${PAD.left} ${PAD.top + innerH} Z`;

  const barW = Math.max(2, innerW / n - 1.5);

  const gradFeedId = `gf${Math.random().toString(36).slice(2, 7)}`;
  const gradAreaId = `ga${Math.random().toString(36).slice(2, 7)}`;

  const ticks = [0, 0.5, 1].map((t) => ({
    y: PAD.top + innerH - t * innerH,
    val: Math.round(t * maxFeed),
  }));

  return (
    <div className="relative w-full" style={{ paddingBottom: '34%' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full overflow-visible"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={gradFeedId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={feedColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={feedColor} stopOpacity="1" />
          </linearGradient>
          <linearGradient id={gradAreaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={feedColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={feedColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid lines */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={t.y}
              y2={t.y}
              stroke="currentColor"
              strokeOpacity="0.07"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              className="text-[var(--color-text-muted)]"
            />
            <text
              x={PAD.left - 3}
              y={t.y + 3}
              textAnchor="end"
              fontSize="5.5"
              fill="currentColor"
              className="text-[var(--color-text-muted)]"
              opacity="0.55"
            >
              {t.val}
            </text>
          </g>
        ))}

        {/* x-axis baseline */}
        <line
          x1={PAD.left}
          x2={PAD.left + innerW}
          y1={PAD.top + innerH}
          y2={PAD.top + innerH}
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="0.8"
          className="text-[var(--color-text-muted)]"
        />

        {/* x labels (first, mid, last) */}
        {[0, Math.floor((n - 1) / 2), n - 1].map((idx) => (
          <text
            key={idx}
            x={xPos(idx)}
            y={H - 3}
            textAnchor="middle"
            fontSize="5"
            fill="currentColor"
            className="text-[var(--color-text-muted)]"
            opacity="0.5"
          >
            J{idx + 1}
          </text>
        ))}

        {/* mortality bars */}
        {mortValues.map((v, i) => {
          if (v === 0) return null;
          const bx = xPos(i) - barW / 2;
          const bh = (v / maxMort) * innerH * 0.55;
          const by = PAD.top + innerH - bh;
          return (
            <rect
              key={i}
              x={bx}
              y={by}
              width={barW}
              height={bh}
              rx="1"
              fill={mortColor}
              opacity={hasAnomaly ? 0.75 : 0.55}
            />
          );
        })}

        {/* feeding area fill */}
        <path d={areaPath} fill={`url(#${gradAreaId})`} />

        {/* feeding curve */}
        <path
          d={feedPath}
          fill="none"
          stroke={`url(#${gradFeedId})`}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* dots + invisible hover zones */}
        {feedValues.map((v, i) => {
          const cx = xPos(i);
          const cy = yFeed(v);
          const isHovered = tooltip?.day === i;
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 3 : 1.5}
                fill={feedColor}
                opacity={isHovered ? 1 : 0.7}
                className="transition-all duration-150"
              />
              <rect
                x={cx - 6}
                y={PAD.top}
                width={12}
                height={innerH}
                fill="transparent"
                onMouseEnter={() =>
                  setTooltip({ x: cx, y: cy, day: i, feed: v, mort: mortValues[i] ?? 0 })
                }
              />
            </g>
          );
        })}

        {/* tooltip */}
        {tooltip && (() => {
          const tx = tooltip.x + 8 > PAD.left + innerW - 42 ? tooltip.x - 50 : tooltip.x + 8;
          const ty = Math.max(PAD.top, tooltip.y - 18);
          return (
            <g>
              <rect x={tx} y={ty} width={44} height={26} rx="4" fill="var(--color-primary)" opacity="0.93" />
              <text x={tx + 22} y={ty + 9} textAnchor="middle" fontSize="5.5" fill="white" opacity="0.7">
                J{tooltip.day + 1}
              </text>
              <text x={tx + 5} y={ty + 18} fontSize="5.5" fill={feedColor} fontWeight="600">
                {tooltip.feed.toFixed(0)}kg
              </text>
              <text x={tx + 25} y={ty + 18} fontSize="5.5" fill={tooltip.mort > 0 ? mortColor : '#10b981'} fontWeight="600">
                {tooltip.mort}m
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function fcrColor(status: string | null | undefined): string {
  switch (status) {
    case 'EXCELLENT': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'BON': return 'text-amber-600 bg-amber-50 border-amber-100';
    case 'ALERTE': return 'text-[var(--color-brand)] bg-[var(--color-brand)]/5 border-[var(--color-brand)]/20';
    case 'CRITIQUE': return 'text-red-700 bg-red-50 border-red-100';
    default: return 'text-[var(--color-text-muted)] bg-[var(--color-surface-2)] border-[var(--color-border)]';
  }
}

function fcrLabel(status: string | null | undefined): string {
  switch (status) {
    case 'EXCELLENT': return 'Excellent';
    case 'BON': return 'Bon';
    case 'ALERTE': return 'Alerte';
    case 'CRITIQUE': return 'Critique';
    default: return 'N/D';
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [supervision, setSupervision] = useState<SupervisionDashboardResponse | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [supervisionError, setSupervisionError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [supervisionDays, setSupervisionDays] = useState(7);

  const fetchDashboardData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setDataError(null);
      const [buildings, batches, stock, users] = await Promise.all([
        getBuildings(token),
        getBatches(token),
        getStock(token),
        getUsers(token),
      ]);
      setData({ buildings, batches, stock, users });
    } catch (err) {
      setDataError(err instanceof ApiError ? err.message : 'Erreur chargement');
    }
  }, []);

  const fetchSupervision = useCallback(async (days: number) => {
    const token = getToken();
    if (!token) return;
    try {
      setSupervisionError(null);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const iso = startDate.toISOString().split('T')[0];
      const result = await getSupervisionDashboard(token, iso);
      setSupervision(result);
    } catch (err) {
      setSupervisionError(err instanceof ApiError ? err.message : 'Erreur supervision');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { clearTokens(); router.push('/login'); return; }
    const decodedUser = getCurrentUser();
    if (!decodedUser || decodedUser.isExpired) { clearTokens(); router.push('/login'); return; }
    const name = decodedUser.email.split('@')[0] || 'User';
    setUser({ email: decodedUser.email, role: decodedUser.role, firstName: name.charAt(0).toUpperCase() + name.slice(1) });
    setIsLoading(false);
    fetchDashboardData();
    fetchSupervision(supervisionDays);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [router, fetchDashboardData, fetchSupervision, supervisionDays]);

  async function handleApprove(id: number) {
    const token = getToken();
    if (!token) return;
    setApprovingId(id);
    try {
      await approveHealthRecord(token, id);
      await fetchSupervision(supervisionDays);
    } catch { /* ignore */ }
    finally { setApprovingId(null); }
  }

  async function handleReject(id: number) {
    const token = getToken();
    if (!token) return;
    setRejectingId(id);
    try {
      await rejectHealthRecord(token, id);
      await fetchSupervision(supervisionDays);
    } catch { /* ignore */ }
    finally { setRejectingId(null); }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-10 h-10 border-4 border-[var(--color-brand)] border-t-transparent rounded-full" />
      </div>
    );
  }

  const greeting = currentTime.getHours() < 12 ? 'Bonjour' : currentTime.getHours() < 18 ? 'Bon apres-midi' : 'Bonsoir';
  const activeBatches = data?.batches.filter(b => b.status === 'Active') || [];
  const totalChickens = activeBatches.reduce((sum, b) => sum + b.chickenCount, 0);
  const totalBuildings = data?.buildings.length || 0;
  const totalStockItems = data?.stock.length || 0;
  const totalUsers = data?.users.length || 0;
  const totalCapacity = (data?.buildings || []).reduce((sum, b) => sum + b.maxCapacity, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalChickens / totalCapacity) * 100) : 0;
  const totalValue = (data?.batches || []).reduce((sum, b) => sum + b.purchasePrice, 0);

  /* Supervision computed */
  const abnormalSummaries = supervision?.batchSummaries.filter(s => s.abnormalConsumption) || [];
  const pendingAlerts = supervision?.pendingAlerts || [];
  const totalMortality = (supervision?.batchSummaries || []).reduce((sum, s) => sum + s.mortalityCount, 0);
  const totalFeeding = (supervision?.batchSummaries || []).reduce((sum, s) => sum + s.totalQuantityEaten, 0);

  /* Group summaries by batch for sparklines */
  const summariesByBatch = (supervision?.batchSummaries || []).reduce<Record<string, BatchDailySummary[]>>((acc, s) => {
    if (!acc[s.batchNumber]) acc[s.batchNumber] = [];
    acc[s.batchNumber].push(s);
    return acc;
  }, {});

  /* FCR: average FCR across active batches */
  const fcrSummaries: BatchFcrSummary[] = supervision?.fcrSummaries || [];
  const fcrWithData = fcrSummaries.filter(f => f.cumulativeFcr != null);
  const avgFcr = fcrWithData.length > 0
    ? fcrWithData.reduce((sum, f) => sum + (f.cumulativeFcr ?? 0), 0) / fcrWithData.length
    : null;
  const fcrAlertCount = fcrSummaries.filter(f => f.fcrAlert).length;

  if (user?.role !== 'Admin') {
    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--color-primary)] to-[#2d4a6f] p-8 text-white">
          <div className="relative">
            <p className="text-white/70 text-sm font-medium mb-1">{currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-3xl font-bold mb-2">{greeting}!</h1>
            <p className="text-white/80">Connecte en tant que <span className="font-semibold">{user?.email}</span> - Role: <span className="font-bold text-white">{user?.role}</span></p>
          </div>
        </div>
        <div className="bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Dashboard {user?.role}</h2>
          <p className="text-[var(--color-text-muted)]">Le contenu specifique pour le role {user?.role} sera disponible bientot.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ============ ROW 1: WELCOME HEADER (full width) ============ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[#2d4a6f] px-8 py-6 text-white animate-fadeIn">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium mb-1">{currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">{greeting}, {user?.firstName}!</h1>
            <p className="text-white/80">Voici un apercu de votre exploitation avicole.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link href="/dashboard/admin/batches" className="px-4 py-2 bg-white text-[var(--color-primary)] font-semibold rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all duration-200 shadow-lg text-sm">+ Nouveau Lot</Link>
            <Link href="/dashboard/admin/stock" className="px-4 py-2 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 active:scale-[0.98] transition-all duration-200 backdrop-blur-sm text-sm">Gerer Stock</Link>
          </div>
        </div>
      </div>

      {dataError && (
        <div className="bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl p-3 flex items-center justify-between">
          <p className="text-[var(--color-brand)] text-sm font-medium">{dataError}</p>
          <button onClick={fetchDashboardData} className="px-3 py-1.5 bg-[var(--color-brand)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">Reessayer</button>
        </div>
      )}

      {/* ============ ROW 2: 4 KPI CARDS side by side ============ */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-4 hover:shadow-lg hover:border-emerald-400/30 transition-all duration-300 group" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{totalChickens.toLocaleString()}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Poussins Actifs</p>
          <MiniChart data={[0, totalChickens * 0.4, totalChickens * 0.6, totalChickens * 0.8, totalChickens]} color="#10b981" />
        </div>

        <div className="animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-4 hover:shadow-lg hover:border-[var(--color-brand)]/30 transition-all duration-300 group" style={{ opacity: 0, animationDelay: '0.05s', animationFillMode: 'forwards' }}>
          <div className="w-9 h-9 bg-[var(--color-brand)]/10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-4 h-4 text-[var(--color-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{(totalValue / 1000).toFixed(0)}K</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Investissement (DH)</p>
          <MiniChart data={[0, totalValue * 0.3, totalValue * 0.5, totalValue * 0.7, totalValue]} color="#C84630" />
        </div>

        <div className="animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-4 hover:shadow-lg hover:border-sky-400/30 transition-all duration-300 group" style={{ opacity: 0, animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{occupancyRate}%</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Taux Occupation</p>
            </div>
            <div className="relative">
              <CircularProgress value={occupancyRate} color="#38bdf8" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-sky-500">{occupancyRate}%</span>
            </div>
          </div>
        </div>

        <div className="animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-4 hover:shadow-lg hover:border-teal-400/30 transition-all duration-300 group" style={{ opacity: 0, animationDelay: '0.15s', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">{data?.batches.length || 0}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Total Lots</p>
            </div>
            <div className="relative">
              <CircularProgress value={data?.batches.length ? (activeBatches.length / data.batches.length) * 100 : 0} color="#2dd4bf" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-teal-500">{activeBatches.length}/{data?.batches.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ ROW 3: QUICK ACCESS + RECENT BATCHES + STOCK side by side ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Quick Access — 2 cols */}
        <div className="lg:col-span-2 animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-4" style={{ opacity: 0, animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <h2 className="text-sm font-bold text-[var(--color-text-primary)] mb-3">Acces Rapide</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickAccessLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-br ${link.gradient} text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}>
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} /></svg>
                <span className="text-xs font-medium">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Batches — 5 cols */}
        <div className="lg:col-span-5 animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-4" style={{ opacity: 0, animationDelay: '0.15s', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Derniers Lots</h2>
            <Link href="/dashboard/admin/batches" className="text-xs text-[var(--color-primary)] hover:underline">Voir tout</Link>
          </div>
          {data && data.batches.length > 0 ? (
            <div className="space-y-2">
              {data.batches.slice(0, 5).map((batch) => {
                const statusColors: Record<string, string> = { Active: 'bg-emerald-100 text-emerald-600', Completed: 'bg-amber-100 text-amber-600', Cancelled: 'bg-gray-100 text-gray-600' };
                const statusLabels: Record<string, string> = { Active: 'Actif', Completed: 'Termine', Cancelled: 'Annule' };
                const daysSince = Math.floor((Date.now() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={batch.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-[var(--color-text-primary)] truncate text-sm">{batch.batchNumber}</p>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${statusColors[batch.status] || ''}`}>{statusLabels[batch.status] || batch.status}</span>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">{batch.strain} - {batch.chickenCount.toLocaleString()} pcs - {batch.buildingName || 'N/A'}</p>
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">J{daysSince}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-[var(--color-text-muted)]">
              <p className="text-sm">Aucun lot enregistre</p>
              <Link href="/dashboard/admin/batches" className="text-xs text-[var(--color-primary)] hover:underline mt-1 inline-block">Creer un lot</Link>
            </div>
          )}
        </div>

        {/* Stock + Farm image stacked — 5 cols */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-4 flex-1" style={{ opacity: 0, animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">Resume Stock</h2>
              <Link href="/dashboard/admin/stock" className="text-xs text-[var(--color-primary)] hover:underline">Gerer</Link>
            </div>
            {data && data.stock.length > 0 ? (
              <div className="space-y-2">
                {[
                  { type: 'Feed', label: 'Aliments', color: 'bg-amber-100 text-amber-600', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
                  { type: 'Vaccine', label: 'Vaccins', color: 'bg-rose-100 text-rose-600', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
                  { type: 'Vitamin', label: 'Vitamines', color: 'bg-emerald-100 text-emerald-600', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                ].map(({ type, label, color, icon }) => {
                  const items = data.stock.filter(s => s.type === type);
                  const total = items.reduce((sum, s) => sum + s.quantity, 0);
                  return (
                    <div key={type} className="flex items-center gap-3 p-2.5 bg-[var(--color-surface-2)]/50 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-[var(--color-text-primary)] text-sm">{label}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{items.length} article(s)</p>
                      </div>
                      <p className="text-lg font-bold text-[var(--color-text-primary)]">{total}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-[var(--color-text-muted)]">
                <p className="text-xs">Aucun article en stock</p>
                <Link href="/dashboard/admin/stock" className="text-xs text-[var(--color-primary)] hover:underline mt-1 inline-block">Ajouter du stock</Link>
              </div>
            )}
          </div>

          <div className="animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] overflow-hidden" style={{ opacity: 0, animationDelay: '0.25s', animationFillMode: 'forwards' }}>
            <div className="relative h-36">
              <Image src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80" alt="Ferme avicole" fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex gap-6">
                  <div><p className="text-xl font-bold">{totalBuildings}</p><p className="text-xs text-white/70">Batiments</p></div>
                  <div><p className="text-xl font-bold">{totalStockItems}</p><p className="text-xs text-white/70">Articles stock</p></div>
                  <div><p className="text-xl font-bold">{totalUsers}</p><p className="text-xs text-white/70">Utilisateurs</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ ROW 4: SUPERVISION SECTION ============ */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">Supervision Exploitation</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Alimentation, mortalite et alertes sante — {supervisionDays} derniers jours</p>
        </div>
        <div className="flex gap-1.5">
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => { setSupervisionDays(d); fetchSupervision(d); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${supervisionDays === d ? 'bg-[var(--color-primary)] text-white shadow-md' : 'bg-[var(--color-surface-2)] text-[var(--color-text-body)] hover:bg-[var(--color-surface-3)]'}`}>
              {d}j
            </button>
          ))}
        </div>
      </div>

      {supervisionError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
          <p className="text-amber-700 text-sm font-medium">{supervisionError}</p>
          <button onClick={() => fetchSupervision(supervisionDays)} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors">Reessayer</button>
        </div>
      )}

      {/* ============ ROW 5: SUPERVISION KPIs + BATCH TABLE side by side ============ */}
      {supervision && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

          {/* Supervision KPI cards stacked — 2 cols */}
          <div className="xl:col-span-3 grid grid-cols-2 xl:grid-cols-1 gap-3">
            {[
              { label: 'Mortalite Totale', value: totalMortality, unit: 'poulets', color: 'bg-rose-100 text-rose-600', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', warn: totalMortality > 50 },
              { label: 'Alimentation', value: totalFeeding.toFixed(1), unit: 'kg total', color: 'bg-amber-100 text-amber-600', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', warn: false },
              { label: 'Anomalies', value: abnormalSummaries.length, unit: 'jours anormaux', color: 'bg-orange-100 text-orange-600', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', warn: abnormalSummaries.length > 0 },
              { label: 'Alertes Sante', value: pendingAlerts.length, unit: 'en attente', color: 'bg-purple-100 text-purple-600', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', warn: pendingAlerts.length > 0 },
            ].map((stat, i) => (
              <div key={stat.label} className={`rounded-xl border p-4 transition-all duration-300 ${stat.warn ? 'border-[var(--color-brand)]/40 bg-[var(--color-brand)]/5' : 'border-[var(--color-border)] bg-[var(--color-surface-1)]'}`} style={{ animationDelay: `${0.1 * i}s` }}>
                <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} /></svg>
                </div>
                <p className={`text-xl font-bold ${stat.warn ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-primary)]'}`}>{stat.value}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Batch daily summaries table — 9 cols */}
          {supervision.batchSummaries.length > 0 && (
            <div className="xl:col-span-9 bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Suivi Quotidien par Lot</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{supervision.startDate} — {supervision.endDate}</p>
                </div>
                {abnormalSummaries.length > 0 && (
                  <span className="px-2.5 py-1 bg-[var(--color-brand)]/15 text-[var(--color-brand)] text-xs font-bold rounded-full animate-pulse">{abnormalSummaries.length} anomalie(s)</span>
                )}
              </div>
              <div className="overflow-auto max-h-72">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Lot</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Date</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Aliment.</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Mortalite</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Par</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {supervision.batchSummaries.map((s, i) => (
                      <tr key={i} className={`transition-colors hover:bg-[var(--color-surface-2)]/40 ${s.abnormalConsumption ? 'bg-[var(--color-brand)]/[0.03]' : ''}`}>
                        <td className="px-5 py-2.5 font-semibold text-[var(--color-text-primary)] text-xs">{s.batchNumber}</td>
                        <td className="px-3 py-2.5 text-[var(--color-text-muted)] text-xs">{new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</td>
                        <td className="px-3 py-2.5 text-right text-xs font-medium text-amber-700">{s.totalQuantityEaten.toFixed(1)} kg</td>
                        <td className="px-3 py-2.5 text-right text-xs">
                          {s.mortalityCount > 0 ? <span className="font-semibold text-[var(--color-brand)]">{s.mortalityCount}</span> : <span className="text-emerald-600 font-medium">0</span>}
                        </td>
                        <td className="px-3 py-2.5 text-[var(--color-text-muted)] text-xs truncate max-w-[100px]">{s.recordedByName}</td>
                        <td className="px-3 py-2.5 text-center">
                          {s.abnormalConsumption ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[var(--color-brand)]/15 text-[var(--color-brand)] text-xs font-bold rounded-full">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              Anomalie
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ ROW 6: FCR (Indice de Consommation) ============ */}
      {supervision && fcrSummaries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight">
                ICR — Indice de Consommation
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                FCR cumule par lot actif · seuil alerte 1.8
                {avgFcr != null && (
                  <span className="ml-2 font-semibold">
                    · moy. <span className={avgFcr > 1.8 ? 'text-[var(--color-brand)]' : 'text-emerald-600'}>{avgFcr.toFixed(2)}</span>
                  </span>
                )}
              </p>
            </div>
            {fcrAlertCount > 0 && (
              <span className="px-2.5 py-1 bg-[var(--color-brand)]/15 text-[var(--color-brand)] text-xs font-bold rounded-full animate-pulse">
                {fcrAlertCount} alerte{fcrAlertCount > 1 ? 's' : ''} ICR
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {fcrSummaries.map((fcr) => {
              const colorClasses = fcrColor(fcr.fcrStatus);
              const label = fcrLabel(fcr.fcrStatus);
              return (
                <div
                  key={fcr.batchId}
                  className={`rounded-2xl border p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                    fcr.fcrAlert
                      ? 'border-[var(--color-brand)]/25 bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-brand)]/[0.03]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-1)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-[var(--color-text-primary)] text-sm">{fcr.batchNumber}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{fcr.strain || 'Souche inconnue'} · J{fcr.ageInDays}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${colorClasses}`}>
                      {label}
                    </span>
                  </div>

                  <div className="flex items-end gap-2 mb-3">
                    <span className={`text-3xl font-extrabold tabular-nums leading-none ${
                      fcr.fcrAlert ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-primary)]'
                    }`}>
                      {fcr.cumulativeFcr != null ? fcr.cumulativeFcr.toFixed(2) : '—'}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] mb-1">ICR</span>
                    {fcr.fcrAlert && (
                      <svg className="w-4 h-4 text-[var(--color-brand)] mb-1 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[var(--color-surface-2)]/60 rounded-lg p-2">
                      <p className="text-xs font-bold text-[var(--color-text-primary)] tabular-nums">{fcr.aliveChickens.toLocaleString()}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">vivants</p>
                    </div>
                    <div className="bg-[var(--color-surface-2)]/60 rounded-lg p-2">
                      <p className="text-xs font-bold text-amber-600 tabular-nums">{fcr.totalFeedConsumedKg.toFixed(0)} kg</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">alim. tot.</p>
                    </div>
                    <div className="bg-[var(--color-surface-2)]/60 rounded-lg p-2">
                      <p className="text-xs font-bold text-sky-600 tabular-nums">{fcr.estimatedWeightKg.toFixed(2)} kg</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">poids est.</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ ROW 7: BATCH CHARTS ============ */}
      {supervision && Object.keys(summariesByBatch).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight">Courbes par Lot</h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Alimentation (courbe) et mortalite (barres) — {Object.keys(summariesByBatch).length} lots actifs
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 rounded-full bg-amber-400 inline-block" />
                Alimentation
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[var(--color-brand)] inline-block opacity-60" />
                Mortalite
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Object.entries(summariesByBatch).map(([batchNum, summaries], i) => {
              const feedValues = summaries.map(s => Number(s.totalQuantityEaten));
              const mortValues = summaries.map(s => s.mortalityCount);
              const hasAnomaly = summaries.some(s => s.abnormalConsumption);
              const totalFeed = feedValues.reduce((a, b) => a + b, 0);
              const totalMort = mortValues.reduce((a, b) => a + b, 0);
              const anomalyCount = summaries.filter(s => s.abnormalConsumption).length;
              const batchFcr = fcrSummaries.find(f => f.batchNumber === batchNum);
              return (
                <div
                  key={batchNum}
                  className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                    hasAnomaly
                      ? 'border-[var(--color-brand)]/25 bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-brand)]/[0.03]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-1)]'
                  }`}
                  style={{ animationDelay: `${0.06 * i}s` }}
                >
                  {/* top accent bar */}
                  <div className={`h-0.5 w-full ${hasAnomaly ? 'bg-gradient-to-r from-[var(--color-brand)] to-amber-400' : 'bg-gradient-to-r from-amber-400 to-emerald-400'}`} />

                  <div className="px-4 pt-3 pb-1">
                    {/* header */}
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="font-bold text-[var(--color-text-primary)] text-sm tracking-tight">{batchNum}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{summaries.length} jours de donnees</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasAnomaly && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-[var(--color-brand)]/10 text-[var(--color-brand)] text-xs font-bold rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] animate-pulse inline-block" />
                            {anomalyCount} anomalie{anomalyCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {!hasAnomaly && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-100">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Normal
                          </span>
                        )}
                      </div>
                    </div>

                    {/* stats row */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-amber-500 tabular-nums">{totalFeed.toFixed(0)}</span>
                        <span className="text-xs text-[var(--color-text-muted)] font-medium">kg alim.</span>
                      </div>
                      <div className="w-px h-4 bg-[var(--color-border)]" />
                      <div className="flex items-baseline gap-1">
                        <span className={`text-base font-extrabold tabular-nums ${totalMort > 0 ? 'text-[var(--color-brand)]' : 'text-emerald-500'}`}>{totalMort}</span>
                        <span className="text-xs text-[var(--color-text-muted)] font-medium">mort.</span>
                      </div>
                      <div className="w-px h-4 bg-[var(--color-border)]" />
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs text-[var(--color-text-muted)]">moy.</span>
                        <span className="text-sm font-bold text-[var(--color-text-body)] tabular-nums">
                          {(totalFeed / Math.max(summaries.length, 1)).toFixed(0)}kg
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">/j</span>
                      </div>
                      {batchFcr?.cumulativeFcr != null && (
                        <>
                          <div className="w-px h-4 bg-[var(--color-border)]" />
                          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-bold border ${fcrColor(batchFcr.fcrStatus)}`}>
                            ICR {batchFcr.cumulativeFcr.toFixed(2)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* chart */}
                  <div className="px-2 pb-3">
                    <BatchMiniChart
                      feedValues={feedValues}
                      mortValues={mortValues}
                      hasAnomaly={hasAnomaly}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ ROW 8: HEALTH ALERTS ============ */}
      {supervision && pendingAlerts.length > 0 && (
        <div className="bg-[var(--color-surface-1)] rounded-2xl border border-purple-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-purple-100 bg-gradient-to-r from-purple-500/10 to-transparent flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Alertes Sante en Attente</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Rapports veterinaires necessitant approbation</p>
            </div>
            <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">{pendingAlerts.length}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-border)]">
            {pendingAlerts.map((alert: HealthAlertSummary) => (
              <div key={alert.healthRecordId} className="p-4 hover:bg-[var(--color-surface-2)]/30 transition-colors">
                <div className="flex items-start gap-2 mb-2 flex-wrap">
                  <span className="font-bold text-[var(--color-text-primary)] text-sm">{alert.batchNumber}</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">En attente</span>
                  {alert.treatmentCost && alert.treatmentCost > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">{alert.treatmentCost.toLocaleString()} DH</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-body)] mb-0.5">{alert.diagnosis}</p>
                {alert.treatment && <p className="text-xs text-[var(--color-text-muted)] mb-2">Traitement: {alert.treatment}</p>}
                <div className="flex items-center gap-2 mb-3 text-xs text-[var(--color-text-muted)]">
                  <span>Dr. {alert.veterinarianName}</span>
                  <span>·</span>
                  <span>{new Date(alert.examinationDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(alert.healthRecordId)} disabled={approvingId === alert.healthRecordId || rejectingId === alert.healthRecordId} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
                    {approvingId === alert.healthRecordId ? <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    Approuver
                  </button>
                  <button onClick={() => handleReject(alert.healthRecordId)} disabled={approvingId === alert.healthRecordId || rejectingId === alert.healthRecordId} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[var(--color-surface-2)] text-[var(--color-brand)] text-xs font-semibold rounded-lg hover:bg-[var(--color-brand)]/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 border border-[var(--color-brand)]/20">
                    {rejectingId === alert.healthRecordId ? <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
