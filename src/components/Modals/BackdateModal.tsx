import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ActivityStatus, ScheduleType } from '../../types';
import { X, Calendar } from 'lucide-react';
import { formatFullDate } from '../../lib/dateUtils';

interface BackdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
}

export const BackdateModal: React.FC<BackdateModalProps> = ({
  isOpen,
  onClose,
  targetDate,
}) => {
  const { cycles, routines, updateActivityStatus, todayStr } = useApp();

  const [date, setDate] = useState(targetDate);
  const [selectedType, setSelectedType] = useState<ScheduleType>('cycle');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [status, setStatus] = useState<ActivityStatus>('completed');

  useEffect(() => {
    setDate(targetDate);
  }, [targetDate, isOpen]);

  // Set default selection when cycles or routines load
  useEffect(() => {
    if (selectedType === 'cycle') {
      const activeCycle = cycles.find((c) => c.status === 'active') || cycles[0];
      if (activeCycle) {
        setSelectedScheduleId(activeCycle.id);
        if (activeCycle.activities.length > 0) {
          setSelectedActivityId(activeCycle.activities[0].id);
        }
      }
    } else {
      const activeRoutine = routines.find((r) => r.status === 'active') || routines[0];
      if (activeRoutine) {
        setSelectedScheduleId(activeRoutine.id);
        if (activeRoutine.activities.length > 0) {
          setSelectedActivityId(activeRoutine.activities[0].id);
        }
      }
    }
  }, [selectedType, cycles, routines]);

  if (!isOpen) return null;

  const currentSchedule =
    selectedType === 'cycle'
      ? cycles.find((c) => c.id === selectedScheduleId)
      : routines.find((r) => r.id === selectedScheduleId);

  const activities = currentSchedule?.activities || [];

  const handleScheduleChange = (id: string) => {
    setSelectedScheduleId(id);
    const sched =
      selectedType === 'cycle'
        ? cycles.find((c) => c.id === id)
        : routines.find((r) => r.id === id);
    if (sched && sched.activities.length > 0) {
      setSelectedActivityId(sched.activities[0].id);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchedule || !selectedActivityId) return;

    const activity = activities.find((a) => a.id === selectedActivityId);
    if (!activity) return;

    await updateActivityStatus(
      date,
      currentSchedule.id,
      currentSchedule.name,
      activity.id,
      activity.name,
      selectedType,
      status
    );

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden text-[var(--text)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold tracking-tight">
              Log or Backdate Activity
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              max={todayStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
            />
            <div className="text-[11px] text-[var(--text-3)] mt-1">
              {formatFullDate(date)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-1">
              Schedule Type
            </label>
            <div className="flex rounded-md border border-[var(--border)] overflow-hidden bg-[var(--bg)]">
              <button
                type="button"
                onClick={() => setSelectedType('cycle')}
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                  selectedType === 'cycle'
                    ? 'bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold'
                    : 'text-[var(--text-2)] hover:text-[var(--text)]'
                }`}
              >
                Completion Cycle
              </button>
              <button
                type="button"
                onClick={() => setSelectedType('routine')}
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                  selectedType === 'routine'
                    ? 'bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold'
                    : 'text-[var(--text-2)] hover:text-[var(--text)]'
                }`}
              >
                Weekly Routine
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-1">
              {selectedType === 'cycle' ? 'Cycle' : 'Routine'}
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => handleScheduleChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] outline-none"
            >
              {(selectedType === 'cycle' ? cycles : routines).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-1">
              Activity
            </label>
            <select
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] outline-none"
            >
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-2)] mb-1">
              Status for this date
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  status === 'completed'
                    ? 'bg-[var(--done-bg)] border-transparent text-[var(--done-text)] font-semibold'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]'
                }`}
              >
                ✓ Completed
              </button>
              <button
                type="button"
                onClick={() => setStatus('unconfirmed')}
                className={`py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  status === 'unconfirmed'
                    ? 'bg-[var(--pend-bg)] border-transparent text-[var(--pend-text)] font-semibold'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]'
                }`}
              >
                – Pending
              </button>
              <button
                type="button"
                onClick={() => setStatus('not_done')}
                className={`py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  status === 'not_done'
                    ? 'bg-[var(--miss-bg)] border-transparent text-[var(--miss-text)] font-semibold'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]'
                }`}
              >
                ✗ Not Done
              </button>
            </div>
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
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
