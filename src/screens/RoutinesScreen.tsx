import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WeeklyRoutine } from '../types';
import { CalendarDays, Plus, Edit2, Play, Pause, Trash2, AlertTriangle } from 'lucide-react';
import { DOW_SHORT, DOW_FULL } from '../lib/dateUtils';

interface RoutinesScreenProps {
  onOpenNewRoutine: () => void;
  onEditRoutine: (routine: WeeklyRoutine) => void;
}

export const RoutinesScreen: React.FC<RoutinesScreenProps> = ({
  onOpenNewRoutine,
  onEditRoutine,
}) => {
  const { routines, setRoutinePaused, removeRoutine } = useApp();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (routineId: string) => {
    removeRoutine(routineId);
    setConfirmDeleteId(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading tracking-tight text-[var(--text)]">
            Weekly Routines
          </h1>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            Fixed weekday schedules. Repeat weekly on selected weekdays independent of completion cycles.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewRoutine}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Routine</span>
        </button>
      </div>

      {/* Routine Blocks */}
      {routines.length === 0 ? (
        <div className="border border-dashed border-[var(--border)] rounded-xl p-12 text-center space-y-3 bg-[var(--surface)]">
          <CalendarDays className="w-8 h-8 mx-auto text-[var(--text-3)] stroke-1" />
          <h3 className="text-sm font-semibold text-[var(--text)]">No routines created yet</h3>
          <p className="text-xs text-[var(--text-3)] max-w-sm mx-auto">
            Create fixed weekly schedules (e.g. Biology on Sunday–Thursday, ICT on Friday–Saturday).
          </p>
          <button
            type="button"
            onClick={onOpenNewRoutine}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Create First Routine
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {routines.map((routine) => {
            const isPaused = routine.status === 'paused';

            return (
              <div
                key={routine.id}
                className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden shadow-xs divide-y divide-[var(--border)]"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2.5 bg-[var(--bg-subtle)]/70">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-bold font-heading text-[var(--text)]">
                      {routine.name}
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
                    <span className="text-[11px] text-[var(--text-3)]">
                      {routine.activities.length} activities
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => onEditRoutine(routine)}
                      title="Edit routine"
                      className="p-1.5 rounded-md text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setRoutinePaused(routine.id, !isPaused)}
                      title={isPaused ? 'Resume routine' : 'Pause routine'}
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
                      onClick={() => setConfirmDeleteId(routine.id)}
                      title="Delete routine"
                      className="p-1.5 rounded-md text-[var(--miss)] hover:bg-[var(--miss-bg)] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Confirm Delete Warning */}
                {confirmDeleteId === routine.id && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Delete this weekly routine? Historical check-ins will remain in records.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(routine.id)}
                        className="px-2 py-1 rounded bg-red-600 text-white font-medium hover:bg-red-700"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Routine Activity Rows */}
                <div className="divide-y divide-[var(--border)]">
                  {routine.activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-2.5"
                    >
                      <div className="text-xs font-semibold text-[var(--text)]">
                        {act.name}
                      </div>

                      {/* Day tags */}
                      <div className="flex items-center gap-1">
                        {DOW_SHORT.map((char, dayIdx) => {
                          const isActive = act.days.includes(dayIdx);
                          return (
                            <span
                              key={dayIdx}
                              title={DOW_FULL[dayIdx]}
                              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-semibold transition-colors ${
                                isActive
                                  ? 'bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent)]/30'
                                  : 'bg-[var(--bg-hover)] text-[var(--text-3)] border border-transparent'
                              }`}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
