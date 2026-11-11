import {
  Cycle,
  WeeklyRoutine,
  ActivityRecord,
  CycleProgressInfo,
  ScheduledActivityInstance,
  ActivityStatus,
} from '../types';
import { getDayOfWeek } from './dateUtils';

/**
 * Calculates current progress, active activity, and completion stats
 * for a completion-based cycle based purely on confirmed completed records.
 */
export function calculateCycleProgress(
  cycle: Cycle,
  allRecords: ActivityRecord[]
): CycleProgressInfo {
  const activities = cycle.activities || [];
  const totalTargetDays = activities.reduce((sum, a) => sum + (a.targetDays || 1), 0);

  if (activities.length === 0 || totalTargetDays === 0) {
    return {
      cycleId: cycle.id,
      currentActivity: null,
      currentIndex: 0,
      completedInCurrent: 0,
      targetInCurrent: 0,
      remainingInCurrent: 0,
      percentageInCurrent: 0,
      nextActivity: null,
      totalCycleCompletedDays: 0,
      totalTargetDays: 0,
      overallPercentage: 0,
      isAllComplete: false,
      activityStats: [],
    };
  }

  // Count confirmed completed days for this cycle
  const cycleCompletedRecords = allRecords.filter(
    (r) => r.scheduleId === cycle.id && r.status === 'completed'
  );
  const totalCycleCompletedDays = cycleCompletedRecords.length;

  // Calculate current rotation position
  let rotationCompleted: number;
  let isAllComplete = false;

  if (cycle.repeat) {
    rotationCompleted = totalCycleCompletedDays % totalTargetDays;
  } else {
    if (totalCycleCompletedDays >= totalTargetDays) {
      isAllComplete = true;
      rotationCompleted = totalTargetDays;
    } else {
      rotationCompleted = totalCycleCompletedDays;
    }
  }

  let cumulative = 0;
  let currentIndex = 0;
  let completedInCurrent = 0;
  let targetInCurrent = activities[0].targetDays;

  const activityStats: CycleProgressInfo['activityStats'] = [];

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const target = act.targetDays || 1;
    const startRange = cumulative;
    const endRange = cumulative + target;

    let actCompleted = 0;
    let isCurrent = false;
    let isFinished = false;

    if (rotationCompleted >= endRange) {
      actCompleted = target;
      isFinished = true;
    } else if (rotationCompleted >= startRange && rotationCompleted < endRange) {
      actCompleted = rotationCompleted - startRange;
      isCurrent = true;
      currentIndex = i;
      completedInCurrent = actCompleted;
      targetInCurrent = target;
    } else {
      actCompleted = 0;
    }

    cumulative = endRange;

    activityStats.push({
      activity: act,
      completedDays: actCompleted,
      targetDays: target,
      percentage: Math.min(100, Math.round((actCompleted / target) * 100)),
      isCurrent: isCurrent && !isAllComplete,
      isFinished: isFinished || isAllComplete,
    });
  }

  // If all completed and non-repeating, point to last
  if (isAllComplete) {
    currentIndex = activities.length - 1;
    completedInCurrent = activities[currentIndex].targetDays;
    targetInCurrent = activities[currentIndex].targetDays;
  }

  const currentActivity = activities[currentIndex] || null;
  const nextActivity = cycle.repeat
    ? activities[(currentIndex + 1) % activities.length] || null
    : activities[currentIndex + 1] || null;

  const remainingInCurrent = Math.max(0, targetInCurrent - completedInCurrent);
  const percentageInCurrent = targetInCurrent > 0
    ? Math.min(100, Math.round((completedInCurrent / targetInCurrent) * 100))
    : 0;

  const overallPercentage = totalTargetDays > 0
    ? Math.min(100, Math.round((rotationCompleted / totalTargetDays) * 100))
    : 0;

  return {
    cycleId: cycle.id,
    currentActivity,
    currentIndex,
    completedInCurrent,
    targetInCurrent,
    remainingInCurrent,
    percentageInCurrent,
    nextActivity,
    totalCycleCompletedDays,
    totalTargetDays,
    overallPercentage,
    isAllComplete,
    activityStats,
  };
}

/**
 * Get all scheduled activity instances for a specific date (YYYY-MM-DD)
 * across active Cycles and Weekly Routines.
 */
export function getActivitiesForDate(
  dateStr: string,
  todayStr: string,
  cycles: Cycle[],
  routines: WeeklyRoutine[],
  records: ActivityRecord[]
): ScheduledActivityInstance[] {
  const instances: ScheduledActivityInstance[] = [];
  const dow = getDayOfWeek(dateStr);

  // 1. Completion-based cycles
  const activeCycles = cycles.filter((c) => c.status === 'active');
  for (const cycle of activeCycles) {
    const progress = calculateCycleProgress(cycle, records);
    if (!progress.currentActivity) continue;

    // Check if there is an explicit record for this date and cycle
    const existingRecord = records.find(
      (r) => r.date === dateStr && r.scheduleId === cycle.id
    );

    if (existingRecord) {
      instances.push({
        key: `cycle_${cycle.id}_${existingRecord.activityId}_${dateStr}`,
        date: dateStr,
        type: 'cycle',
        scheduleId: cycle.id,
        scheduleName: cycle.name,
        activityId: existingRecord.activityId,
        activityName: existingRecord.activityName,
        status: existingRecord.status,
        record: existingRecord,
        targetDays: progress.targetInCurrent,
        completedDays: progress.completedInCurrent,
      });
    } else if (dateStr === todayStr) {
      // If it's today and not recorded yet, show the current active activity as unconfirmed
      instances.push({
        key: `cycle_${cycle.id}_${progress.currentActivity.id}_${dateStr}`,
        date: dateStr,
        type: 'cycle',
        scheduleId: cycle.id,
        scheduleName: cycle.name,
        activityId: progress.currentActivity.id,
        activityName: progress.currentActivity.name,
        status: 'unconfirmed',
        targetDays: progress.targetInCurrent,
        completedDays: progress.completedInCurrent,
      });
    }
  }

  // 2. Calendar-based weekly routines
  const activeRoutines = routines.filter((r) => r.status === 'active');
  for (const routine of activeRoutines) {
    for (const act of routine.activities) {
      // Check if this activity is scheduled for this weekday
      if (act.days.includes(dow)) {
        const existingRecord = records.find(
          (r) =>
            r.date === dateStr &&
            r.scheduleId === routine.id &&
            r.activityId === act.id
        );

        instances.push({
          key: `routine_${routine.id}_${act.id}_${dateStr}`,
          date: dateStr,
          type: 'routine',
          scheduleId: routine.id,
          scheduleName: routine.name,
          activityId: act.id,
          activityName: act.name,
          status: existingRecord ? existingRecord.status : 'unconfirmed',
          record: existingRecord,
        });
      }
    }
  }

  return instances;
}

/**
 * Returns a summary of statuses for a date (completed, not_done, unconfirmed)
 */
export function getDayStatusSummary(
  dateStr: string,
  todayStr: string,
  cycles: Cycle[],
  routines: WeeklyRoutine[],
  records: ActivityRecord[]
): { total: number; completed: number; notDone: number; unconfirmed: number } {
  const acts = getActivitiesForDate(dateStr, todayStr, cycles, routines, records);
  let completed = 0;
  let notDone = 0;
  let unconfirmed = 0;

  for (const a of acts) {
    if (a.status === 'completed') completed++;
    else if (a.status === 'not_done') notDone++;
    else unconfirmed++;
  }

  return {
    total: acts.length,
    completed,
    notDone,
    unconfirmed,
  };
}

/**
 * Calculate user streaks: consecutive past days up to today with at least one completed activity
 */
export function calculateStreak(
  todayStr: string,
  records: ActivityRecord[]
): number {
  const completedDates = new Set(
    records.filter((r) => r.status === 'completed').map((r) => r.date)
  );

  let streak = 0;
  let currentDate = todayStr;

  // If today has a completion, start streak at 1 and check backwards
  // If today is not done yet, check if yesterday had completions
  if (completedDates.has(currentDate)) {
    streak++;
  }

  // Step backwards day by day
  let checkDate = addDays(todayStr, -1);
  while (completedDates.has(checkDate)) {
    streak++;
    checkDate = addDays(checkDate, -1);
    if (streak > 3650) break; // safety cap
  }

  return streak;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}
