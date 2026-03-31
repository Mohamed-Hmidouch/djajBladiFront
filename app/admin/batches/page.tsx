'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '@/lib/jwt';
import { getBatches, createBatch, getAllBatchesFlat, getBuildings, validateBatchCapacity, getOuvrierUsers, updateBatch } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import type { BatchResponse, CreateBatchRequest, BuildingResponse, BatchStatus, UpdateBatchRequest } from '@/types/admin';
import type { UserResponse } from '@/types/auth';
import {
  AdminPageShell,
  AdminPanel,
  AdminBentoGrid,
  AdminBentoForm,
  AdminBentoList,
  Pagination,
} from '@/components/dashboard';

const statusConfig: Record<BatchStatus, { color: string; label: string; textColor: string; bgColor: string }> = {
  Active: { color: 'bg-emerald-500', label: 'Actif', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  Completed: { color: 'bg-amber-500', label: 'Termine', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
  Cancelled: { color: 'bg-gray-500', label: 'Annule', textColor: 'text-gray-700', bgColor: 'bg-gray-50' },
  ACTIVE: { color: 'bg-emerald-500', label: 'Actif', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  COMPLETED: { color: 'bg-amber-500', label: 'Termine', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
  CANCELLED: { color: 'bg-gray-500', label: 'Annule', textColor: 'text-gray-700', bgColor: 'bg-gray-50' },
  SOLD: { color: 'bg-blue-500', label: 'Vendu', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  READY_FOR_SALE: { color: 'bg-violet-500', label: 'Pret vente', textColor: 'text-violet-700', bgColor: 'bg-violet-50' },
};

const initialForm: CreateBatchRequest = {
  batchNumber: '',
  strain: 'Cobb 500',
  chickenCount: 0,
  arrivalDate: '',
  purchasePrice: 0,
  buildingId: undefined,
  assignedToId: undefined,
  notes: '',
};

const PAGE_SIZE = 5;

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [buildings, setBuildings] = useState<BuildingResponse[]>([]);
  const [ouvriers, setOuvriers] = useState<UserResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeBatchesCount, setActiveBatchesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [form, setForm] = useState<CreateBatchRequest>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingBatch, setEditingBatch] = useState<BatchResponse | null>(null);
  const [editForm, setEditForm] = useState<UpdateBatchRequest | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  function handleEditClick(e: React.MouseEvent, batch: BatchResponse) {
    e.stopPropagation();
    setEditingBatch(batch);
    setEditForm({
      batchNumber: batch.batchNumber,
      strain: batch.strain,
      chickenCount: batch.chickenCount,
      arrivalDate: batch.arrivalDate,
      purchasePrice: batch.purchasePrice,
      status: batch.status,
      buildingId: batch.buildingId || undefined,
      notes: batch.notes || '',
      assignedToId: batch.assignedToId || undefined,
    });
    setEditError(null);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm || !editingBatch) return;
    const token = getToken();
    if (!token) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      await updateBatch(token, editingBatch.id, editForm);
      setEditingBatch(null);
      setEditForm(null);
      await fetchData(page);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Erreur lors de la modification du lot.');
    } finally {
      setEditSubmitting(false);
    }
  }

  const fetchData = useCallback(async (targetPage: number) => {
    const token = getToken();
    if (!token) return;
    try {
      setError(null);
      const [batchesPage, buildingsPage, ouvriersList] = await Promise.all([
        getBatches(token, targetPage, PAGE_SIZE),
        getBuildings(token, 0, 1000),
        getOuvrierUsers(token),
      ]);
      setBatches(batchesPage.content);
      setTotalPages(batchesPage.totalPages);
      setTotalElements(batchesPage.totalElements);
      setPage(batchesPage.page);
      setBuildings(buildingsPage.content);
      setOuvriers(ouvriersList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors du chargement des lots');
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    getAllBatchesFlat(token).then((all) => {
      setActiveBatchesCount(all.filter((b) => b.status === 'Active').length);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData(0);
  }, [fetchData]);

  function handlePageChange(newPage: number) {
    setPageLoading(true);
    fetchData(newPage);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    setFormError(null);
    try {
      if (form.buildingId) {
        await validateBatchCapacity(token, form.buildingId, form.chickenCount);
      }
      await createBatch(token, {
        batchNumber: form.batchNumber,
        strain: form.strain,
        chickenCount: form.chickenCount,
        arrivalDate: form.arrivalDate,
        purchasePrice: form.purchasePrice,
        buildingId: form.buildingId || undefined,
        assignedToId: form.assignedToId,
        notes: form.notes || undefined,
      });
      setForm(initialForm);
      await fetchData(page);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erreur lors de la création du lot.');
    } finally {
      setSubmitting(false);
    }
  }

  const activeBatchesOnPage = batches.filter((b) => b.status === 'Active');
  const totalChickensOnPage = activeBatchesOnPage.reduce((sum, b) => sum + b.chickenCount, 0);
  const totalValueOnPage = batches.reduce((sum, b) => sum + b.purchasePrice, 0);

  const filteredBatches = filterStatus === 'all' ? batches : batches.filter((b) => b.status === filterStatus);

  const getDaysSinceArrival = (arrivalDate: string) => {
    const arrival = new Date(arrivalDate);
    const now = new Date();
    return Math.floor((now.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <AdminPageShell title="Gestion des Lots" subtitle="Chargement..." accent="batches">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </AdminPageShell>
    );
  }

  if (error) {
    return (
      <AdminPageShell title="Gestion des Lots" subtitle="" accent="batches">
        <div className="bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl p-6 text-center">
          <p className="text-[var(--color-brand)] font-semibold mb-2">Erreur</p>
          <p className="text-[var(--color-text-muted)] text-sm">{error}</p>
          <button onClick={() => fetchData(0)} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
            Reessayer
          </button>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title="Gestion des Lots"
      subtitle="Suivez vos lots de poussins depuis leur arrivee jusqu'a la vente. Visualisez la croissance et les performances."
      accent="batches"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Lots Actifs', value: activeBatchesCount, gradient: 'from-emerald-500 to-emerald-600', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
          { label: 'Poussins (page)', value: totalChickensOnPage.toLocaleString(), gradient: 'from-[var(--color-primary)] to-[#2d4a6f]', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Valeur (page)', value: `${(totalValueOnPage / 1000).toFixed(0)}K DH`, gradient: 'from-[var(--color-brand)] to-[#e85d4a]', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Total Lots', value: totalElements, gradient: 'from-violet-500 to-purple-600', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
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
          <AdminPanel title="Nouveau Lot" description="Enregistrer un nouveau lot de poussins" accent="batches">
            <form onSubmit={handleSubmit} className="space-y-5 animate-slideInLeft" style={{ animationDelay: '0.2s' }}>
              {formError && (
                <div className="p-3 bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl text-sm text-[var(--color-brand)]">{formError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Numero de lot</label>
                  <input type="text" required value={form.batchNumber} onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))} placeholder="BL-2026-003" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Souche</label>
                  <select value={form.strain} onChange={(e) => setForm((f) => ({ ...f, strain: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200">
                    <option>Cobb 500</option>
                    <option>Ross 308</option>
                    <option>Hubbard Classic</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Nombre de poussins</label>
                  <input type="number" required min={1} value={form.chickenCount || ''} onChange={(e) => setForm((f) => ({ ...f, chickenCount: parseInt(e.target.value) || 0 }))} placeholder="5000" className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Date d&apos;arrivee</label>
                  <input type="date" required value={form.arrivalDate} onChange={(e) => setForm((f) => ({ ...f, arrivalDate: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Prix d&apos;achat (DH)</label>
                <div className="relative">
                  <input type="number" required min={0} value={form.purchasePrice || ''} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: parseFloat(e.target.value) || 0 }))} placeholder="75000" className="w-full px-4 py-3 pr-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)] font-medium">DH</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Batiment</label>
                <select value={form.buildingId || ''} onChange={(e) => setForm((f) => ({ ...f, buildingId: e.target.value ? parseInt(e.target.value) : undefined }))} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200">
                  <option value="">Selectionner un batiment</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.maxCapacity} places)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Ouvrier responsable</label>
                <select required value={form.assignedToId || ''} onChange={(e) => setForm((f) => ({ ...f, assignedToId: e.target.value ? parseInt(e.target.value) : undefined }))} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200">
                  <option value="">Selectionner un ouvrier</option>
                  {ouvriers.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Notes</label>
                <textarea value={form.notes || ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes optionnelles..." rows={2} className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-6 py-3.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-50">
                  {submitting ? 'Enregistrement...' : 'Enregistrer le lot'}
                </button>
                <button type="button" onClick={() => { setForm(initialForm); setFormError(null); }} className="px-6 py-3.5 border-2 border-[var(--color-border)] text-[var(--color-text-body)] font-semibold rounded-xl hover:bg-[var(--color-surface-2)] active:scale-[0.98] transition-all duration-200">
                  Annuler
                </button>
              </div>
            </form>
          </AdminPanel>
        </AdminBentoForm>

        <AdminBentoList>
          <AdminPanel title="Tous les Lots" description="Vue d'ensemble de vos lots" accent="batches">
            <div className="flex gap-2 mb-6 animate-fadeIn overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'Tous', count: totalElements },
                { key: 'Active', label: 'Actifs', count: activeBatchesCount },
                { key: 'Completed', label: 'Termines', count: batches.filter((b) => b.status === 'Completed').length },
                { key: 'Cancelled', label: 'Annules', count: batches.filter((b) => b.status === 'Cancelled').length },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setFilterStatus(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${filterStatus === tab.key ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-[var(--color-surface-2)] text-[var(--color-text-body)] hover:bg-[var(--color-surface-3)]'}`}>
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterStatus === tab.key ? 'bg-white/20' : 'bg-[var(--color-surface-3)]'}`}>{tab.count}</span>
                </button>
              ))}
            </div>

            {pageLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-text-muted)]">
                <p className="text-lg font-medium">Aucun lot trouve</p>
                <p className="text-sm mt-1">Enregistrez un lot via le formulaire</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBatches.map((batch, index) => {
                  const stConfig = statusConfig[batch.status] || statusConfig.Active;
                  const age = getDaysSinceArrival(batch.arrivalDate);
                  return (
                    <article key={batch.id} className={`animate-slideUp rounded-2xl border overflow-hidden transition-all duration-300 ease-out ${expandedBatch === batch.id ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl' : 'border-[var(--color-border)] hover:border-emerald-500/40 hover:shadow-lg'}`} style={{ opacity: 0, animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: 'forwards' }}>
                      <div className="flex items-center gap-4 p-4 bg-[var(--color-surface-1)] cursor-pointer" onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-[var(--color-text-primary)]">{batch.batchNumber}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${stConfig.textColor} ${stConfig.bgColor}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${stConfig.color}`} />
                              {stConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--color-text-muted)]">{batch.strain} - {batch.chickenCount.toLocaleString()} poussins</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">{batch.buildingName || 'Sans batiment'} - Ouvrier: {batch.assignedToName || 'Non assigne'} - Jour {age}</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                          <div className="text-center">
                            <p className="text-lg font-bold text-[var(--color-text-primary)]">{(batch.purchasePrice / 1000).toFixed(0)}K</p>
                            <p className="text-xs text-[var(--color-text-muted)]">DH</p>
                          </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center transition-transform duration-300 ${expandedBatch === batch.id ? 'rotate-180' : ''}`}>
                          <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                      <div className={`overflow-hidden transition-all duration-300 ease-out ${expandedBatch === batch.id ? 'max-h-[500px]' : 'max-h-0'}`}>
                        <div className="p-4 pt-0 bg-[var(--color-surface-1)] border-t border-[var(--color-border)]">
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Progression de croissance</p>
                            <div className="relative">
                              <div className="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${Math.min((age / 45) * 100, 100)}%` }} />
                              </div>
                              <div className="flex justify-between mt-2 text-xs text-[var(--color-text-muted)]">
                                <span>Jour 0</span><span>Jour 21</span><span>Jour 35</span><span>Jour 45</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-[var(--color-surface-2)] rounded-xl p-3 text-center">
                              <p className="text-xs text-[var(--color-text-muted)] mb-1">Arrive le</p>
                              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{new Date(batch.arrivalDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                            </div>
                            <div className="bg-[var(--color-surface-2)] rounded-xl p-3 text-center">
                              <p className="text-xs text-[var(--color-text-muted)] mb-1">Prix d&apos;achat</p>
                              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{(batch.purchasePrice / 1000).toFixed(0)}K DH</p>
                            </div>
                            <div className="bg-[var(--color-surface-2)] rounded-xl p-3 text-center">
                              <p className="text-xs text-[var(--color-text-muted)] mb-1">Cout/poussin</p>
                              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{(batch.purchasePrice / (batch.chickenCount || 1)).toFixed(2)} DH</p>
                            </div>
                            <div className="bg-[var(--color-surface-2)] rounded-xl p-3 text-center">
                              <p className="text-xs text-[var(--color-text-muted)] mb-1">Age</p>
                              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{age} jours</p>
                            </div>
                          </div>
                          {batch.notes && (
                            <p className="mt-3 text-sm text-[var(--color-text-muted)] italic">Note: {batch.notes}</p>
                          )}
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={(e) => handleEditClick(e, batch)}
                              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-2)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)] transition-colors rounded-lg text-sm font-medium border border-[var(--color-border)]"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Modifier
                            </button>
                          </div>
                        </div>
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
      {/* Edit Modal */}
      {editingBatch && editForm && (
        <div 
          className="modal-overlay" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="edit-batch-modal-title"
          onClick={() => setEditingBatch(null)}
        >
          <div 
            className="modal-panel"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            {/* Header with emerald gradient to match batch theme */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 xl:p-8 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <span 
                      className="text-xs font-bold uppercase tracking-widest text-white/70"
                      style={{ letterSpacing: '0.12em' }}
                    >
                      Modification
                    </span>
                  </div>
                  <h2 
                    id="edit-batch-modal-title" 
                    className="text-xl font-bold text-white"
                  >
                    Mettre a jour le Lot
                  </h2>
                </div>
                <button 
                  onClick={() => setEditingBatch(null)} 
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center flex-shrink-0 mt-1"
                  aria-label="Fermer"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-body pb-8">
              {editError && (
                <div 
                  className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ 
                    background: 'var(--color-action-mortality-bg)', 
                    color: 'var(--color-action-mortality-text)',
                    border: '1px solid var(--color-action-mortality-border)'
                  }}
                >
                  {editError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-field">
                  <label className="form-label">Numero de lot</label>
                  <input type="text" required value={editForm.batchNumber} onChange={(e) => setEditForm({ ...editForm, batchNumber: e.target.value })} className="form-input focus:border-emerald-500 focus:ring-emerald-500/20 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]" />
                </div>
                <div className="form-field">
                  <label className="form-label">Statut</label>
                  <div className="relative">
                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as BatchStatus })} className="form-select focus:border-emerald-500 focus:ring-emerald-500/20 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]">
                      <option value="Active">Actif</option>
                      <option value="Completed">Termine</option>
                      <option value="Cancelled">Annule</option>
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="form-field">
                  <label className="form-label">Souche</label>
                  <div className="relative">
                    <select value={editForm.strain} onChange={(e) => setEditForm({ ...editForm, strain: e.target.value })} className="form-select focus:border-emerald-500 focus:ring-emerald-500/20 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]">
                      <option>Cobb 500</option>
                      <option>Ross 308</option>
                      <option>Hubbard Classic</option>
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Nombre de poussins</label>
                  <input type="number" required min={1} value={editForm.chickenCount} onChange={(e) => setEditForm({ ...editForm, chickenCount: parseInt(e.target.value) || 0 })} className="form-input focus:border-emerald-500 focus:ring-emerald-500/20 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="form-field">
                  <label className="form-label">Date d&apos;arrivee</label>
                  <input type="date" required value={editForm.arrivalDate.split('T')[0]} onChange={(e) => setEditForm({ ...editForm, arrivalDate: e.target.value })} className="form-input focus:border-emerald-500 focus:ring-emerald-500/20 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]" />
                </div>
                <div className="form-field">
                  <label className="form-label">Prix d&apos;achat</label>
                  <input type="number" required min={0} value={editForm.purchasePrice} onChange={(e) => setEditForm({ ...editForm, purchasePrice: parseFloat(e.target.value) || 0 })} className="form-input focus:border-emerald-500 focus:ring-emerald-500/20 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="form-field">
                  <label className="form-label">Batiment</label>
                  <div className="relative">
                    <select value={editForm.buildingId || ''} onChange={(e) => setEditForm({ ...editForm, buildingId: e.target.value ? parseInt(e.target.value) : undefined })} className="form-select focus:border-emerald-500 focus:ring-emerald-500/20 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]">
                      <option value="">Selectionner un batiment</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>{b.name} ({b.maxCapacity} places)</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Ouvrier responsable</label>
                  <div className="relative">
                    <select required value={editForm.assignedToId || ''} onChange={(e) => setEditForm({ ...editForm, assignedToId: e.target.value ? parseInt(e.target.value) : undefined })} className="form-select focus:border-emerald-500 focus:ring-emerald-500/20 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]">
                      <option value="">Selectionner un ouvrier</option>
                      {ouvriers.map((u) => (
                        <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="form-field mt-2">
                <label className="form-label">Notes</label>
                <textarea value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="form-input focus:border-emerald-500 focus:ring-emerald-500/20 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] resize-none" />
              </div>
              
              <div className="flex flex-col gap-3 mt-8">
                <button 
                  type="submit" 
                  disabled={editSubmitting} 
                  className="w-full py-3.5 px-4 rounded-xl border border-transparent text-white font-bold tracking-wide transition-all duration-300 transform shadow-lg hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
                >
                  {editSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enregistrement...
                    </span>
                  ) : (
                    'Enregistrer les modifications'
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditingBatch(null)} 
                  className="btn-modal-cancel"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
