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

export const INITIAL_CYCLES: Cycle[] = [];

export const INITIAL_ROUTINES: WeeklyRoutine[] = [];

/**
 * Clean empty history for new users
 */
export function generateInitialRecords(userId: string): ActivityRecord[] {
  return [];
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
  // Only initialize the user's profile with clean defaults
  const profileRef = doc(db, 'users', userId);
  const profile: UserProfile = {
    userId,
    displayName: auth.currentUser?.displayName || 'Student',
    email: auth.currentUser?.email || '',
    timezone: DEFAULT_TIMEZONE,
    theme: 'light',
    notificationsEnabled: true,
    reminderTime: '20:00',
    weekStartsOn: 'sunday',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(profileRef, profile);
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
