import React, { useState, useEffect } from 'react';
import { Cycle, CycleActivity } from '../../types';
import { X, Plus, Trash2, HelpCircle } from 'lucide-react';

interface CycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cycle: Cycle) => void;
  initialCycle?: Cycle | null;
}

export const CycleModal: React.FC<CycleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCycle,
}) => {
  const [name, setName] = useState('');
  const [repeat, setRepeat] = useState(true);
  const [activities, setActivities] = useState<{ id: string; name: string; targetDays: number }[]>([
    { id: 'act_1', name: '', targetDays: 10 },
    { id: 'act_2', name: '', targetDays: 10 },
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCycle) {
      setName(initialCycle.name);
      setRepeat(initialCycle.repeat ?? true);
      setActivities(
        initialCycle.activities.map((a) => ({
          id: a.id,
          name: a.name,
          targetDays: a.targetDays || 10,
        }))
      );
    } else {
      setName('');
      setRepeat(true);
      setActivities([
        { id: `act_${Date.now()}_1`, name: '', targetDays: 10 },
        { id: `act_${Date.now()}_2`, name: '', targetDays: 10 },
      ]);
    }
    setError(null);
  }, [initialCycle, isOpen]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setActivities((prev) => [
      ...prev,
      { id: `act_${Date.now()}_${prev.length + 1}`, name: '', targetDays: 10 },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (activities.length <= 1) return;
    setActivities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleActivityChange = (
    index: number,
    field: 'name' | 'targetDays',
    value: string | number
  ) => {
    setActivities((prev) => {
      const next = [...prev];
      if (field === 'targetDays') {
        next[index] = { ...next[index], targetDays: Math.max(1, Number(value) || 1) };
      } else {
        next[index] = { ...next[index], name: String(value) };
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please provide a cycle name.');
      return;
    }

    const validActs: CycleActivity[] = activities
      .filter((a) => a.name.trim().length > 0)
      .map((a, i) => ({
        id: a.id,
        name: a.name.trim(),
        targetDays: a.targetDays,
        order: i,
      }));

    if (validActs.length === 0) {
      setError('Please add at least one activity with a completion target.');
      return;
    }

    const cycleToSave: Cycle = {
      id: initialCycle ? initialCycle.id : `cycle_${Date.now()}`,
      userId: initialCycle ? initialCycle.userId : 'guest',
      name: trimmedName,
      status: initialCycle ? initialCycle.status : 'active',
      repeat,
      activities: validActs,
      order: initialCycle ? initialCycle.order : 0,
      createdAt: initialCycle ? initialCycle.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(cycleToSave);
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
            {initialCycle ? 'Edit Cycle' : 'New Cycle'}
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
              Cycle name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Study Rotation, Revision Loop"
              className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--accent)] outline-none"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--text-2)]">
                Activities & Target Completed Days
              </label>
              <span className="text-[11px] text-[var(--text-3)]">
                Advances only when target is confirmed
              </span>
            </div>

            <div className="border border-[var(--border)] rounded-md overflow-hidden bg-[var(--bg)] divide-y divide-[var(--border)]">
              {activities.map((act, index) => (
                <div key={act.id} className="flex items-center gap-2 p-2">
                  <span className="w-5 text-center text-xs font-semibold text-[var(--text-3)]">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={act.name}
                    onChange={(e) =>
                      handleActivityChange(index, 'name', e.target.value)
                    }
                    placeholder="e.g. Physics, Math"
                    className="flex-1 px-2 py-1 text-xs bg-transparent border-0 text-[var(--text)] focus:bg-[var(--surface)] rounded outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={act.targetDays}
                      onChange={(e) =>
                        handleActivityChange(index, 'targetDays', e.target.value)
                      }
                      className="w-12 px-1.5 py-1 text-xs text-center border border-[var(--border)] bg-[var(--surface)] rounded text-[var(--text)]"
                      title="Target confirmed days"
                    />
                    <span className="text-[11px] text-[var(--text-3)]">days</span>
                  </div>
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
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddRow}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--text-2)] hover:text-[var(--text)] font-medium p-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add another activity</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text)]">
              <span>Repeat cycle continuously</span>
              <span
                title="When the last activity completes, restart rotation from the first activity."
                className="cursor-help text-[var(--text-3)]"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRepeat(!repeat)}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                repeat ? 'bg-[var(--accent)]' : 'bg-[var(--border-mid)]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                  repeat ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
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
              {initialCycle ? 'Save Changes' : 'Create Cycle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
