import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import {
  Cycle,
  WeeklyRoutine,
  ActivityRecord,
  UserProfile,
  ActivityStatus,
  ScheduleType,
} from '../types';
import { DEFAULT_TIMEZONE, getTodayString } from './dateUtils';

// Local storage keys for offline / guest mode
const LS_CYCLES_KEY = 'cycle_app_cycles_v1';
const LS_ROUTINES_KEY = 'cycle_app_routines_v1';
const LS_RECORDS_KEY = 'cycle_app_records_v1';
const LS_PROFILE_KEY = 'cycle_app_profile_v1';

export const INITIAL_CYCLES: Cycle[] = [
  {
    id: 'cycle_study_rotation',
    userId: 'default',
    name: 'Study Rotation',
    status: 'active',
    repeat: true,
    order: 0,
    activities: [
      { id: 'act_physics', name: 'Physics', targetDays: 10, order: 0 },
      { id: 'act_chemistry', name: 'Chemistry', targetDays: 10, order: 1 },
      { id: 'act_biology_c', name: 'Biology', targetDays: 10, order: 2 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cycle_practice_sets',
    userId: 'default',
    name: 'Practice Sets',
    status: 'active',
    repeat: true,
    order: 1,
    activities: [
      { id: 'act_math_problems', name: 'Math Problems', targetDays: 7, order: 0 },
      { id: 'act_english_writing', name: 'English Writing', targetDays: 7, order: 1 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cycle_book_reading',
    userId: 'default',
    name: 'Book Reading',
    status: 'paused',
    repeat: true,
    order: 2,
    activities: [
      { id: 'act_thinking_fast', name: 'Thinking Fast & Slow', targetDays: 5, order: 0 },
      { id: 'act_atomic_habits', name: 'Atomic Habits', targetDays: 5, order: 1 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_ROUTINES: WeeklyRoutine[] = [
  {
    id: 'routine_academic',
    userId: 'default',
    name: 'Academic Routine',
    status: 'active',
    order: 0,
    activities: [
      { id: 'act_bio_wk', name: 'Biology', days: [0, 1, 2, 3, 4] }, // Sun-Thu
      { id: 'act_ict_wk', name: 'ICT', days: [5, 6] },             // Fri-Sat
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'routine_physical',
    userId: 'default',
    name: 'Physical Training',
    status: 'active',
    order: 1,
    activities: [
      { id: 'act_run', name: 'Morning Run', days: [1, 3, 5] },     // Mon, Wed, Fri
      { id: 'act_stretch', name: 'Stretching', days: [0, 2, 4] },  // Sun, Tue, Thu
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'routine_personal',
    userId: 'default',
    name: 'Personal Habits',
    status: 'active',
    order: 2,
    activities: [
      { id: 'act_journal', name: 'Journaling', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 'act_reading_routine', name: 'Reading', days: [1, 2, 3, 4, 5] },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Generate initial sample history for realistic onboarding demo
 */
export function generateInitialRecords(userId: string): ActivityRecord[] {
  const records: ActivityRecord[] = [];
  const todayStr = getTodayString(DEFAULT_TIMEZONE);
  const [y, m, d] = todayStr.split('-').map(Number);

  // Helper to add days
  const makeDate = (offset: number) => {
    const dt = new Date(y, m - 1, d + offset, 12);
    const ny = dt.getFullYear();
    const nm = String(dt.getMonth() + 1).padStart(2, '0');
    const nd = String(dt.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  };

  // 14 days of realistic history
  // Physics has 7 confirmed completed days (e.g. Days -11 to -4)
  for (let i = 11; i >= 4; i--) {
    const dt = makeDate(-i);
    records.push({
      id: `${dt}_cycle_act_physics`,
      userId,
      date: dt,
      type: 'cycle',
      scheduleId: 'cycle_study_rotation',
      scheduleName: 'Study Rotation',
      activityId: 'act_physics',
      activityName: 'Physics',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Math problems has 4 completed days
  for (let i = 5; i >= 2; i--) {
    const dt = makeDate(-i);
    records.push({
      id: `${dt}_cycle_act_math_problems`,
      userId,
      date: dt,
      type: 'cycle',
      scheduleId: 'cycle_practice_sets',
      scheduleName: 'Practice Sets',
      activityId: 'act_math_problems',
      activityName: 'Math Problems',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Academic routine history (Biology on Sun-Thu, ICT on Fri-Sat)
  for (let i = 13; i >= 1; i--) {
    const dt = makeDate(-i);
    const dow = new Date(dt).getDay();
    if ([0, 1, 2, 3, 4].includes(dow)) {
      records.push({
        id: `${dt}_routine_act_bio_wk`,
        userId,
        date: dt,
        type: 'routine',
        scheduleId: 'routine_academic',
        scheduleName: 'Academic Routine',
        activityId: 'act_bio_wk',
        activityName: 'Biology',
        status: i % 5 === 0 ? 'not_done' : 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      records.push({
        id: `${dt}_routine_act_ict_wk`,
        userId,
        date: dt,
        type: 'routine',
        scheduleId: 'routine_academic',
        scheduleName: 'Academic Routine',
        activityId: 'act_ict_wk',
        activityName: 'ICT',
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return records;
}

export function getLocalData<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

// ----------------------------------------------------
// Firestore Realtime Listeners
// ----------------------------------------------------

export function subscribeToCycles(
  userId: string,
  onUpdate: (cycles: Cycle[]) => void
) {
  const path = `users/${userId}/cycles`;
  const q = query(collection(db, path), orderBy('order', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const cycles: Cycle[] = [];
      snapshot.forEach((docSnap) => {
        cycles.push(docSnap.data() as Cycle);
      });
      onUpdate(cycles);
      setLocalData(`${LS_CYCLES_KEY}_${userId}`, cycles);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToRoutines(
  userId: string,
  onUpdate: (routines: WeeklyRoutine[]) => void
) {
  const path = `users/${userId}/routines`;
  const q = query(collection(db, path), orderBy('order', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const routines: WeeklyRoutine[] = [];
      snapshot.forEach((docSnap) => {
        routines.push(docSnap.data() as WeeklyRoutine);
      });
      onUpdate(routines);
      setLocalData(`${LS_ROUTINES_KEY}_${userId}`, routines);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToRecords(
  userId: string,
  onUpdate: (records: ActivityRecord[]) => void
) {
  const path = `users/${userId}/records`;
  const q = query(collection(db, path));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: ActivityRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push(docSnap.data() as ActivityRecord);
      });
      onUpdate(records);
      setLocalData(`${LS_RECORDS_KEY}_${userId}`, records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile | null) => void
) {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, path),
    (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        onUpdate(profile);
        setLocalData(`${LS_PROFILE_KEY}_${userId}`, profile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// ----------------------------------------------------
// Write Operations
// ----------------------------------------------------

export async function saveCycle(userId: string, cycle: Cycle): Promise<void> {
  const path = `users/${userId}/cycles/${cycle.id}`;
  try {
    const cycleData: Cycle = {
      ...cycle,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId, 'cycles', cycle.id), cycleData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCycle(userId: string, cycleId: string): Promise<void> {
  const path = `users/${userId}/cycles/${cycleId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'cycles', cycleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveRoutine(
  userId: string,
  routine: WeeklyRoutine
): Promise<void> {
  const path = `users/${userId}/routines/${routine.id}`;
  try {
    const routineData: WeeklyRoutine = {
      ...routine,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId, 'routines', routine.id), routineData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteRoutine(
  userId: string,
  routineId: string
): Promise<void> {
  const path = `users/${userId}/routines/${routineId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'routines', routineId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveRecord(
  userId: string,
  dateStr: string,
  scheduleId: string,
  scheduleName: string,
  activityId: string,
  activityName: string,
  type: ScheduleType,
  status: ActivityStatus
): Promise<void> {
  // Stable document ID ensures idempotent updates across devices
  const recordId = `${dateStr}_${type}_${activityId}`;
  const path = `users/${userId}/records/${recordId}`;

  try {
    const record: ActivityRecord = {
      id: recordId,
      userId,
      date: dateStr,
      type,
      scheduleId,
      scheduleName,
      activityId,
      activityName,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', userId, 'records', recordId), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveUserProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const existing = getLocalData<UserProfile | null>(`${LS_PROFILE_KEY}_${userId}`, null);
    const completeProfile: UserProfile = {
      userId,
      displayName: profile.displayName || existing?.displayName || 'Student',
      email: profile.email ?? auth.currentUser?.email ?? '',
      timezone: profile.timezone || existing?.timezone || DEFAULT_TIMEZONE,
      theme: profile.theme || existing?.theme || 'light',
      notificationsEnabled: profile.notificationsEnabled ?? existing?.notificationsEnabled ?? true,
      reminderTime: profile.reminderTime || existing?.reminderTime || '20:00',
      weekStartsOn: profile.weekStartsOn || existing?.weekStartsOn || 'sunday',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', userId), completeProfile);
    setLocalData(`${LS_PROFILE_KEY}_${userId}`, completeProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Seed initial sample structures to user's Cloud Firestore on first login
 */
export async function seedInitialUserData(userId: string): Promise<void> {
  const batch = writeBatch(db);

  // User profile
  const profileRef = doc(db, 'users', userId);
  const profile: UserProfile = {
    userId,
    displayName: auth.currentUser?.displayName || 'Inan',
    email: auth.currentUser?.email || '',
    timezone: DEFAULT_TIMEZONE,
    theme: 'light',
    notificationsEnabled: true,
    reminderTime: '20:00',
    weekStartsOn: 'sunday',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  batch.set(profileRef, profile);

  // Cycles
  for (const c of INITIAL_CYCLES) {
    const cycleRef = doc(db, 'users', userId, 'cycles', c.id);
    batch.set(cycleRef, { ...c, userId });
  }

  // Routines
  for (const r of INITIAL_ROUTINES) {
    const routineRef = doc(db, 'users', userId, 'routines', r.id);
    batch.set(routineRef, { ...r, userId });
  }

  // History records
  const sampleRecords = generateInitialRecords(userId);
  for (const rec of sampleRecords) {
    const recRef = doc(db, 'users', userId, 'records', rec.id);
    batch.set(recRef, rec);
  }

  await batch.commit();
}

/**
 * Delete all private user data in Cloud Firestore (for Account deletion / Reset)
 */
export async function deleteUserCloudData(userId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Records
    const recordsSnap = await getDocs(collection(db, 'users', userId, 'records'));
    recordsSnap.forEach((d) => batch.delete(d.ref));

    // Cycles
    const cyclesSnap = await getDocs(collection(db, 'users', userId, 'cycles'));
    cyclesSnap.forEach((d) => batch.delete(d.ref));

    // Routines
    const routinesSnap = await getDocs(collection(db, 'users', userId, 'routines'));
    routinesSnap.forEach((d) => batch.delete(d.ref));

    // Profile
    batch.delete(doc(db, 'users', userId));

    await batch.commit();

    // Clear local storage
    localStorage.removeItem(`${LS_CYCLES_KEY}_${userId}`);
    localStorage.removeItem(`${LS_ROUTINES_KEY}_${userId}`);
    localStorage.removeItem(`${LS_RECORDS_KEY}_${userId}`);
    localStorage.removeItem(`${LS_PROFILE_KEY}_${userId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
  }
}
