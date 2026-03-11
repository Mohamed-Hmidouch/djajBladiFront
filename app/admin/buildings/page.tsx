'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getToken } from '@/lib/jwt';
import { getBuildings, createBuilding, getAllBatchesFlat } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type { BuildingResponse, CreateBuildingRequest, BatchResponse } from '@/types/admin';
import {
  AdminPageShell,
  AdminPanel,
  AdminBentoGrid,
  AdminBentoForm,
  AdminBentoList,
  Pagination,
} from '@/components/dashboard';

const defaultImage = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80';

interface BuildingWithOccupancy extends BuildingResponse {
  currentOccupancy: number;
}

const initialForm: CreateBuildingRequest = {
  name: '',
  maxCapacity: 0,
  imageUrl: '',
};

const PAGE_SIZE = 5;

export default function AdminBuildingsPage() {
  const [buildings, setBuildings] = useState<BuildingWithOccupancy[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allBatches, setAllBatches] = useState<BatchResponse[]>([]);

  const [form, setForm] = useState<CreateBuildingRequest>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async (targetPage: number) => {
    const token = getToken();
    if (!token) return;
    try {
      setError(null);
      const [buildingsPage, batches] = await Promise.all([
        getBuildings(token, targetPage, PAGE_SIZE),
        allBatches.length === 0 ? getAllBatchesFlat(token) : Promise.resolve(allBatches),
      ]);
      if (allBatches.length === 0) setAllBatches(batches as BatchResponse[]);
      const enriched: BuildingWithOccupancy[] = buildingsPage.content.map((b) => {
        const activeBatches = (batches as BatchResponse[]).filter(
          (batch) => batch.buildingId === b.id && batch.status === 'Active'
        );
        const currentOccupancy = activeBatches.reduce((sum, batch) => sum + batch.chickenCount, 0);
        return { ...b, currentOccupancy };
      });
      setBuildings(enriched);
      setTotalPages(buildingsPage.totalPages);
      setTotalElements(buildingsPage.totalElements);
      setPage(buildingsPage.page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors du chargement des batiments');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  }, [allBatches]);

  useEffect(() => {
    fetchData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePageChange(newPage: number) {
    setPageLoading(true);
    const token = getToken();
    if (!token) return;
    getBuildings(token, newPage, PAGE_SIZE).then((buildingsPage) => {
      const enriched: BuildingWithOccupancy[] = buildingsPage.content.map((b) => {
        const activeBatches = allBatches.filter(
          (batch) => batch.buildingId === b.id && batch.status === 'Active'
        );
        const currentOccupancy = activeBatches.reduce((sum, batch) => sum + batch.chickenCount, 0);
        return { ...b, currentOccupancy };
      });
      setBuildings(enriched);
      setTotalPages(buildingsPage.totalPages);
      setTotalElements(buildingsPage.totalElements);
      setPage(buildingsPage.page);
    }).catch((err) => {
      setError(err instanceof ApiError ? err.message : 'Erreur');
    }).finally(() => {
      setPageLoading(false);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createBuilding(token, {
        name: form.name,
        maxCapacity: form.maxCapacity,
        imageUrl: form.imageUrl || undefined,
      });
      setForm(initialForm);
      setAllBatches([]);
      fetchData(page);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erreur lors de la creation');
    } finally {
      setSubmitting(false);
    }
  }

  const totalCapacity = buildings.reduce((sum, b) => sum + b.maxCapacity, 0);
  const totalOccupancy = buildings.reduce((sum, b) => sum + b.currentOccupancy, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  if (loading) {
    return (
      <AdminPageShell title="Gestion des Batiments" subtitle="Chargement..." accent="primary">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell title="Gestion des Batiments" subtitle="" accent="primary">
        <div className="bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl p-6 text-center">
          <p className="text-[var(--color-brand)] font-semibold mb-2">Erreur</p>
          <p className="text-[var(--color-text-muted)] text-sm">{error}</p>
          <button onClick={() => fetchData(0)} className="mt-4 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors">
            Reessayer
          </button>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title="Gestion des Batiments"
      subtitle="Visualisez et gerez tous vos batiments d'elevage. Surveillez la capacite, l'occupation et l'etat de chaque installation."
      accent="primary"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Batiments', value: totalElements, gradient: 'from-[var(--color-primary)] to-[#2d4a6f]', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          { label: 'Capacite Totale', value: totalCapacity.toLocaleString(), gradient: 'from-emerald-500 to-emerald-600', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { label: 'Occupation', value: totalOccupancy.toLocaleString(), gradient: 'from-[var(--color-brand)] to-[#e85d4a]', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Taux Occupation', value: `${occupancyRate}%`, gradient: 'from-violet-500 to-purple-600', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        ].map((stat, index) => (
          <div key={stat.label} className={`animate-slideUp stagger-${index + 1} bg-gradient-to-br ${stat.gradient} rounded-2xl p-5 text-white shadow-lg card-lift`} style={{ opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl lg:text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} /></svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminBentoGrid>
        <AdminBentoForm>
          <AdminPanel title="Nouveau Batiment" description="Ajouter un nouveau batiment a votre exploitation" accent="primary">
            <form onSubmit={handleSubmit} className="space-y-5 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
              {formError && (
                <div className="p-3 bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl text-sm text-[var(--color-brand)]">{formError}</div>
              )}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface-3)] group cursor-pointer border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-colors duration-300">
                {form.imageUrl ? (
                  <Image src={form.imageUrl} alt="Apercu" fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-7 h-7 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <p className="text-sm text-[var(--color-text-muted)] font-medium">Ajoutez une URL d&apos;image ci-dessous</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Nom du batiment</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Batiment Epsilon" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Capacite maximale</label>
                  <div className="relative">
                    <input type="number" required min={1} value={form.maxCapacity || ''} onChange={(e) => setForm((f) => ({ ...f, maxCapacity: parseInt(e.target.value) || 0 }))} placeholder="10000" className="w-full px-4 py-3 pr-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] font-medium">poussins</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">URL de l&apos;image</label>
                  <input type="url" value={form.imageUrl || ''} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://example.com/batiment.jpg" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all duration-200" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-6 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-hover)] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[var(--color-primary)]/25 disabled:opacity-50">
                  {submitting ? 'Ajout...' : 'Ajouter le batiment'}
                </button>
                <button type="button" onClick={() => { setForm(initialForm); setFormError(null); }} className="px-6 py-3.5 border-2 border-[var(--color-border)] text-[var(--color-text-body)] font-semibold rounded-xl hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all duration-200">
                  Annuler
                </button>
              </div>
            </form>
          </AdminPanel>
        </AdminBentoForm>

        <AdminBentoList>
          <AdminPanel title="Tous les Batiments" description="Cliquez sur un batiment pour voir les details" accent="primary">
            <div className="flex items-center justify-between mb-6 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--color-text-body)]">{totalElements} batiments</span>
              </div>
              <div className="flex gap-1 p-1 bg-[var(--color-surface-2)] rounded-lg">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-white shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-white shadow-sm text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
              </div>
            </div>

            {pageLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
              </div>
            ) : buildings.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-text-muted)]">
                <p className="text-lg font-medium">Aucun batiment</p>
                <p className="text-sm mt-1">Ajoutez votre premier batiment via le formulaire</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'}>
                {buildings.map((building, index) => {
                  const occupancyPct = building.maxCapacity > 0 ? building.currentOccupancy / building.maxCapacity : 0;
                  const imgSrc = building.imageUrl || defaultImage;
                  return (
                    <article key={building.id} onClick={() => setSelectedBuilding(selectedBuilding === building.id ? null : building.id)} className={`animate-slideUp group cursor-pointer rounded-2xl border overflow-hidden transition-all duration-300 ease-out ${selectedBuilding === building.id ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-xl' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-lg'}`} style={{ opacity: 0, animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: 'forwards' }}>
                      {viewMode === 'grid' ? (
                        <>
                          <div className="relative aspect-video overflow-hidden bg-[var(--color-surface-2)]">
                            <Image src={imgSrc} alt={building.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" unoptimized />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />
                            <div className="absolute top-3 right-3 z-10">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${building.currentOccupancy > 0 ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${building.currentOccupancy > 0 ? 'bg-emerald-300 animate-pulseSoft' : 'bg-gray-300'}`} />
                                {building.currentOccupancy > 0 ? 'Actif' : 'Vide'}
                              </span>
                            </div>
                          </div>
                          <div className="p-4 bg-[var(--color-surface-1)]">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-bold text-lg text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">{building.name}</h3>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-[var(--color-text-muted)]">Occupation</span>
                                <span className="font-semibold text-[var(--color-text-primary)]">{building.currentOccupancy.toLocaleString()} / {building.maxCapacity.toLocaleString()}</span>
                              </div>
                              <div className="h-2.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ease-out ${occupancyPct > 0.9 ? 'bg-gradient-to-r from-[var(--color-brand)] to-[#e85d4a]' : occupancyPct > 0.7 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`} style={{ width: `${occupancyPct * 100}%` }} />
                              </div>
                              <p className="text-xs text-[var(--color-text-muted)] mt-2 text-right">{Math.round(occupancyPct * 100)}% de capacite</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-4 p-4 bg-[var(--color-surface-1)]">
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                            <Image src={imgSrc} alt={building.name} fill className="object-cover transition-transform duration-300 group-hover:scale-110" unoptimized />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors">{building.name}</h3>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${building.currentOccupancy > 0 ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                                {building.currentOccupancy > 0 ? 'Actif' : 'Vide'}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--color-text-muted)]">{building.currentOccupancy.toLocaleString()} / {building.maxCapacity.toLocaleString()} poussins</p>
                            <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${occupancyPct * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      )}
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
