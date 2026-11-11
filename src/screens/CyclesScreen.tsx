import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Cycle } from '../types';
import { calculateCycleProgress } from '../lib/cycleEngine';
import {
  RotateCcw,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface CyclesScreenProps {
  onOpenNewCycle: () => void;
  onEditCycle: (cycle: Cycle) => void;
}

export const CyclesScreen: React.FC<CyclesScreenProps> = ({
  onOpenNewCycle,
  onEditCycle,
}) => {
  const {
    cycles,
    records,
    setCyclePaused,
    restartCycle,
    removeCycle,
  } = useApp();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (cycleId: string) => {
    removeCycle(cycleId);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading tracking-tight text-[var(--text)]">
            My Cycles
          </h1>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            Completion-based activity sequences. Cycles advance strictly when target days are confirmed complete.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewCycle}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Cycle</span>
        </button>
      </div>

      {/* Cycle Cards */}
      {cycles.length === 0 ? (
        <div className="border border-[var(--border)] rounded-xl p-8 sm:p-10 text-center space-y-5 bg-[var(--surface)] shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--accent-bg)] text-[var(--accent-text)] flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold font-heading text-[var(--text)]">
              No cycles created yet
            </h3>
            <p className="text-xs text-[var(--text-2)] leading-relaxed">
              Cycles are repeating sequences that advance <strong>strictly</strong> when you confirm completed study days, not with the passage of calendar days.
            </p>
          </div>

          {/* Quick instructions box */}
          <div className="max-w-lg mx-auto p-4 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-left text-xs space-y-2 text-[var(--text-2)]">
            <div className="font-semibold text-[var(--text)]">How to set up your first cycle:</div>
            <div className="space-y-1.5 pl-1">
              <div>1. Tap <strong>Create First Cycle</strong> below.</div>
              <div>2. Choose a name (e.g., <em>Study Rotation</em> or <em>Problem Set Loop</em>).</div>
              <div>3. Add subjects and their target confirmed days (e.g., <em>Physics: 10 days</em>, <em>Chemistry: 10 days</em>).</div>
              <div>4. Each confirmed check-in moves the progress bar. When 10 days are done, Chemistry activates!</div>
              <div>5. Taking a break or skipping days will never reset your hard-earned progress.</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenNewCycle}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Cycle</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cycles.map((cycle) => {
            const progress = calculateCycleProgress(cycle, records);
            const isPaused = cycle.status === 'paused';

            return (
              <div
                key={cycle.id}
                className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden shadow-xs divide-y divide-[var(--border)]"
              >
                {/* Cycle Block Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2.5 bg-[var(--bg-subtle)]/70">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-bold font-heading text-[var(--text)]">
                      {cycle.name}
                    </h2>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isPaused
                          ? 'bg-[var(--bg-hover)] text-[var(--text-3)]'
                          : 'bg-[var(--accent-bg)] text-[var(--accent-text)]'
                      }`}
                    >
                      {isPaused ? 'Paused' : 'Active'}
                    </span>
                    {cycle.repeat && (
                      <span className="text-[10px] text-[var(--text-3)] font-mono border border-[var(--border)] px-1.5 py-0.5 rounded bg-[var(--surface)]">
                        Looping
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => onEditCycle(cycle)}
                      title="Edit cycle name and targets"
                      className="p-1.5 rounded-md text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCyclePaused(cycle.id, !isPaused)}
                      title={isPaused ? 'Resume cycle' : 'Pause cycle'}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-3 h-3 text-[var(--accent)]" />
                          <span>Resume</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3" />
                          <span>Pause</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Restart progress for "${cycle.name}"? Historical completion records are preserved.`)) {
                          restartCycle(cycle.id);
                        }
                      }}
                      title="Restart cycle rotation"
                      className="p-1.5 rounded-md text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(cycle.id)}
                      title="Delete cycle"
                      className="p-1.5 rounded-md text-[var(--miss)] hover:bg-[var(--miss-bg)] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Confirm Delete Warning Banner */}
                {confirmDeleteId === cycle.id && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Delete this cycle? Existing check-in records will remain in history.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(cycle.id)}
                        className="px-2 py-1 rounded bg-red-600 text-white font-medium hover:bg-red-700"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Sequence Step Rows */}
                <div className="divide-y divide-[var(--border)]">
                  {progress.activityStats.map((stat, idx) => {
                    return (
                      <div
                        key={stat.activity.id}
                        className={`flex items-center gap-3.5 p-3.5 transition-colors ${
                          stat.isCurrent && !isPaused
                            ? 'bg-[var(--accent-bg)]/20'
                            : 'bg-[var(--surface)]'
                        }`}
                      >
                        {/* Step number / status icon */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            stat.isCurrent && !isPaused
                              ? 'bg-[var(--accent)] text-white shadow-xs'
                              : stat.isFinished
                              ? 'bg-[var(--done)] text-white'
                              : 'border border-[var(--border-mid)] text-[var(--text-3)]'
                          }`}
                        >
                          {stat.isFinished && !stat.isCurrent ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        {/* Activity details & progress */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={`text-xs font-semibold ${
                                stat.isCurrent
                                  ? 'text-[var(--text)]'
                                  : stat.isFinished
                                  ? 'text-[var(--text-2)]'
                                  : 'text-[var(--text-3)]'
                              }`}
                            >
                              {stat.activity.name}
                              {stat.isCurrent && !isPaused && (
                                <span className="ml-2 text-[10.5px] font-medium text-[var(--accent)] font-sans">
                                  · Current target
                                </span>
                              )}
                            </span>

                            <span className="text-xs font-mono text-[var(--text-3)]">
                              {stat.completedDays} / {stat.targetDays} days
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden border border-[var(--border)]">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  stat.isFinished
                                    ? 'bg-[var(--done)]'
                                    : 'bg-[var(--accent)]'
                                }`}
                                style={{ width: `${stat.percentage}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono font-medium text-[var(--text-3)] w-8 text-right">
                              {stat.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
