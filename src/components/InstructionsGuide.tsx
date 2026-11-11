import React from 'react';
import {
  RotateCcw,
  CalendarDays,
  CheckCircle2,
  Calendar,
  X,
  Plus,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface InstructionsGuideProps {
  onOpenNewCycle: () => void;
  onOpenNewRoutine: () => void;
  onClose?: () => void;
  compact?: boolean;
}

export const InstructionsGuide: React.FC<InstructionsGuideProps> = ({
  onOpenNewCycle,
  onOpenNewRoutine,
  onClose,
  compact = false,
}) => {
  return (
    <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] p-4 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold font-heading text-[var(--text)]">
              Welcome to Cycle — Instructions & Core Principles
            </h2>
            <p className="text-xs text-[var(--text-3)]">
              Never assume. Never punish. Never lose progress.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
            title="Dismiss guide"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3 Core System Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
        {/* Card 1: Completion Cycles */}
        <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] space-y-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
              <RotateCcw className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>1. Completion-Based Cycles</span>
            </div>
            <p className="text-[var(--text-2)] leading-relaxed">
              Organize repeating sequences (e.g. <strong>Physics</strong> for 10 confirmed study days, then <strong>Chemistry</strong> for 10 days).
            </p>
            <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--text-3)] space-y-1">
              <div>• Advances <strong>only</strong> when days are completed.</div>
              <div>• Calendar days passing <strong>never</strong> advances.</div>
              <div>• Take breaks anytime without losing progress.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenNewCycle}
            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Create Cycle</span>
          </button>
        </div>

        {/* Card 2: Weekly Routines */}
        <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] space-y-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
              <CalendarDays className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>2. Weekly Routines</span>
            </div>
            <p className="text-[var(--text-2)] leading-relaxed">
              Track fixed calendar routines (e.g. <strong>Biology</strong> on Sun–Thu, <strong>ICT</strong> on Fri–Sat).
            </p>
            <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--text-3)] space-y-1">
              <div>• Tied to real calendar weekdays in Bangladesh.</div>
              <div>• Runs independently of completion cycles.</div>
              <div>• Multiple activities allowed on the same day.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenNewRoutine}
            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-medium hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Routine</span>
          </button>
        </div>

        {/* Card 3: 3-State Check-ins */}
        <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] space-y-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>3. Check-ins & Backdating</span>
            </div>
            <p className="text-[var(--text-2)] leading-relaxed">
              Every activity supports 3 distinct states so you never feel guilty:
            </p>
            <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--text-3)] space-y-1">
              <div>• <strong className="text-[var(--done-text)]">✓ Done</strong>: Confirmed complete.</div>
              <div>• <strong className="text-[var(--pend-text)]">– Pending</strong>: Unconfirmed (never missed!).</div>
              <div>• <strong className="text-[var(--miss-text)]">✗ Not done</strong>: Confirmed skipped.</div>
              <div>• Select past dates in <strong>Calendar</strong> to backdate.</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)] pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span>Automatic recalculation when backdating</span>
          </div>
        </div>
      </div>
    </div>
  );
};
