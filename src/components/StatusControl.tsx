import React from 'react';
import { ActivityStatus } from '../types';

interface StatusControlProps {
  status: ActivityStatus;
  onChange: (newStatus: ActivityStatus) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export const StatusControl: React.FC<StatusControlProps> = ({
  status,
  onChange,
  size = 'md',
  disabled = false,
}) => {
  const isSm = size === 'sm';

  return (
    <div
      className={`inline-flex items-center rounded-md border border-[var(--border)] overflow-hidden shrink-0 bg-[var(--surface)] ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
      role="group"
      aria-label="Activity status"
    >
      <button
        type="button"
        onClick={() => onChange('completed')}
        title="Mark completed"
        aria-label="Mark completed"
        className={`${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } font-medium border-r border-[var(--border)] transition-colors ${
          status === 'completed'
            ? 'bg-[var(--done-bg)] text-[var(--done-text)] font-semibold'
            : 'text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        ✓
      </button>

      <button
        type="button"
        onClick={() => onChange('unconfirmed')}
        title="Mark unconfirmed (pending)"
        aria-label="Mark unconfirmed"
        className={`${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } font-medium border-r border-[var(--border)] transition-colors ${
          status === 'unconfirmed'
            ? 'bg-[var(--pend-bg)] text-[var(--pend-text)] font-semibold'
            : 'text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        –
      </button>

      <button
        type="button"
        onClick={() => onChange('not_done')}
        title="Mark not done"
        aria-label="Mark not done"
        className={`${
          isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } font-medium transition-colors ${
          status === 'not_done'
            ? 'bg-[var(--miss-bg)] text-[var(--miss-text)] font-semibold'
            : 'text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        ✗
      </button>
    </div>
  );
};
