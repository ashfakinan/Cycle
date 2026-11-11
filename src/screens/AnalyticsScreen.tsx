import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { addDays, formatMediumDate, parseDate } from '../lib/dateUtils';
import { getActivitiesForDate, calculateStreak } from '../lib/cycleEngine';

export const AnalyticsScreen: React.FC = () => {
  const { todayStr, cycles, routines, records } = useApp();
  const [rangeDays, setRangeDays] = useState<number>(30);

  // Generate date array for the selected range
  const datesInRange = useMemo(() => {
    const list: string[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      list.push(addDays(todayStr, -i));
    }
    return list;
  }, [todayStr, rangeDays]);

  // Aggregate stats over the range
  const stats = useMemo(() => {
    let completedCount = 0;
    let notDoneCount = 0;
    let unconfirmedCount = 0;
    let totalScheduled = 0;

    const dailyData: { date: string; completed: number; total: number }[] = [];

    for (const d of datesInRange) {
      const acts = getActivitiesForDate(d, todayStr, cycles, routines, records);
      const dayCompleted = acts.filter((a) => a.status === 'completed').length;
      const dayNotDone = acts.filter((a) => a.status === 'not_done').length;
      const dayUnconfirmed = acts.filter((a) => a.status === 'unconfirmed').length;

      completedCount += dayCompleted;
      notDoneCount += dayNotDone;
      unconfirmedCount += dayUnconfirmed;
      totalScheduled += acts.length;

      dailyData.push({
        date: d,
        completed: dayCompleted,
        total: acts.length,
      });
    }

    const decidedCount = completedCount + notDoneCount;
    const completionRate = decidedCount > 0
      ? Math.round((completedCount / decidedCount) * 100)
      : 0;

    const currentStreak = calculateStreak(todayStr, records);

    return {
      completedCount,
      notDoneCount,
      unconfirmedCount,
      totalScheduled,
      completionRate,
      currentStreak,
      dailyData,
    };
  }, [datesInRange, todayStr, cycles, routines, records]);

  // Activity breakdown stats
  const activityBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { name: string; type: string; completed: number; total: number }
    >();

    // Completion Cycles
    for (const c of cycles) {
      for (const a of c.activities) {
        const actRecords = records.filter((r) => r.activityId === a.id);
        const comp = actRecords.filter((r) => r.status === 'completed').length;
        map.set(a.id, {
          name: a.name,
          type: 'Cycle',
          completed: comp,
          total: a.targetDays,
        });
      }
    }

    // Weekly Routines
    for (const r of routines) {
      for (const a of r.activities) {
        const schedCount = datesInRange.filter((d) =>
          a.days.includes(parseDate(d).getDay())
        ).length;
        const comp = records.filter(
          (rec) =>
            rec.activityId === a.id &&
            datesInRange.includes(rec.date) &&
            rec.status === 'completed'
        ).length;
        map.set(a.id, {
          name: a.name,
          type: 'Routine',
          completed: comp,
          total: schedCount,
        });
      }
    }

    return Array.from(map.values());
  }, [cycles, routines, records, datesInRange]);

  // Recent check-in history sorted newest first
  const recentHistory = useMemo(() => {
    return [...records]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
  }, [records]);

  // Find max value for chart scaling
  const maxDailyValue = Math.max(
    1,
    ...stats.dailyData.map((d) => Math.max(d.completed, d.total))
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header & Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading tracking-tight text-[var(--text)]">
            Analytics
          </h1>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            Objective progress tracking. Unconfirmed days are tracked separately from missed days.
          </p>
        </div>

        <select
          value={rangeDays}
          onChange={(e) => setRangeDays(Number(e.target.value))}
          className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] outline-none cursor-pointer self-start sm:self-auto font-medium"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-[var(--text-3)]">
            Completion Rate
          </div>
          <div className="text-2xl font-bold font-heading text-[var(--text)] tracking-tight">
            {stats.completionRate}%
          </div>
          <div className="text-[11px] text-[var(--accent)] font-medium">
            Of confirmed check-ins
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-[var(--text-3)]">
            Total Completed
          </div>
          <div className="text-2xl font-bold font-heading text-[var(--done-text)] tracking-tight">
            {stats.completedCount}
          </div>
          <div className="text-[11px] text-[var(--text-3)]">
            Confirmed sessions
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-[var(--text-3)]">
            Current Streak
          </div>
          <div className="text-2xl font-bold font-heading text-[var(--text)] tracking-tight">
            {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
          </div>
          <div className="text-[11px] text-[var(--accent)] font-medium">
            Consecutive study
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-1">
          <div className="text-[11px] font-medium text-[var(--text-3)]">
            Scheduled Sessions
          </div>
          <div className="text-2xl font-bold font-heading text-[var(--text)] tracking-tight">
            {stats.totalScheduled}
          </div>
          <div className="text-[11px] text-[var(--text-3)]">
            In last {rangeDays} days
          </div>
        </div>
      </div>

      {/* Status Breakdown Bar */}
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--text)]">Check-in Status Distribution</span>
          <span className="text-[11px] text-[var(--text-3)]">
            {stats.totalScheduled} total opportunities
          </span>
        </div>

        {/* Multi-segment distribution bar */}
        <div className="h-3 rounded-full bg-[var(--bg-subtle)] overflow-hidden flex border border-[var(--border)]">
          {stats.totalScheduled > 0 ? (
            <>
              <div
                style={{
                  width: `${(stats.completedCount / stats.totalScheduled) * 100}%`,
                }}
                className="bg-[var(--done)] h-full transition-all"
                title={`Completed: ${stats.completedCount}`}
              />
              <div
                style={{
                  width: `${(stats.unconfirmedCount / stats.totalScheduled) * 100}%`,
                }}
                className="bg-[var(--border-mid)] h-full transition-all"
                title={`Unconfirmed: ${stats.unconfirmedCount}`}
              />
              <div
                style={{
                  width: `${(stats.notDoneCount / stats.totalScheduled) * 100}%`,
                }}
                className="bg-[var(--miss)] h-full transition-all"
                title={`Not Done: ${stats.notDoneCount}`}
              />
            </>
          ) : (
            <div className="w-full bg-[var(--bg-subtle)]" />
          )}
        </div>

        <div className="flex items-center justify-around text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--done)]" />
            <span className="text-[var(--text-2)] font-medium">Completed: {stats.completedCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-mid)]" />
            <span className="text-[var(--text-2)] font-medium">Unconfirmed: {stats.unconfirmedCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--miss)]" />
            <span className="text-[var(--text-2)] font-medium">Not Done: {stats.notDoneCount}</span>
          </div>
        </div>
      </div>

      {/* Daily Completions Bar Chart */}
      <div className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Daily Activity History
          </h2>
          <span className="text-[11px] text-[var(--text-3)]">
            Green bars indicate completed sessions
          </span>
        </div>

        <div className="h-40 flex items-end gap-1 sm:gap-1.5 pt-4 pb-2 border-b border-[var(--border)] overflow-x-auto">
          {stats.dailyData.map((d, i) => {
            const heightPercent = maxDailyValue > 0
              ? Math.max(4, Math.round((d.completed / maxDailyValue) * 100))
              : 4;

            const isToday = d.date === todayStr;

            return (
              <div
                key={d.date}
                className="flex-1 min-w-[8px] sm:min-w-[12px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
              >
                {/* Tooltip on hover */}
                <div className="hidden group-hover:block absolute bottom-full mb-1.5 z-20 px-2 py-1 text-[10px] rounded bg-[var(--text)] text-[var(--bg)] whitespace-nowrap shadow-md pointer-events-none">
                  <div className="font-semibold">{formatMediumDate(d.date)}</div>
                  <div>Completed: {d.completed} of {d.total}</div>
                </div>

                {/* Track background */}
                <div className="w-full max-w-[20px] h-full bg-[var(--bg-subtle)] rounded-t-sm flex items-end overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      d.completed > 0
                        ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'
                        : 'bg-transparent'
                    }`}
                  />
                </div>

                {/* Date marker every 4 or 7 bars */}
                {(i % (rangeDays <= 14 ? 2 : rangeDays <= 30 ? 5 : 10) === 0 || i === stats.dailyData.length - 1) && (
                  <span className={`text-[9px] mt-1.5 ${isToday ? 'font-bold text-[var(--accent)]' : 'text-[var(--text-3)]'}`}>
                    {formatMediumDate(d.date)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Breakdown Table */}
      <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden shadow-xs space-y-0">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Activity Completion Breakdown
          </h2>
          <span className="text-[11px] text-[var(--text-3)]">
            By activity & schedule
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-subtle)] text-[10.5px] font-semibold text-[var(--text-3)] uppercase border-b border-[var(--border)]">
              <tr>
                <th className="py-2.5 px-4">Activity</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-center">Completed</th>
                <th className="py-2.5 px-4">Progress / Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {activityBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[var(--text-3)]">
                    No activities recorded yet.
                  </td>
                </tr>
              ) : (
                activityBreakdown.map((act) => {
                  const rate = act.total > 0
                    ? Math.min(100, Math.round((act.completed / act.total) * 100))
                    : 0;

                  return (
                    <tr key={act.name} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[var(--text)]">
                        {act.name}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-2)]">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border)]">
                          {act.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[var(--text-2)]">
                        {act.completed} {act.type === 'Cycle' ? `/ ${act.total} target` : 'days'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 sm:w-32 h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden border border-[var(--border)]">
                            <div
                              style={{ width: `${rate}%` }}
                              className="h-full bg-[var(--accent)] rounded-full"
                            />
                          </div>
                          <span className="font-mono text-[11px] font-medium text-[var(--text-3)]">
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Recent Check-ins
          </h2>
          <span className="text-[11px] text-[var(--text-3)]">
            Latest verified updates
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-subtle)] text-[10.5px] font-semibold text-[var(--text-3)] uppercase border-b border-[var(--border)]">
              <tr>
                <th className="py-2.5 px-4">Activity</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Schedule</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {recentHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[var(--text-3)]">
                    No recent check-ins found.
                  </td>
                </tr>
              ) : (
                recentHistory.map((rec) => {
                  const badgeClass =
                    rec.status === 'completed'
                      ? 'bg-[var(--done-bg)] text-[var(--done-text)]'
                      : rec.status === 'not_done'
                      ? 'bg-[var(--miss-bg)] text-[var(--miss-text)]'
                      : 'bg-[var(--pend-bg)] text-[var(--pend-text)]';

                  return (
                    <tr key={rec.id} className="hover:bg-[var(--bg-hover)]/40 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-[var(--text)]">
                        {rec.activityName}
                      </td>
                      <td className="py-2.5 px-4 text-[var(--text-2)] font-mono">
                        {rec.date}
                      </td>
                      <td className="py-2.5 px-4 text-[var(--text-3)]">
                        {rec.scheduleName}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium capitalize ${badgeClass}`}>
                          {rec.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
