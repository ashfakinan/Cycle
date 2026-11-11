export type ActivityStatus = 'completed' | 'not_done' | 'unconfirmed';

export type ScheduleType = 'cycle' | 'routine';

export interface CycleActivity {
  id: string;
  name: string;
  targetDays: number;
  order: number;
}

export interface Cycle {
  id: string;
  userId: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  repeat: boolean;
  activities: CycleActivity[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineActivity {
  id: string;
  name: string;
  days: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export interface WeeklyRoutine {
  id: string;
  userId: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  activities: RoutineActivity[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  type: ScheduleType;
  scheduleId: string;
  scheduleName: string;
  activityId: string;
  activityName: string;
  status: ActivityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email?: string;
  timezone: string;
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  reminderTime?: string;
  weekStartsOn: 'sunday' | 'monday';
  createdAt: string;
  updatedAt: string;
}

export interface CycleProgressInfo {
  cycleId: string;
  currentActivity: CycleActivity | null;
  currentIndex: number;
  completedInCurrent: number;
  targetInCurrent: number;
  remainingInCurrent: number;
  percentageInCurrent: number;
  nextActivity: CycleActivity | null;
  totalCycleCompletedDays: number;
  totalTargetDays: number;
  overallPercentage: number;
  isAllComplete: boolean;
  activityStats: {
    activity: CycleActivity;
    completedDays: number;
    targetDays: number;
    percentage: number;
    isCurrent: boolean;
    isFinished: boolean;
  }[];
}

export interface ScheduledActivityInstance {
  key: string;
  date: string;
  type: ScheduleType;
  scheduleId: string;
  scheduleName: string;
  activityId: string;
  activityName: string;
  status: ActivityStatus;
  record?: ActivityRecord;
  targetDays?: number;
  completedDays?: number;
}

export type SyncState = 'online_synced' | 'offline' | 'syncing' | 'error';
