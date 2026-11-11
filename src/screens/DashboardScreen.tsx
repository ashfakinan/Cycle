import React from 'react';
import { useApp } from '../context/AppContext';
import {
  getActivitiesForDate,
  calculateCycleProgress,
  getDayStatusSummary,
} from '../lib/cycleEngine';
import {
  formatFullDate,
  getGreeting,
  DOW_ABBR,
  getWeekDays,
  parseDate,
} from '../lib/dateUtils';
import { StatusControl } from '../components/StatusControl';
import { InstructionsGuide } from '../components/InstructionsGuide';
import { PWAInstallButton } from '../components/PWAInstallButton';
import {
  RotateCcw,
  CalendarDays,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface DashboardScreenProps {
  onOpenNewCycle: () => void;
  onOpenNewRoutine: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onOpenNewCycle,
  onOpenNewRoutine,
}) => {
  const {
    todayStr,
    profile,
    user,
    cycles,
    routines,
    records,
    updateActivityStatus,
    setActiveScreen,
    setSelectedDate,
    showGuide,
    setShowGuide,
    setShowAuthModal,
  } = useApp();

  const displayName = user?.displayName || profile.displayName || 'Student';
  const greeting = getGreeting();
  const weekDays = getWeekDays(todayStr, profile.weekStartsOn);

  // Today's scheduled activities
  const todayActivities = getActivitiesForDate(
    todayStr,
    todayStr,
    cycles,
    routines,
    records
  );

  // Active cycles
  const activeCycles = cycles.filter((c) => c.status === 'active');

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setActiveScreen('calendar');
  };

  const isBrandNew = cycles.length === 0 && routines.length === 0;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading tracking-tight text-[var(--text)]">
            {greeting}, {displayName}
          </h1>
          <p className="text-xs md:text-sm text-[var(--text-2)] mt-0.5">
            {formatFullDate(todayStr)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!user && (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors shadow-2xs"
            >
              <span>Create Account / Log In</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
            title="Read instructions & principles"
          >
            <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>{showGuide ? 'Hide Guide' : 'Instructions'}</span>
          </button>
        </div>
      </div>

      {/* Guide Banner for new or inquiring users */}
      {(showGuide || isBrandNew) && (
        <InstructionsGuide
          onOpenNewCycle={onOpenNewCycle}
          onOpenNewRoutine={onOpenNewRoutine}
          onClose={() => {
            setShowGuide(false);
            localStorage.setItem('cycle_dismissed_guide', 'true');
          }}
        />
      )}

      {/* Today's Activities */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
              Today's Activities
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] font-medium">
              {todayActivities.length} scheduled
            </span>
          </div>

          <span className="text-[11px] text-[var(--text-3)] hidden sm:inline">
            Unconfirmed is not a missed day
          </span>
        </div>

        <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden divide-y divide-[var(--border)] shadow-xs">
          {todayActivities.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-[var(--bg-subtle)] text-[var(--text-3)] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text)]">
                  Nothing scheduled for today
                </h3>
                <p className="text-xs text-[var(--text-3)] mt-1 max-w-sm mx-auto">
                  Create a completion cycle to rotate through study targets or add a weekly routine for fixed weekdays.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onOpenNewCycle}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Create Cycle
                </button>
                <button
                  type="button"
                  onClick={onOpenNewRoutine}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--bg-hover)]"
                >
                  Add Routine
                </button>
              </div>
            </div>
          ) : (
            todayActivities.map((act) => {
              const statusDotClass =
                act.status === 'completed'
                  ? 'bg-[var(--done)]'
                  : act.status === 'not_done'
                  ? 'bg-[var(--miss)]'
                  : 'border border-[var(--border-mid)] bg-transparent';

              return (
                <div
                  key={act.key}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)]/40 transition-colors"
                >
                  {/* Status dot indicator */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass}`} />

                  {/* Activity Name & Schedule info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--text)] truncate">
                      {act.activityName}
                    </div>
                    <div className="text-[11.5px] text-[var(--text-3)] flex items-center gap-1.5 mt-0.5">
                      <span>{act.scheduleName}</span>
                      <span>·</span>
                      <span className="capitalize">
                        {act.type === 'cycle' ? 'Completion Cycle' : 'Weekly Routine'}
                      </span>
                    </div>
                  </div>

                  {/* Target completed count for cycles */}
                  {act.type === 'cycle' && act.targetDays !== undefined && (
                    <div className="text-xs font-mono text-[var(--text-3)] px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border)] shrink-0 hidden sm:block">
                      {act.completedDays} / {act.targetDays} days
                    </div>
                  )}

                  {/* Segmented status control */}
                  <StatusControl
                    status={act.status}
                    onChange={(newStatus) =>
                      updateActivityStatus(
                        todayStr,
                        act.scheduleId,
                        act.scheduleName,
                        act.activityId,
                        act.activityName,
                        act.type,
                        newStatus
                      )
                    }
                  />
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Active Cycles Progress */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
            Active Cycles
          </h2>
          <button
            type="button"
            onClick={() => setActiveScreen('cycles')}
            className="text-xs font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            <span>Manage all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeCycles.length === 0 ? (
          <div className="p-5 border border-[var(--border)] rounded-xl text-center space-y-2 bg-[var(--surface)] text-xs text-[var(--text-3)] shadow-xs">
            <div className="text-[var(--text-2)] font-medium">No active completion cycles</div>
            <p className="max-w-md mx-auto text-[11.5px] text-[var(--text-3)]">
              Cycles rotate through activities based on confirmed study days without calendar pressure.
            </p>
            <button
              type="button"
              onClick={onOpenNewCycle}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Create Your First Cycle</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeCycles.map((cycle) => {
              const progress = calculateCycleProgress(cycle, records);
              const current = progress.currentActivity;
              const next = progress.nextActivity;

              return (
                <div
                  key={cycle.id}
                  className="p-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text)]">
                      {cycle.name}
                    </span>
                    <span className="text-xs font-mono font-medium text-[var(--text-2)]">
                      {progress.completedInCurrent} / {progress.targetInCurrent} confirmed days
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-[var(--text)] w-28 truncate shrink-0">
                      {current?.name || '—'}
                    </div>

                    <div className="flex-1 h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden border border-[var(--border)]">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                        style={{ width: `${progress.percentageInCurrent}%` }}
                      />
                    </div>

                    <span className="text-xs font-mono font-semibold text-[var(--text-2)] shrink-0 w-10 text-right">
                      {progress.percentageInCurrent}%
                    </span>
                  </div>

                  {/* Next up preview */}
                  <div className="flex items-center justify-between text-[11.5px] text-[var(--text-3)] pt-1 border-t border-[var(--border)]">
                    <div className="flex items-center gap-1.5">
                      <span>Remaining:</span>
                      <strong className="text-[var(--text)] font-semibold">
                        {progress.remainingInCurrent} completed days
                      </strong>
                    </div>

                    <div>
                      Next activity:{' '}
                      <span className="text-[var(--accent)] font-medium">
                        {next ? next.name : 'Cycle complete'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Weekly Strip */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
            This Week
          </h2>
          <button
            type="button"
            onClick={() => setActiveScreen('calendar')}
            className="text-xs font-medium text-[var(--text-2)] hover:text-[var(--text)] inline-flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Full Calendar</span>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map((dateStr) => {
            const isToday = dateStr === todayStr;
            const dayObj = parseDate(dateStr);
            const summary = getDayStatusSummary(
              dateStr,
              todayStr,
              cycles,
              routines,
              records
            );

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDayClick(dateStr)}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl border text-center transition-all ${
                  isToday
                    ? 'border-[var(--accent)] bg-[var(--accent-bg)] shadow-xs'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isToday ? 'text-[var(--accent-text)]' : 'text-[var(--text-3)]'
                  }`}
                >
                  {DOW_ABBR[dayObj.getDay()]}
                </span>
                <span
                  className={`text-sm md:text-base font-bold my-1 ${
                    isToday ? 'text-[var(--accent-text)]' : 'text-[var(--text)]'
                  }`}
                >
                  {dayObj.getDate()}
                </span>

                {/* Activity status dots */}
                <div className="flex items-center gap-1 min-h-[6px] justify-center flex-wrap px-1">
                  {Array.from({ length: Math.min(summary.completed, 3) }).map((_, i) => (
                    <span key={`done_${i}`} className="w-1.5 h-1.5 rounded-full bg-[var(--done)]" />
                  ))}
                  {Array.from({ length: Math.min(summary.notDone, 2) }).map((_, i) => (
                    <span key={`miss_${i}`} className="w-1.5 h-1.5 rounded-full bg-[var(--miss)]" />
                  ))}
                  {Array.from({ length: Math.min(summary.unconfirmed, 2) }).map((_, i) => (
                    <span key={`pend_${i}`} className="w-1.5 h-1.5 rounded-full bg-[var(--border-mid)]" />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">
          Quick Actions
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewCycle}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-hover)] text-[var(--text)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>New Cycle</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewRoutine}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-hover)] text-[var(--text)] transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>New Routine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('calendar')}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-hover)] text-[var(--text)] transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>View Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('analytics')}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-hover)] text-[var(--text)] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Insights</span>
          </button>

          <PWAInstallButton />
        </div>
      </section>
    </div>
  );
};
