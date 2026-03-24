'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken } from '@/lib/jwt';
import {
  createVaccinationProtocol,
  updateVaccinationProtocol,
  deleteVaccinationProtocol,
  getVaccinationProtocolsByStrain,
} from '@/lib/admin';
import { ApiError } from '@/lib/api';
import { AdminPageShell, AdminPanel, AdminBentoGrid, AdminBentoForm, AdminBentoList } from '@/components/dashboard';
import type { VaccinationProtocolResponse, CreateVaccinationProtocolRequest } from '@/types/admin';

const KNOWN_STRAINS = ['Cobb 500', 'Ross 308', 'Hubbard Flex', 'Arbor Acres'];

const initialForm: CreateVaccinationProtocolRequest = {
  strain: '',
  vaccineName: '',
  dayOfLife: 1,
  notes: '',
};

export default function AdminVaccinationProtocolsPage() {
  const [protocols, setProtocols] = useState<VaccinationProtocolResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateVaccinationProtocolRequest>(initialForm);
  const [customStrain, setCustomStrain] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [filterStrain, setFilterStrain] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAll = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      /* Load protocols for each known strain + any filter */
      const strainToFetch = filterStrain || null;
      if (strainToFetch) {
        const data = await getVaccinationProtocolsByStrain(token, strainToFetch);
        setProtocols(data);
      } else {
        /* Fetch all known strains in parallel */
        const results = await Promise.all(
          KNOWN_STRAINS.map((s) => getVaccinationProtocolsByStrain(token, s).catch(() => []))
        );
        const flat = results.flat();
        /* Deduplicate by id */
        const unique = Array.from(new Map(flat.map((p) => [p.id, p])).values());
        unique.sort((a, b) => a.strain.localeCompare(b.strain) || a.dayOfLife - b.dayOfLife);
        setProtocols(unique);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [filterStrain]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const effectiveStrain = form.strain === '__custom__' ? customStrain.trim() : form.strain;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    if (!effectiveStrain) { setFormError('Veuillez indiquer une souche'); return; }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const payload: CreateVaccinationProtocolRequest = {
        ...form,
        strain: effectiveStrain,
        notes: form.notes?.trim() || undefined,
      };
      if (editingId !== null) {
        await updateVaccinationProtocol(token, editingId, payload);
        setFormSuccess('Protocole mis a jour avec succes');
      } else {
        await createVaccinationProtocol(token, payload);
        setFormSuccess('Protocole cree avec succes');
      }
      setForm(initialForm);
      setCustomStrain('');
      setEditingId(null);
      await fetchAll();
      setTimeout(() => setFormSuccess(null), 3000);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(p: VaccinationProtocolResponse) {
    setEditingId(p.id);
    const knownStrain = KNOWN_STRAINS.includes(p.strain);
    setForm({
      strain: knownStrain ? p.strain : '__custom__',
      vaccineName: p.vaccineName,
      dayOfLife: p.dayOfLife,
      notes: p.notes || '',
    });
    if (!knownStrain) setCustomStrain(p.strain);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setCustomStrain('');
    setFormError(null);
  }

  async function handleDelete(id: number) {
    const token = getToken();
    if (!token) return;
    setDeletingId(id);
    try {
      await deleteVaccinationProtocol(token, id);
      await fetchAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  }

  const filteredProtocols = protocols.filter((p) => {
    const q = searchQuery.toLowerCase();
    return !q || p.strain.toLowerCase().includes(q) || p.vaccineName.toLowerCase().includes(q);
  });

  /* Group by strain for display */
  const byStrain = filteredProtocols.reduce<Record<string, VaccinationProtocolResponse[]>>((acc, p) => {
    (acc[p.strain] = acc[p.strain] || []).push(p);
    return acc;
  }, {});

  const strainColors: Record<number, string> = {
    0: 'bg-purple-50 text-purple-700 border-purple-200',
    1: 'bg-blue-50 text-blue-700 border-blue-200',
    2: 'bg-teal-50 text-teal-700 border-teal-200',
    3: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  const strainKeys = Object.keys(byStrain);

  return (
    <AdminPageShell
      title="Protocoles de Vaccination"
      subtitle="Definissez le calendrier vaccinal par souche et jour de vie."
      accent="batches"
    >
      <AdminBentoGrid>
        <AdminBentoForm>
          <AdminPanel
            title={editingId ? 'Modifier le protocole' : 'Nouveau protocole'}
            description="Definir souche, vaccin et jour de vaccination"
            accent="batches"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  {formSuccess}
                </div>
              )}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{formError}</div>
              )}

              {/* Strain */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Souche *</label>
                <select
                  required={form.strain !== '__custom__'}
                  value={form.strain}
                  onChange={(e) => setForm((f) => ({ ...f, strain: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                >
                  <option value="">Selectionner une souche...</option>
                  {KNOWN_STRAINS.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="__custom__">Autre (saisie libre)</option>
                </select>
                {form.strain === '__custom__' && (
                  <input
                    type="text"
                    required
                    value={customStrain}
                    onChange={(e) => setCustomStrain(e.target.value)}
                    placeholder="Ex: Hubbard F15"
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                )}
              </div>

              {/* Vaccine name */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Nom du vaccin *</label>
                <input
                  type="text"
                  required
                  value={form.vaccineName}
                  onChange={(e) => setForm((f) => ({ ...f, vaccineName: e.target.value }))}
                  placeholder="Ex: Newcastle HB1, Gumboro D78..."
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>

              {/* Day of life */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Jour de vie *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={180}
                  value={form.dayOfLife}
                  onChange={(e) => setForm((f) => ({ ...f, dayOfLife: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Age du poussin en jours au moment de la vaccination</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Notes (optionnel)</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Voie d'administration, dose, observations..."
                  className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Sauvegarde...' : editingId ? 'Mettre a jour' : 'Creer le protocole'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-5 py-3.5 border-2 border-[var(--color-border)] text-[var(--color-text-body)] font-semibold rounded-xl hover:bg-[var(--color-surface-2)] transition-all"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </AdminPanel>
        </AdminBentoForm>

        <AdminBentoList>
          <AdminPanel
            title="Protocoles enregistres"
            description={`${protocols.length} protocole${protocols.length > 1 ? 's' : ''}`}
            accent="batches"
          >
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher souche ou vaccin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
              </div>
              <select
                value={filterStrain}
                onChange={(e) => setFilterStrain(e.target.value)}
                className="px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-body)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              >
                <option value="">Toutes les souches</option>
                {KNOWN_STRAINS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredProtocols.length === 0 ? (
              <div className="text-center py-16 text-[var(--color-text-muted)]">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-lg font-medium">Aucun protocole</p>
                <p className="text-sm mt-1">Creez votre premier protocole vaccinal</p>
              </div>
            ) : (
              <div className="space-y-6">
                {strainKeys.map((strain, strainIndex) => (
                  <div key={strain}>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border mb-3 ${strainColors[strainIndex % 4]}`}>
                      {strain}
                    </div>
                    <div className="space-y-2">
                      {byStrain[strain].sort((a, b) => a.dayOfLife - b.dayOfLife).map((p) => (
                        <div key={p.id} className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-1)] hover:shadow-md transition-all">
                          {/* Day badge */}
                          <div className="w-12 h-12 bg-purple-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-purple-100">
                            <span className="text-xs text-purple-500 font-medium leading-none">J</span>
                            <span className="text-lg font-bold text-purple-700 leading-tight">{p.dayOfLife}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--color-text-primary)] truncate">{p.vaccineName}</p>
                            {p.notes && <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{p.notes}</p>}
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                              Par {p.createdByName} &bull; {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => startEdit(p)}
                              className="p-2 text-[var(--color-text-muted)] hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                              title="Modifier"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deletingId === p.id}
                              className="p-2 text-[var(--color-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              title="Supprimer"
                            >
                              {deletingId === p.id ? (
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /></svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminPanel>
        </AdminBentoList>
      </AdminBentoGrid>
    </AdminPageShell>
  );
}
