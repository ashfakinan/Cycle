import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatFullDate,
  formatMonthYear,
  getMonthGrid,
  getWeekDays,
  parseDate,
  DOW_ABBR,
  MONTHS_SHORT,
} from '../lib/dateUtils';
import {
  getActivitiesForDate,
  getDayStatusSummary,
} from '../lib/cycleEngine';
import { StatusControl } from '../components/StatusControl';
import { BackdateModal } from '../components/Modals/BackdateModal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';

export const CalendarScreen: React.FC = () => {
  const {
    todayStr,
    selectedDate,
    setSelectedDate,
    cycles,
    routines,
    records,
    updateActivityStatus,
    profile,
  } = useApp();

  const [calView, setCalView] = useState<'month' | 'week'>('month');
  const [viewDate, setViewDate] = useState<Date>(() => parseDate(selectedDate || todayStr));
  const [isBackdateOpen, setIsBackdateOpen] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrev = () => {
    if (calView === 'month') {
      setViewDate(new Date(year, month - 1, 1, 12));
    } else {
      const d = new Date(viewDate);
      d.setDate(d.getDate() - 7);
      setViewDate(d);
    }
  };

  const handleNext = () => {
    if (calView === 'month') {
      setViewDate(new Date(year, month + 1, 1, 12));
    } else {
      const d = new Date(viewDate);
      d.setDate(d.getDate() + 7);
      setViewDate(d);
    }
  };

  const handleToday = () => {
    const today = parseDate(todayStr);
    setViewDate(today);
    setSelectedDate(todayStr);
  };

  // Month grid cells
  const monthCells = getMonthGrid(year, month, profile.weekStartsOn);

  // Week view days
  const weekCenterStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(viewDate.getDate()).padStart(2, '0')}`;
  const weekDays = getWeekDays(weekCenterStr, profile.weekStartsOn);

  // Scheduled activities for selected date
  const selectedDateActivities = getActivitiesForDate(
    selectedDate,
    todayStr,
    cycles,
    routines,
    records
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header & View toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading tracking-tight text-[var(--text)]">
            Calendar
          </h1>
          <p className="text-xs text-[var(--text-3)]">
            Review history, manage schedules, and backdate completions
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month / Week switch */}
          <div className="flex rounded-md border border-[var(--border)] overflow-hidden bg-[var(--surface)] text-xs">
            <button
              type="button"
              onClick={() => setCalView('month')}
              className={`px-3 py-1 font-medium transition-colors ${
                calView === 'month'
                  ? 'bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setCalView('week')}
              className={`px-3 py-1 font-medium transition-colors ${
                calView === 'week'
                  ? 'bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              Week
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsBackdateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Check-in</span>
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous month or week"
            className="p-1 rounded-md text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] border border-[var(--border)]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-semibold text-[var(--text)] min-w-[140px] text-center font-heading">
            {formatMonthYear(viewDate)}
          </span>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next month or week"
            className="p-1 rounded-md text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] border border-[var(--border)]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleToday}
          className="px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]"
        >
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      {calView === 'month' ? (
        <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg-subtle)] text-center py-2 text-[11px] font-semibold text-[var(--text-3)] uppercase tracking-wider">
            {DOW_ABBR.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Month day cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[var(--border)] bg-[var(--border)] gap-px">
            {monthCells.map((cell) => {
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDate;
              const summary = getDayStatusSummary(
                cell.dateStr,
                todayStr,
                cycles,
                routines,
                records
              );

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`min-h-[72px] sm:min-h-[82px] p-1.5 sm:p-2 cursor-pointer transition-colors relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[var(--accent-bg)] ring-2 ring-[var(--accent)] ring-inset'
                      : cell.isCurrentMonth
                      ? 'bg-[var(--surface)] hover:bg-[var(--bg-hover)]'
                      : 'bg-[var(--bg-subtle)]/70 hover:bg-[var(--bg-hover)] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold'
                          : isSelected
                          ? 'text-[var(--accent-text)] font-bold'
                          : 'text-[var(--text)]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {summary.total > 0 && (
                      <span className="text-[10px] text-[var(--text-3)] font-mono">
                        {summary.completed}/{summary.total}
                      </span>
                    )}
                  </div>

                  {/* Status dots */}
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    {Array.from({ length: Math.min(summary.completed, 4) }).map((_, i) => (
                      <span
                        key={`cd_${i}`}
                        className="w-1.5 h-1.5 rounded-full bg-[var(--done)]"
                        title="Completed"
                      />
                    ))}
                    {Array.from({ length: Math.min(summary.notDone, 2) }).map((_, i) => (
                      <span
                        key={`cm_${i}`}
                        className="w-1.5 h-1.5 rounded-full bg-[var(--miss)]"
                        title="Not done"
                      />
                    ))}
                    {Array.from({ length: Math.min(summary.unconfirmed, 2) }).map((_, i) => (
                      <span
                        key={`cp_${i}`}
                        className="w-1.5 h-1.5 rounded-full bg-[var(--border-mid)]"
                        title="Unconfirmed"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View */
        <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden shadow-xs">
          {/* Week column headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border)] divide-x divide-[var(--border)]">
            {weekDays.map((dateStr) => {
              const d = parseDate(dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`py-2 px-1 text-center cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent-bg)]'
                      : isToday
                      ? 'bg-[var(--bg-subtle)]'
                      : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="text-[10px] font-semibold text-[var(--text-3)] uppercase">
                    {DOW_ABBR[d.getDay()]}
                  </div>
                  <div
                    className={`text-sm font-bold mt-0.5 ${
                      isToday ? 'text-[var(--accent)]' : 'text-[var(--text)]'
                    }`}
                  >
                    {d.getDate()}
                  </div>
                  <div className="text-[10px] text-[var(--text-3)]">
                    {MONTHS_SHORT[d.getMonth()]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week content columns */}
          <div className="grid grid-cols-7 divide-x divide-[var(--border)] min-h-[140px] bg-[var(--bg)]">
            {weekDays.map((dateStr) => {
              const isSelected = dateStr === selectedDate;
              const acts = getActivitiesForDate(dateStr, todayStr, cycles, routines, records);

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`p-1.5 cursor-pointer space-y-1 transition-colors ${
                    isSelected ? 'bg-[var(--accent-bg)]/40' : 'hover:bg-[var(--surface)]'
                  }`}
                >
                  {acts.length === 0 ? (
                    <div className="text-[11px] text-[var(--text-3)] text-center py-4">—</div>
                  ) : (
                    acts.slice(0, 4).map((a) => {
                      const tagClass =
                        a.status === 'completed'
                          ? 'bg-[var(--done-bg)] text-[var(--done-text)]'
                          : a.status === 'not_done'
                          ? 'bg-[var(--miss-bg)] text-[var(--miss-text)]'
                          : 'bg-[var(--pend-bg)] text-[var(--pend-text)]';

                      return (
                        <div
                          key={a.key}
                          className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded truncate ${tagClass}`}
                          title={`${a.activityName} (${a.status})`}
                        >
                          {a.activityName}
                        </div>
                      );
                    })
                  )}
                  {acts.length > 4 && (
                    <div className="text-[10px] text-[var(--text-3)] text-center">
                      +{acts.length - 4} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Date Detail Drawer */}
      <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <span className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-wider">
              {selectedDate === todayStr ? 'Today' : 'Selected Date'}
            </span>
            <h3 className="text-sm sm:text-base font-bold font-heading text-[var(--text)]">
              {formatFullDate(selectedDate)}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setIsBackdateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Add / Backdate</span>
          </button>
        </div>

        {selectedDateActivities.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <CalendarIcon className="w-6 h-6 mx-auto text-[var(--text-3)]" />
            <p className="text-xs text-[var(--text-3)]">
              No scheduled activities for this date.
            </p>
            <button
              type="button"
              onClick={() => setIsBackdateOpen(true)}
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Record an activity for this date →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {selectedDateActivities.map((act) => {
              const statusDotClass =
                act.status === 'completed'
                  ? 'bg-[var(--done)]'
                  : act.status === 'not_done'
                  ? 'bg-[var(--miss)]'
                  : 'border border-[var(--border-mid)] bg-transparent';

              return (
                <div
                  key={act.key}
                  className="flex items-center justify-between py-2.5 gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass}`} />
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-medium text-[var(--text)] truncate">
                        {act.activityName}
                      </div>
                      <div className="text-[11px] text-[var(--text-3)] truncate">
                        {act.scheduleName} ·{' '}
                        {act.type === 'cycle' ? 'Cycle' : 'Weekly Routine'}
                      </div>
                    </div>
                  </div>

                  <StatusControl
                    status={act.status}
                    onChange={(newStatus) =>
                      updateActivityStatus(
                        selectedDate,
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
            })}
          </div>
        )}
      </div>

      {/* Backdate modal */}
      <BackdateModal
        isOpen={isBackdateOpen}
        onClose={() => setIsBackdateOpen(false)}
        targetDate={selectedDate}
      />
    </div>
  );
};
