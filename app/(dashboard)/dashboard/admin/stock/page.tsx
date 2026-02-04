'use client';

import { useState } from 'react';
import {
  AdminPageShell,
  AdminPanel,
  AdminBentoGrid,
  AdminBentoForm,
  AdminBentoList,
} from '@/components/dashboard/AdminPageShell';

/* ============================================
   STATIC DEMO DATA - Realistic Stock Items
   ============================================ */
const staticStock = [
  // Feed
  { id: 1, type: 'Feed', name: 'Aliment Demarrage', quantity: 850, unit: 'sac', minStock: 200, category: 'feed' },
  { id: 2, type: 'Feed', name: 'Aliment Croissance', quantity: 420, unit: 'sac', minStock: 300, category: 'feed' },
  { id: 3, type: 'Feed', name: 'Aliment Finition', quantity: 180, unit: 'sac', minStock: 250, category: 'feed' },
  // Vaccines
  { id: 4, type: 'Vaccine', name: 'Newcastle', quantity: 45, unit: 'dose', minStock: 20, category: 'vaccine' },
  { id: 5, type: 'Vaccine', name: 'Gumboro', quantity: 12, unit: 'dose', minStock: 15, category: 'vaccine' },
  { id: 6, type: 'Vaccine', name: 'Bronchite', quantity: 38, unit: 'dose', minStock: 10, category: 'vaccine' },
  // Vitamins
  { id: 7, type: 'Vitamin', name: 'Vitamine AD3E', quantity: 25, unit: 'flacon', minStock: 10, category: 'vitamin' },
  { id: 8, type: 'Vitamin', name: 'Electrolytes', quantity: 8, unit: 'sachet', minStock: 15, category: 'vitamin' },
  { id: 9, type: 'Vitamin', name: 'Calcium', quantity: 32, unit: 'kg', minStock: 20, category: 'vitamin' },
];

const typeConfig = {
  Feed: { 
    color: 'amber', 
    gradient: 'from-amber-500 to-amber-600',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
  },
  Vaccine: { 
    color: 'rose', 
    gradient: 'from-rose-500 to-rose-600',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
  },
  Vitamin: { 
    color: 'emerald', 
    gradient: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  },
};

/* Pure CSS Donut Chart Component */
function DonutChart({ data, size = 160 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let accumulated = 0;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        {data.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          const dashArray = `${percentage} ${100 - percentage}`;
          const dashOffset = -accumulated;
          accumulated += percentage;
          
          return (
            <circle
              key={index}
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke={segment.color}
              strokeWidth="3"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{ 
                animation: `donutFill 1s ease-out forwards`,
                animationDelay: `${index * 0.15}s`
              }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{total}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Total</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminStockPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  /* Calculated Stats */
  const feedCount = staticStock.filter(s => s.type === 'Feed').reduce((sum, s) => sum + s.quantity, 0);
  const vaccineCount = staticStock.filter(s => s.type === 'Vaccine').reduce((sum, s) => sum + s.quantity, 0);
  const vitaminCount = staticStock.filter(s => s.type === 'Vitamin').reduce((sum, s) => sum + s.quantity, 0);
  const lowStockItems = staticStock.filter(s => s.quantity < s.minStock);

  const chartData = [
    { label: 'Aliments', value: feedCount, color: '#f59e0b' },
    { label: 'Vaccins', value: vaccineCount, color: '#f43f5e' },
    { label: 'Vitamines', value: vitaminCount, color: '#10b981' },
  ];

  const filteredStock = staticStock.filter(item => {
    const matchesType = !selectedType || item.type === selectedType;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <AdminPageShell
      title="Gestion du Stock"
      subtitle="Gerez votre inventaire d'aliments, vaccins et vitamines. Surveillez les niveaux de stock et les alertes."
      accent="stock"
    >
      {/* ==========================================
          STATS OVERVIEW WITH DONUT CHART
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Donut Chart Card */}
        <div className="animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm" style={{ opacity: 0, animationFillMode: 'forwards' }}>
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Repartition du Stock</h3>
          <div className="flex items-center justify-center">
            <DonutChart data={chartData} size={160} />
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-4 mt-4">
            {chartData.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-[var(--color-text-muted)]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { type: 'Feed', label: 'Aliments', count: feedCount, unit: 'sacs' },
            { type: 'Vaccine', label: 'Vaccins', count: vaccineCount, unit: 'doses' },
            { type: 'Vitamin', label: 'Vitamines', count: vitaminCount, unit: 'unites' },
          ].map((cat, index) => (
            <div
              key={cat.type}
              onClick={() => setSelectedType(selectedType === cat.type ? null : cat.type)}
              className={`animate-slideUp cursor-pointer bg-gradient-to-br ${typeConfig[cat.type as keyof typeof typeConfig].gradient} rounded-2xl p-5 text-white shadow-lg card-lift ${selectedType === cat.type ? 'ring-4 ring-white/30' : ''}`}
              style={{ 
                opacity: 0, 
                animationDelay: `${0.1 + index * 0.1}s`,
                animationFillMode: 'forwards'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeConfig[cat.type as keyof typeof typeConfig].icon} />
                  </svg>
                </div>
                {staticStock.filter(s => s.type === cat.type && s.quantity < s.minStock).length > 0 && (
                  <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
                    Stock bas
                  </span>
                )}
              </div>
              <p className="text-white/70 text-sm font-medium">{cat.label}</p>
              <p className="text-3xl font-bold mt-1">{cat.count}</p>
              <p className="text-white/60 text-sm">{cat.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="animate-fadeIn mb-6 p-4 bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-brand)]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[var(--color-brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[var(--color-brand)]">Alerte Stock Bas</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {lowStockItems.length} article(s) sous le seuil minimum: {lowStockItems.map(i => i.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      <AdminBentoGrid>
        {/* ==========================================
            ADD STOCK FORM
            ========================================== */}
        <AdminBentoForm>
          <AdminPanel
            title="Ajouter au Stock"
            description="Enregistrer un nouvel article ou reapprovisionner"
            accent="stock"
          >
            <div className="space-y-5 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
              {/* Type Selection Cards */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                  Type d&apos;article
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Feed', 'Vaccine', 'Vitamin'] as const).map((type) => (
                    <button
                      key={type}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        typeConfig[type].bgLight
                      } ${typeConfig[type].borderColor} hover:shadow-md active:scale-[0.98]`}
                    >
                      <svg className={`w-6 h-6 mx-auto mb-1 ${typeConfig[type].textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={typeConfig[type].icon} />
                      </svg>
                      <p className={`text-xs font-medium ${typeConfig[type].textColor}`}>
                        {type === 'Feed' ? 'Aliment' : type === 'Vaccine' ? 'Vaccin' : 'Vitamine'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Nom de l&apos;article
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aliment Demarrage"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Quantite
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Unite
                  </label>
                  <select className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200">
                    <option>sac</option>
                    <option>dose</option>
                    <option>flacon</option>
                    <option>kg</option>
                    <option>sachet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Stock minimum (alerte)
                </label>
                <input
                  type="number"
                  placeholder="20"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-6 py-3.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-500/25">
                  Ajouter au stock
                </button>
                <button className="px-6 py-3.5 border-2 border-[var(--color-border)] text-[var(--color-text-body)] font-semibold rounded-xl hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all duration-200">
                  Annuler
                </button>
              </div>
            </div>
          </AdminPanel>
        </AdminBentoForm>

        {/* ==========================================
            STOCK LIST
            ========================================== */}
        <AdminBentoList>
          <AdminPanel
            title="Inventaire Complet"
            description="Tous les articles en stock"
            accent="stock"
          >
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fadeIn">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
                />
              </div>
              <div className="flex gap-1 p-1 bg-[var(--color-surface-2)] rounded-lg">
                {[
                  { key: null, label: 'Tous' },
                  { key: 'Feed', label: 'Aliments' },
                  { key: 'Vaccine', label: 'Vaccins' },
                  { key: 'Vitamin', label: 'Vitamines' },
                ].map((tab) => (
                  <button
                    key={tab.key || 'all'}
                    onClick={() => setSelectedType(tab.key)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      selectedType === tab.key
                        ? 'bg-white shadow-sm text-amber-600'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Items Grid */}
            <div className="space-y-3">
              {filteredStock.map((item, index) => {
                const isLowStock = item.quantity < item.minStock;
                const config = typeConfig[item.type as keyof typeof typeConfig];
                
                return (
                  <div
                    key={item.id}
                    className={`animate-slideUp flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
                      isLowStock 
                        ? 'border-[var(--color-brand)]/30 bg-[var(--color-brand)]/5' 
                        : 'border-[var(--color-border)] bg-[var(--color-surface-1)]'
                    }`}
                    style={{ 
                      opacity: 0, 
                      animationDelay: `${0.05 + index * 0.03}s`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    {/* Type Icon */}
                    <div className={`w-12 h-12 ${config.bgLight} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <svg className={`w-6 h-6 ${config.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.icon} />
                      </svg>
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-[var(--color-text-primary)] truncate">{item.name}</h4>
                        {isLowStock && (
                          <span className="px-2 py-0.5 bg-[var(--color-brand)]/20 text-[var(--color-brand)] text-xs font-semibold rounded-full animate-pulseSoft">
                            Stock bas
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--color-text-muted)]">{item.type}</p>
                    </div>

                    {/* Quantity Bar */}
                    <div className="w-32 hidden sm:block">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--color-text-muted)]">Stock</span>
                        <span className={`font-semibold ${isLowStock ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-primary)]'}`}>
                          {item.quantity}/{item.minStock}
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLowStock 
                              ? 'bg-gradient-to-r from-[var(--color-brand)] to-[#e85d4a]' 
                              : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          }`}
                          style={{ width: `${Math.min((item.quantity / item.minStock) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Quantity Display */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xl font-bold ${isLowStock ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-primary)]'}`}>
                        {item.quantity}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.unit}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                      <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Ajouter">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button className="p-2 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10 rounded-lg transition-colors" title="Retirer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminPanel>
        </AdminBentoList>
      </AdminBentoGrid>
    </AdminPageShell>
  );
}
