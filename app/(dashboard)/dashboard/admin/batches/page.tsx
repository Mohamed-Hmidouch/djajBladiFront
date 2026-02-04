'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  AdminPageShell,
  AdminPanel,
  AdminBentoGrid,
  AdminBentoForm,
  AdminBentoList,
} from '@/components/dashboard/AdminPageShell';

/* ============================================
   STATIC DEMO DATA - Realistic Batch Information
   ============================================ */
const staticBatches = [
  {
    id: 1,
    batchNumber: 'BL-2026-001',
    strain: 'Cobb 500',
    chickenCount: 8500,
    arrivalDate: '2026-01-15',
    purchasePrice: 127500,
    buildingName: 'Batiment Alpha',
    status: 'growing',
    age: 21,
    mortality: 1.2,
    avgWeight: 1.45,
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80',
  },
  {
    id: 2,
    batchNumber: 'BL-2026-002',
    strain: 'Ross 308',
    chickenCount: 7200,
    arrivalDate: '2026-01-22',
    purchasePrice: 108000,
    buildingName: 'Batiment Beta',
    status: 'growing',
    age: 14,
    mortality: 0.8,
    avgWeight: 0.85,
    imageUrl: 'https://images.unsplash.com/photo-1569288063477-0f4f8c26a969?w=800&q=80',
  },
  {
    id: 3,
    batchNumber: 'BL-2025-048',
    strain: 'Cobb 500',
    chickenCount: 9200,
    arrivalDate: '2025-12-01',
    purchasePrice: 138000,
    buildingName: 'Batiment Delta',
    status: 'ready',
    age: 42,
    mortality: 2.1,
    avgWeight: 2.65,
    imageUrl: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=800&q=80',
  },
  {
    id: 4,
    batchNumber: 'BL-2025-047',
    strain: 'Hubbard Classic',
    chickenCount: 0,
    arrivalDate: '2025-11-10',
    purchasePrice: 120000,
    buildingName: 'Batiment Gamma',
    status: 'sold',
    age: 45,
    mortality: 1.8,
    avgWeight: 2.80,
    imageUrl: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&q=80',
  },
];

const statusConfig = {
  growing: { color: 'bg-emerald-500', label: 'En croissance', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  ready: { color: 'bg-amber-500', label: 'Pret a vendre', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
  sold: { color: 'bg-blue-500', label: 'Vendu', icon: 'M5 13l4 4L19 7', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
};

const strainImages: Record<string, string> = {
  'Cobb 500': 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&q=80',
  'Ross 308': 'https://images.unsplash.com/photo-1569288063477-0f4f8c26a969?w=400&q=80',
  'Hubbard Classic': 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?w=400&q=80',
};

export default function AdminBatchesPage() {
  const [expandedBatch, setExpandedBatch] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  /* Calculated Stats */
  const totalChickens = staticBatches.reduce((sum, b) => sum + b.chickenCount, 0);
  const totalValue = staticBatches.reduce((sum, b) => sum + b.purchasePrice, 0);
  const activeBatches = staticBatches.filter(b => b.status !== 'sold').length;
  const avgMortality = staticBatches.filter(b => b.status !== 'sold').reduce((sum, b) => sum + b.mortality, 0) / activeBatches;

  const filteredBatches = filterStatus === 'all' 
    ? staticBatches 
    : staticBatches.filter(b => b.status === filterStatus);

  return (
    <AdminPageShell
      title="Gestion des Lots"
      subtitle="Suivez vos lots de poussins depuis leur arrivee jusqu'a la vente. Visualisez la croissance, la mortalite et les performances."
      accent="batches"
    >
      {/* ==========================================
          STATS OVERVIEW
          ========================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Lots Actifs', value: activeBatches, gradient: 'from-emerald-500 to-emerald-600', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
          { label: 'Total Poussins', value: totalChickens.toLocaleString(), gradient: 'from-[var(--color-primary)] to-[#2d4a6f]', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Valeur Stock', value: `${(totalValue / 1000).toFixed(0)}K DH`, gradient: 'from-[var(--color-brand)] to-[#e85d4a]', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Mortalite Moy.', value: `${avgMortality.toFixed(1)}%`, gradient: 'from-violet-500 to-purple-600', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className={`animate-slideUp stagger-${index + 1} bg-gradient-to-br ${stat.gradient} rounded-2xl p-5 text-white shadow-lg card-lift`}
            style={{ opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl lg:text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminBentoGrid>
        {/* ==========================================
            ADD BATCH FORM
            ========================================== */}
        <AdminBentoForm>
          <AdminPanel
            title="Nouveau Lot"
            description="Enregistrer un nouveau lot de poussins"
            accent="batches"
          >
            <div className="space-y-5 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
              {/* Strain Preview */}
              <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100">
                <Image
                  src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80"
                  alt="Poussins"
                  fill
                  className="object-cover opacity-60"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent" />
                <div className="absolute bottom-3 left-4 text-white">
                  <p className="text-xs font-medium text-white/80">Souche selectionnee</p>
                  <p className="text-lg font-bold">Cobb 500</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Numero de lot
                  </label>
                  <input
                    type="text"
                    placeholder="BL-2026-003"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Souche
                  </label>
                  <select className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200">
                    <option>Cobb 500</option>
                    <option>Ross 308</option>
                    <option>Hubbard Classic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Nombre de poussins
                  </label>
                  <input
                    type="number"
                    placeholder="5000"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Date d&apos;arrivee
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Prix d&apos;achat (DH)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="75000"
                    className="w-full px-4 py-3 pr-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] font-medium">
                    DH
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Batiment
                </label>
                <select className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200">
                  <option value="">Selectionner un batiment</option>
                  <option>Batiment Alpha (3500 places)</option>
                  <option>Batiment Beta (800 places)</option>
                  <option>Batiment Gamma (15000 places)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-6 py-3.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-500/25">
                  Enregistrer le lot
                </button>
                <button className="px-6 py-3.5 border-2 border-[var(--color-border)] text-[var(--color-text-body)] font-semibold rounded-xl hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all duration-200">
                  Annuler
                </button>
              </div>
            </div>
          </AdminPanel>
        </AdminBentoForm>

        {/* ==========================================
            BATCHES LIST
            ========================================== */}
        <AdminBentoList>
          <AdminPanel
            title="Tous les Lots"
            description="Vue d'ensemble de vos lots"
            accent="batches"
          >
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 animate-fadeIn overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'Tous', count: staticBatches.length },
                { key: 'growing', label: 'En croissance', count: staticBatches.filter(b => b.status === 'growing').length },
                { key: 'ready', label: 'Prets', count: staticBatches.filter(b => b.status === 'ready').length },
                { key: 'sold', label: 'Vendus', count: staticBatches.filter(b => b.status === 'sold').length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                    filterStatus === tab.key
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-body)] hover:bg-[var(--color-surface-3)]'
                  }`}
                >
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filterStatus === tab.key ? 'bg-white/20' : 'bg-[var(--color-surface-3)]'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Batches Cards */}
            <div className="space-y-4">
              {filteredBatches.map((batch, index) => (
                <article
                  key={batch.id}
                  className={`animate-slideUp rounded-2xl border overflow-hidden transition-all duration-300 ease-out ${
                    expandedBatch === batch.id
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl'
                      : 'border-[var(--color-border)] hover:border-emerald-500/40 hover:shadow-lg'
                  }`}
                  style={{ 
                    opacity: 0, 
                    animationDelay: `${0.1 + index * 0.05}s`,
                    animationFillMode: 'forwards'
                  }}
                >
                  {/* Main Content */}
                  <div 
                    className="flex items-center gap-4 p-4 bg-[var(--color-surface-1)] cursor-pointer"
                    onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                  >
                    {/* Batch Image */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={batch.imageUrl}
                        alt={batch.strain}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-[#8B4513]/[0.03] pointer-events-none" />
                    </div>

                    {/* Batch Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[var(--color-text-primary)]">{batch.batchNumber}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig[batch.status as keyof typeof statusConfig].textColor} ${statusConfig[batch.status as keyof typeof statusConfig].bgColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[batch.status as keyof typeof statusConfig].color} animate-pulseSoft`} />
                          {statusConfig[batch.status as keyof typeof statusConfig].label}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {batch.strain} - {batch.chickenCount.toLocaleString()} poussins
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {batch.buildingName} - Jour {batch.age}
                      </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-lg font-bold text-[var(--color-text-primary)]">{batch.avgWeight}kg</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Poids moy.</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-[var(--color-brand)]">{batch.mortality}%</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Mortalite</p>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className={`w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center transition-transform duration-300 ${expandedBatch === batch.id ? 'rotate-180' : ''}`}>
                      <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <div className={`overflow-hidden transition-all duration-300 ease-out ${expandedBatch === batch.id ? 'max-h-80' : 'max-h-0'}`}>
                    <div className="p-4 pt-0 bg-[var(--color-surface-1)] border-t border-[var(--color-border)]">
                      {/* Growth Timeline */}
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Progression de croissance</p>
                        <div className="relative">
                          <div className="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                              style={{ width: `${Math.min((batch.age / 45) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-[var(--color-text-muted)]">
                            <span>Jour 0</span>
                            <span>Jour 21</span>
                            <span>Jour 35</span>
                            <span>Jour 45</span>
                          </div>
                        </div>
                      </div>

                      {/* Detail Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-[var(--color-surface-2)] rounded-xl p-3 text-center">
                          <p className="text-xs text-[var(--color-text-muted)] mb-1">Arrive le</p>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {new Date(batch.arrivalDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <div className="bg-[var(--color-surface-2)] rounded-xl p-3 text-center">
                          <p className="text-xs text-[var(--color-text-muted)] mb-1">Prix d&apos;achat</p>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {(batch.purchasePrice / 1000).toFixed(0)}K DH
                          </p>
                        </div>
                        <div className="bg-[var(--color-surface-2)] rounded-xl p-3 text-center">
                          <p className="text-xs text-[var(--color-text-muted)] mb-1">Cout/poussin</p>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {(batch.purchasePrice / (batch.chickenCount || 1)).toFixed(2)} DH
                          </p>
                        </div>
                        <div className="bg-[var(--color-surface-2)] rounded-xl p-3 text-center">
                          <p className="text-xs text-[var(--color-text-muted)] mb-1">Pertes</p>
                          <p className="text-sm font-semibold text-[var(--color-brand)]">
                            {Math.round(batch.chickenCount * (batch.mortality / 100))}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <button className="flex-1 px-4 py-2 text-sm font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors">
                          Voir details
                        </button>
                        <button className="flex-1 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                          Ajouter pesee
                        </button>
                        {batch.status === 'ready' && (
                          <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[var(--color-brand)] rounded-lg hover:bg-[var(--color-brand-hover)] transition-colors">
                            Vendre
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </AdminPanel>
        </AdminBentoList>
      </AdminBentoGrid>
    </AdminPageShell>
  );
}
