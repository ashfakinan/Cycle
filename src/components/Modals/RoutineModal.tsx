import React, { useState, useEffect } from 'react';
import { WeeklyRoutine, RoutineActivity } from '../../types';
import { X, Plus, Trash2 } from 'lucide-react';
import { DOW_SHORT, DOW_FULL } from '../../lib/dateUtils';

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (routine: WeeklyRoutine) => void;
  initialRoutine?: WeeklyRoutine | null;
}

export const RoutineModal: React.FC<RoutineModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRoutine,
}) => {
  const [name, setName] = useState('');
  const [activities, setActivities] = useState<{ id: string; name: string; days: number[] }[]>([
    { id: 'act_r1', name: '', days: [0, 1, 2, 3, 4] },
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoutine) {
      setName(initialRoutine.name);
      setActivities(
        initialRoutine.activities.map((a) => ({
          id: a.id,
          name: a.name,
          days: [...a.days],
        }))
      );
    } else {
      setName('');
      setActivities([{ id: `act_r_${Date.now()}`, name: '', days: [0, 1, 2, 3, 4] }]);
    }
    setError(null);
  }, [initialRoutine, isOpen]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setActivities((prev) => [
      ...prev,
      { id: `act_r_${Date.now()}_${prev.length + 1}`, name: '', days: [1, 3, 5] },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (activities.length <= 1) return;
    setActivities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNameChange = (index: number, val: string) => {
    setActivities((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: val };
      return next;
    });
  };

  const handleToggleDay = (actIndex: number, dayIndex: number) => {
    setActivities((prev) => {
      const next = [...prev];
      const curDays = next[actIndex].days;
      if (curDays.includes(dayIndex)) {
        next[actIndex] = {
          ...next[actIndex],
          days: curDays.filter((d) => d !== dayIndex),
        };
      } else {
        next[actIndex] = {
          ...next[actIndex],
          days: [...curDays, dayIndex].sort((a, b) => a - b),
        };
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please provide a routine name.');
      return;
    }

    const validActs: RoutineActivity[] = activities
      .filter((a) => a.name.trim().length > 0 && a.days.length > 0)
      .map((a) => ({
        id: a.id,
        name: a.name.trim(),
        days: a.days,
      }));

    if (validActs.length === 0) {
      setError('Please add at least one activity with at least one active weekday.');
      return;
    }

    const routineToSave: WeeklyRoutine = {
      id: initialRoutine ? initialRoutine.id : `routine_${Date.now()}`,
      userId: initialRoutine ? initialRoutine.userId : 'guest',
      name: trimmedName,
      status: initialRoutine ? initialRoutine.status : 'active',
      activities: validActs,
      order: initialRoutine ? initialRoutine.order : 0,
      createdAt: initialRoutine ? initialRoutine.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(routineToSave);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden text-[var(--text)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold tracking-tight">
            {initialRoutine ? 'Edit Routine' : 'New Weekly Routine'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-md text-xs bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-1.5">
              Routine name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Academic Schedule, Daily Training"
              className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--accent)] outline-none"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--text-2)]">
                Activities & Weekdays
              </label>
              <span className="text-[11px] text-[var(--text-3)]">
                Repeats weekly on selected days
              </span>
            </div>

            <div className="space-y-2">
              {activities.map((act, index) => (
                <div
                  key={act.id}
                  className="p-3 border border-[var(--border)] rounded-md bg-[var(--bg)] space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={act.name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      placeholder="e.g. Biology, Programming, Morning Run"
                      className="flex-1 px-2.5 py-1 text-xs border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] rounded outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      disabled={activities.length <= 1}
                      className="p-1 text-[var(--text-3)] hover:text-red-500 rounded disabled:opacity-30"
                      title="Remove activity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Weekday chips */}
                  <div className="flex items-center gap-1.5">
                    {DOW_SHORT.map((char, dayIndex) => {
                      const isSelected = act.days.includes(dayIndex);
                      return (
                        <button
                          key={dayIndex}
                          type="button"
                          onClick={() => handleToggleDay(index, dayIndex)}
                          title={DOW_FULL[dayIndex]}
                          className={`w-7 h-7 rounded-full text-[11px] font-semibold transition-colors ${
                            isSelected
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-[var(--surface)] text-[var(--text-2)] border border-[var(--border)] hover:bg-[var(--bg-hover)]'
                          }`}
                        >
                          {char}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddRow}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--text-2)] hover:text-[var(--text)] font-medium p-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add another routine activity</span>
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md text-[var(--text-2)] hover:bg-[var(--bg-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              {initialRoutine ? 'Save Changes' : 'Create Routine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
