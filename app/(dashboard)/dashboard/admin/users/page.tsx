'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '@/lib/jwt';
import { getUsers, createUser } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type { UserResponse } from '@/types/auth';
import type { AdminCreateUserRequest } from '@/types/admin';
import {
  AdminPageShell,
  AdminPanel,
  AdminBentoGrid,
  AdminBentoForm,
  AdminBentoList,
  Pagination,
} from '@/components/dashboard';

const roleConfig = {
  Admin: {
    color: 'bg-[var(--color-primary)]',
    bgLight: 'bg-[var(--color-primary)]/10',
    textColor: 'text-[var(--color-primary)]',
    gradient: 'from-[var(--color-primary)] to-[#2d4a6f]',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  Veterinaire: {
    color: 'bg-emerald-500',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    gradient: 'from-emerald-500 to-emerald-600',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
  Ouvrier: {
    color: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-700',
    gradient: 'from-amber-500 to-amber-600',
    icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  Client: {
    color: 'bg-violet-500',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-700',
    gradient: 'from-violet-500 to-purple-600',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
};

function UserAvatar({ fullName, role, size = 'md' }: { fullName: string; role: string; size?: 'sm' | 'md' | 'lg' }) {
  const parts = fullName.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
      : fullName.slice(0, 2).toUpperCase();
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.Client;
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-lg' };
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${config.gradient} text-white font-bold flex items-center justify-center shadow-lg`}>
      {initials}
    </div>
  );
}

const initialForm: AdminCreateUserRequest = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phoneNumber: '',
  role: 'Ouvrier',
};

const PAGE_SIZE = 5;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [form, setForm] = useState<AdminCreateUserRequest>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async (targetPage: number) => {
    const token = getToken();
    if (!token) return;
    try {
      setError(null);
      const data = await getUsers(token, targetPage, PAGE_SIZE);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(0);
  }, [fetchUsers]);

  function handlePageChange(newPage: number) {
    setPageLoading(true);
    fetchUsers(newPage);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createUser(token, form);
      setForm(initialForm);
      await fetchUsers(page);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erreur lors de la creation');
    } finally {
      setSubmitting(false);
    }
  }

  const activeUsers = users.filter((u) => u.isActive).length;
  const roleDistribution = {
    Admin: users.filter((u) => u.role === 'Admin').length,
    Veterinaire: users.filter((u) => u.role === 'Veterinaire').length,
    Ouvrier: users.filter((u) => u.role === 'Ouvrier').length,
    Client: users.filter((u) => u.role === 'Client').length,
  };

  const filteredUsers = filterRole ? users.filter((u) => u.role === filterRole) : users;

  const formatLastLogin = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return 'En ligne';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <AdminPageShell title="Gestion de l'Equipe" subtitle="Chargement..." accent="brand">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin w-10 h-10 border-4 border-[var(--color-brand)] border-t-transparent rounded-full" />
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell title="Gestion de l'Equipe" subtitle="" accent="brand">
        <div className="bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl p-6 text-center">
          <p className="text-[var(--color-brand)] font-semibold mb-2">Erreur</p>
          <p className="text-[var(--color-text-muted)] text-sm">{error}</p>
          <button onClick={() => fetchUsers(0)} className="mt-4 px-4 py-2 bg-[var(--color-brand)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-brand-hover)] transition-colors">
            Reessayer
          </button>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title="Gestion de l'Equipe" subtitle="Gerez les comptes utilisateurs, les roles et les permissions de votre equipe." accent="brand">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="animate-slideUp stagger-1 bg-gradient-to-br from-[var(--color-brand)] to-[#e85d4a] rounded-2xl p-5 text-white shadow-lg card-lift" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Total Membres</p>
              <p className="text-3xl font-bold mt-1">{totalElements}</p>
            </div>
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>
        </div>
        <div className="animate-slideUp stagger-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg card-lift" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Actifs (page)</p>
              <p className="text-3xl font-bold mt-1">{activeUsers}</p>
            </div>
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>
        <div className="animate-slideUp stagger-3 bg-gradient-to-br from-[var(--color-primary)] to-[#2d4a6f] rounded-2xl p-5 text-white shadow-lg card-lift" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Administrateurs</p>
              <p className="text-3xl font-bold mt-1">{roleDistribution.Admin}</p>
            </div>
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
          </div>
        </div>
        <div className="animate-slideUp stagger-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg card-lift" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Clients</p>
              <p className="text-3xl font-bold mt-1">{roleDistribution.Client}</p>
            </div>
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
          </div>
        </div>
      </div>

      <AdminBentoGrid>
        <AdminBentoForm>
          <AdminPanel title="Nouvel Utilisateur" description="Creer un compte pour un membre de l'equipe" accent="brand">
            <form onSubmit={handleSubmit} className="space-y-5 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
              {formError && (
                <div className="p-3 bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl text-sm text-[var(--color-brand)]">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Admin', 'Veterinaire', 'Ouvrier', 'Client'] as const).map((role) => {
                    const config = roleConfig[role];
                    const selected = form.role === role;
                    return (
                      <button key={role} type="button" onClick={() => setForm((f) => ({ ...f, role }))} className={`p-3 rounded-xl border-2 transition-all duration-200 ${config.bgLight} ${selected ? `border-current ${config.textColor} shadow-md` : 'border-transparent'} hover:border-current hover:shadow-md active:scale-[0.98]`}>
                        <svg className={`w-6 h-6 mx-auto mb-1 ${config.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} /></svg>
                        <p className={`text-xs font-medium ${config.textColor}`}>{role}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Prenom</label>
                  <input type="text" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="Mohamed" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Nom</label>
                  <input type="text" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Alaoui" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] transition-all duration-200" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Email</label>
                <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@djajbladi.ma" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] transition-all duration-200" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Telephone</label>
                <input type="tel" value={form.phoneNumber || ''} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} placeholder="+212600000000" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] transition-all duration-200" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Mot de passe</label>
                <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 8 caracteres" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/20 focus:border-[var(--color-brand)] transition-all duration-200" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-6 py-3.5 bg-[var(--color-brand)] text-white font-semibold rounded-xl hover:bg-[var(--color-brand-hover)] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[var(--color-brand)]/25 disabled:opacity-50">
                  {submitting ? 'Creation...' : "Creer l'utilisateur"}
                </button>
                <button type="button" onClick={() => { setForm(initialForm); setFormError(null); }} className="px-6 py-3.5 border-2 border-[var(--color-border)] text-[var(--color-text-body)] font-semibold rounded-xl hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all duration-200">
                  Annuler
                </button>
              </div>
            </form>
          </AdminPanel>
        </AdminBentoForm>

        <AdminBentoList>
          <AdminPanel title="Membres de l'Equipe" description="Tous les utilisateurs du systeme" accent="brand">
            <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fadeIn">
              <div className="flex gap-1 p-1 bg-[var(--color-surface-2)] rounded-lg overflow-x-auto">
                {[
                  { key: null, label: 'Tous' },
                  { key: 'Admin', label: 'Admins' },
                  { key: 'Veterinaire', label: 'Vets' },
                  { key: 'Ouvrier', label: 'Ouvriers' },
                  { key: 'Client', label: 'Clients' },
                ].map((tab) => (
                  <button key={tab.key || 'all'} onClick={() => setFilterRole(tab.key)} className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${filterRole === tab.key ? 'bg-white shadow-sm text-[var(--color-brand)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 p-1 bg-[var(--color-surface-2)] rounded-lg ml-auto">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-white shadow-sm text-[var(--color-brand)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-white shadow-sm text-[var(--color-brand)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>
            </div>

            {pageLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-[var(--color-brand)] border-t-transparent rounded-full" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-text-muted)]">
                <p className="text-lg font-medium">Aucun utilisateur trouve</p>
                <p className="text-sm mt-1">Creez un utilisateur via le formulaire</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
                {filteredUsers.map((user, index) => {
                  const config = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.Client;
                  return viewMode === 'grid' ? (
                    <article key={user.id} onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)} className={`animate-slideUp group cursor-pointer rounded-2xl border overflow-hidden transition-all duration-300 ease-out ${selectedUser === user.id ? 'border-[var(--color-brand)] ring-2 ring-[var(--color-brand)]/20 shadow-xl' : 'border-[var(--color-border)] hover:border-[var(--color-brand)]/40 hover:shadow-lg'}`} style={{ opacity: 0, animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: 'forwards' }}>
                      <div className="p-5 bg-[var(--color-surface-1)]">
                        <div className="flex items-start gap-4 mb-4">
                          <UserAvatar fullName={user.fullName} role={user.role} />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-brand)] transition-colors">{user.fullName}</h3>
                            <p className="text-sm text-[var(--color-text-muted)] truncate">{user.email}</p>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulseSoft' : 'bg-gray-300'}`} title={user.isActive ? 'Actif' : 'Inactif'} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${config.bgLight} ${config.textColor}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} /></svg>
                            {user.role}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">{formatLastLogin(user.lastLoginAt)}</span>
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${selectedUser === user.id ? 'max-h-40 mt-4 pt-4 border-t border-[var(--color-border)]' : 'max-h-0'}`}>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              {user.phoneNumber || 'Non renseigne'}
                            </div>
                            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ) : (
                    <article key={user.id} className={`animate-slideUp flex items-center gap-4 p-4 rounded-xl border bg-[var(--color-surface-1)] transition-all duration-300 ${selectedUser === user.id ? 'border-[var(--color-brand)] shadow-lg' : 'border-[var(--color-border)] hover:border-[var(--color-brand)]/40 hover:shadow-md'}`} style={{ opacity: 0, animationDelay: `${0.05 + index * 0.03}s`, animationFillMode: 'forwards' }}>
                      <UserAvatar fullName={user.fullName} role={user.role} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[var(--color-text-primary)] truncate">{user.fullName}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${config.bgLight} ${config.textColor}`}>{user.role}</span>
                          <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)] truncate">{user.email}</p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <p className="text-sm text-[var(--color-text-muted)]">{formatLastLogin(user.lastLoginAt)}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              size={PAGE_SIZE}
              onPageChange={handlePageChange}
              loading={pageLoading}
            />
          </AdminPanel>
        </AdminBentoList>
      </AdminBentoGrid>
    </AdminPageShell>
  );
}
