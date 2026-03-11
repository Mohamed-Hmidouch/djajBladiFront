'use client';

import { useState, useCallback } from 'react';
import type { BatchResponse } from '@/types/admin';
import FeedingQuickModal from './FeedingQuickModal';
import MortalityQuickModal from './MortalityQuickModal';

type ModalState =
  | { type: 'feeding'; batch: BatchResponse }
  | { type: 'mortality'; batch: BatchResponse }
  | null;

interface Props {
  batches: BatchResponse[];
  loading: boolean;
  onActionSuccess?: () => void;
}

/* Skeleton card for loading state */
function BatchCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="animate-stagger animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] overflow-hidden"
      style={{
        opacity: 0,
        animationFillMode: 'forwards',
        animationDelay: `${index * 0.06}s`,
      }}
    >
      {/* Top accent bar */}
      <div className="skeleton h-1 w-full" />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-xl" />
            <div>
              <div className="skeleton h-4 w-24 mb-1.5 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
          </div>
          <div className="skeleton h-5 w-10 rounded-full" />
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton rounded-xl h-14" />
          ))}
        </div>
        {/* Progress bar */}
        <div className="skeleton h-1.5 w-full rounded-full mb-4" />
        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <div className="skeleton h-9 rounded-xl" />
          <div className="skeleton h-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* Empty state */
function EmptyState() {
  return (
    <div
      className="col-span-full flex flex-col items-center justify-center py-16 px-8 text-center animate-fadeIn"
      style={{ opacity: 0, animationFillMode: 'forwards' }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--color-surface-2)' }}
      >
        <svg
          className="w-8 h-8 text-[var(--color-text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1">
        Aucun lot actif
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
        Il n&apos;y a pas de lots actifs pour le moment. Creez un nouveau lot pour demarrer.
      </p>
    </div>
  );
}

/* Single batch card */
function BatchCard({
  batch,
  index,
  onFeed,
  onMortality,
}: {
  batch: BatchResponse;
  index: number;
  onFeed: () => void;
  onMortality: () => void;
}) {
  const daysSince = Math.floor(
    (Date.now() - new Date(batch.arrivalDate).getTime()) / 86400000
  );

  /* Typical broiler cycle is 42 days */
  const CYCLE_DAYS = 42;
  const progressPct = Math.min(100, Math.round((daysSince / CYCLE_DAYS) * 100));

  /* Phase label based on age */
  function getPhaseInfo(days: number): { label: string; color: string; bg: string } {
    if (days <= 7)  return { label: 'Pre-Demarrage', color: '#6366F1', bg: '#EEF2FF' };
    if (days <= 14) return { label: 'Demarrage',     color: '#3B82F6', bg: '#EFF6FF' };
    if (days <= 28) return { label: 'Croissance',    color: '#10B981', bg: '#ECFDF5' };
    if (days <= 42) return { label: 'Finition',      color: '#F59E0B', bg: '#FFFBEB' };
    return              { label: 'Cycle termine',   color: '#6B7280', bg: '#F9FAFB' };
  }

  /* Progress bar color */
  function getProgressColor(pct: number): string {
    if (pct < 35)  return '#6366F1';
    if (pct < 60)  return '#10B981';
    if (pct < 85)  return '#F59E0B';
    return '#C84630';
  }

  const phase = getPhaseInfo(daysSince);
  const progressColor = getProgressColor(progressPct);

  return (
    <div
      className="animate-stagger animate-slideUp bg-[var(--color-surface-1)] rounded-2xl border border-[var(--color-border)] overflow-hidden group card-lift"
      style={{
        opacity: 0,
        animationFillMode: 'forwards',
        animationDelay: `${index * 0.06}s`,
      }}
    >
      {/* Accent top bar */}
      <div
        className="h-1 w-full transition-all duration-500"
        style={{ background: `linear-gradient(90deg, ${progressColor}, ${progressColor}88)` }}
      />

      <div className="p-5">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
              style={{ background: phase.bg }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: phase.color }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h3
                className="font-bold text-[var(--color-text-primary)] truncate"
                style={{ fontSize: '15px' }}
              >
                {batch.batchNumber}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                {batch.strain}
                {batch.buildingName && (
                  <span className="ml-1 opacity-70">— {batch.buildingName}</span>
                )}
              </p>
            </div>
          </div>
          {/* Day badge */}
          <div
            className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{
              background: phase.bg,
              color: phase.color,
              border: `1px solid ${phase.color}30`,
            }}
          >
            J{daysSince}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--color-surface-2)' }}
          >
            <p
              className="font-bold text-[var(--color-text-primary)] tabular-nums"
              style={{ fontSize: '15px', lineHeight: 1.2 }}
            >
              {batch.chickenCount.toLocaleString()}
            </p>
            <p
              className="text-[var(--color-text-muted)] mt-0.5"
              style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}
            >
              Poussins
            </p>
          </div>

          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--color-surface-2)' }}
          >
            <p
              className="font-bold text-[var(--color-text-primary)] tabular-nums"
              style={{ fontSize: '15px', lineHeight: 1.2 }}
            >
              {progressPct}%
            </p>
            <p
              className="text-[var(--color-text-muted)] mt-0.5"
              style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}
            >
              Cycle
            </p>
          </div>

          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--color-surface-2)' }}
          >
            <p
              className="font-bold tabular-nums"
              style={{ fontSize: '15px', lineHeight: 1.2, color: phase.color }}
            >
              {(batch.purchasePrice / 1000).toFixed(0)}K
            </p>
            <p
              className="text-[var(--color-text-muted)] mt-0.5"
              style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}
            >
              DH
            </p>
          </div>
        </div>

        {/* Phase label + Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-xs font-semibold"
              style={{ color: phase.color }}
            >
              {phase.label}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              {daysSince}/{CYCLE_DAYS}j
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: '6px', background: 'var(--color-surface-3)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${progressColor}, ${progressColor}CC)`,
                animation: 'progressFill 0.8s ease-out forwards',
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn-action-feed"
            onClick={onFeed}
            title="Distribuer de l'aliment pour ce lot"
          >
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Aliment
          </button>

          <button
            type="button"
            className="btn-action-mortality"
            onClick={onMortality}
            title="Signaler une mortalite pour ce lot"
          >
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Mortalite
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActiveBatchesGrid({ batches, loading, onActionSuccess }: Props) {
  const [modal, setModal] = useState<ModalState>(null);

  const handleSuccess = useCallback(() => {
    setModal(null);
    onActionSuccess?.();
  }, [onActionSuccess]);

  const closeModal = useCallback(() => setModal(null), []);

  return (
    <>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2
              className="font-bold text-[var(--color-text-primary)]"
              style={{ fontSize: '16px', lineHeight: 1.2 }}
            >
              Lots Actifs — Actions Rapides
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {loading
                ? 'Chargement...'
                : batches.length > 0
                ? `${batches.length} lot${batches.length > 1 ? 's' : ''} en production`
                : 'Aucun lot en production'}
            </p>
          </div>
        </div>

        {/* Legend */}
        {!loading && batches.length > 0 && (
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, var(--color-action-feed), #F59E0B)' }}
              />
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Aliment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, var(--color-action-mortality), #EF4444)' }}
              />
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Mortalite</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <BatchCardSkeleton key={i} index={i} />
          ))
        ) : batches.length === 0 ? (
          <EmptyState />
        ) : (
          batches.map((batch, i) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              index={i}
              onFeed={() => setModal({ type: 'feeding', batch })}
              onMortality={() => setModal({ type: 'mortality', batch })}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'feeding' && (
        <FeedingQuickModal
          batch={modal.batch}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}
      {modal?.type === 'mortality' && (
        <MortalityQuickModal
          batch={modal.batch}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
