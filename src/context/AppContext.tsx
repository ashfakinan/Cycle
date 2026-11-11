import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { auth, googleProvider } from '../lib/firebase';
import {
  Cycle,
  WeeklyRoutine,
  ActivityRecord,
  UserProfile,
  ActivityStatus,
  ScheduleType,
  SyncState,
} from '../types';
import {
  subscribeToCycles,
  subscribeToRoutines,
  subscribeToRecords,
  subscribeToUserProfile,
  saveCycle,
  deleteCycle,
  saveRoutine,
  deleteRoutine,
  saveRecord,
  saveUserProfile,
  seedInitialUserData,
  deleteUserCloudData,
  INITIAL_CYCLES,
  INITIAL_ROUTINES,
  generateInitialRecords,
  getLocalData,
  setLocalData,
} from '../lib/storage';
import { getTodayString, DEFAULT_TIMEZONE } from '../lib/dateUtils';
import { calculateCycleProgress } from '../lib/cycleEngine';

interface ToastInfo {
  id: number;
  message: string;
  type: 'info' | 'done' | 'miss';
}

interface AppContextValue {
  user: User | null;
  authLoading: boolean;
  syncState: SyncState;
  profile: UserProfile;
  cycles: Cycle[];
  routines: WeeklyRoutine[];
  records: ActivityRecord[];
  todayStr: string;
  selectedDate: string;
  activeScreen: 'dashboard' | 'calendar' | 'cycles' | 'routines' | 'analytics' | 'settings';
  toastInfo: ToastInfo | null;
  isOnline: boolean;
  setSelectedDate: (date: string) => void;
  setActiveScreen: (screen: 'dashboard' | 'calendar' | 'cycles' | 'routines' | 'analytics' | 'settings') => void;
  updateActivityStatus: (
    dateStr: string,
    scheduleId: string,
    scheduleName: string,
    activityId: string,
    activityName: string,
    type: ScheduleType,
    status: ActivityStatus
  ) => Promise<void>;
  addOrUpdateCycle: (cycle: Cycle) => Promise<void>;
  removeCycle: (cycleId: string) => Promise<void>;
  setCyclePaused: (cycleId: string, paused: boolean) => Promise<void>;
  restartCycle: (cycleId: string) => Promise<void>;
  addOrUpdateRoutine: (routine: WeeklyRoutine) => Promise<void>;
  removeRoutine: (routineId: string) => Promise<void>;
  setRoutinePaused: (routineId: string, paused: boolean) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleTheme: () => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  showToast: (message: string, type?: 'info' | 'done' | 'miss') => void;
  resetAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_PROFILE: UserProfile = {
  userId: 'guest',
  displayName: 'Student',
  email: '',
  timezone: DEFAULT_TIMEZONE,
  theme: 'light',
  notificationsEnabled: true,
  reminderTime: '20:00',
  weekStartsOn: 'sunday',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>('online_synced');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [profile, setProfile] = useState<UserProfile>(() =>
    getLocalData('cycle_app_guest_profile', DEFAULT_PROFILE)
  );
  const [cycles, setCycles] = useState<Cycle[]>(() =>
    getLocalData('cycle_app_guest_cycles', INITIAL_CYCLES)
  );
  const [routines, setRoutines] = useState<WeeklyRoutine[]>(() =>
    getLocalData('cycle_app_guest_routines', INITIAL_ROUTINES)
  );
  const [records, setRecords] = useState<ActivityRecord[]>(() =>
    getLocalData('cycle_app_guest_records', generateInitialRecords('guest'))
  );

  const [activeScreen, setActiveScreen] = useState<
    'dashboard' | 'calendar' | 'cycles' | 'routines' | 'analytics' | 'settings'
  >('dashboard');

  const todayStr = getTodayString(profile.timezone || DEFAULT_TIMEZONE);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'done' | 'miss' = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    const id = Date.now();
    setToastInfo({ id, message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToastInfo(null);
    }, 2800);
  }, []);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncState('online_synced');
      showToast('Connection restored. Synced with cloud.', 'done');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncState('offline');
      showToast('Working offline. All changes saved locally.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.dataset.theme = profile.theme;
  }, [profile.theme]);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setSyncState('syncing');
      } else {
        setSyncState('online_synced');
      }
    });

    return () => unsub();
  }, []);

  // Sync with Firestore when logged in
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    setSyncState('syncing');

    let isSubscribed = true;

    // Profile listener
    const unsubProfile = subscribeToUserProfile(uid, (serverProfile) => {
      if (!isSubscribed) return;
      if (serverProfile) {
        setProfile(serverProfile);
      } else {
        // Initial setup for new user
        seedInitialUserData(uid).catch((err) => {
          console.error('Error seeding new user:', err);
        });
      }
    });

    // Cycles listener
    const unsubCycles = subscribeToCycles(uid, (serverCycles) => {
      if (!isSubscribed) return;
      setCycles(serverCycles);
      setSyncState('online_synced');
    });

    // Routines listener
    const unsubRoutines = subscribeToRoutines(uid, (serverRoutines) => {
      if (!isSubscribed) return;
      setRoutines(serverRoutines);
      setSyncState('online_synced');
    });

    // Records listener
    const unsubRecords = subscribeToRecords(uid, (serverRecords) => {
      if (!isSubscribed) return;
      setRecords(serverRecords);
      setSyncState('online_synced');
    });

    return () => {
      isSubscribed = false;
      unsubProfile();
      unsubCycles();
      unsubRoutines();
      unsubRecords();
    };
  }, [user]);

  // Google Sign-In
  const signInWithGoogle = useCallback(async () => {
    try {
      setSyncState('syncing');
      const result = await signInWithPopup(auth, googleProvider);
      showToast(`Welcome, ${result.user.displayName || 'friend'}! Synced to cloud.`, 'done');
    } catch (err: unknown) {
      setSyncState('error');
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      showToast(msg, 'miss');
    }
  }, [showToast]);

  // Sign out
  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      showToast('Signed out. Local guest mode active.', 'info');
    } catch (err: unknown) {
      console.error(err);
    }
  }, [showToast]);

  // Update Activity Status
  const updateActivityStatus = useCallback(
    async (
      dateStr: string,
      scheduleId: string,
      scheduleName: string,
      activityId: string,
      activityName: string,
      type: ScheduleType,
      status: ActivityStatus
    ) => {
      const recordId = `${dateStr}_${type}_${activityId}`;
      const prevRecord = records.find((r) => r.id === recordId);
      const wasCompleted = prevRecord?.status === 'completed';
      const isNowCompleted = status === 'completed';

      // Optimistic local update
      setRecords((prev) => {
        const next = [...prev];
        const idx = next.findIndex((r) => r.id === recordId);
        const updated: ActivityRecord = {
          id: recordId,
          userId: user ? user.uid : 'guest',
          date: dateStr,
          type,
          scheduleId,
          scheduleName,
          activityId,
          activityName,
          status,
          createdAt: prevRecord ? prevRecord.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (idx >= 0) {
          next[idx] = updated;
        } else {
          next.push(updated);
        }

        if (!user) {
          setLocalData('cycle_app_guest_records', next);
        }
        return next;
      });

      // Check if this completion advances a cycle
      if (type === 'cycle' && isNowCompleted && !wasCompleted) {
        const cycle = cycles.find((c) => c.id === scheduleId);
        if (cycle) {
          // Check progress with the new completed record included
          const currentRecords = records.filter((r) => r.id !== recordId);
          currentRecords.push({
            id: recordId,
            userId: user ? user.uid : 'guest',
            date: dateStr,
            type,
            scheduleId,
            scheduleName,
            activityId,
            activityName,
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          const beforeProg = calculateCycleProgress(cycle, records);
          const afterProg = calculateCycleProgress(cycle, currentRecords);

          if (
            beforeProg.currentActivity &&
            afterProg.currentActivity &&
            beforeProg.currentActivity.id !== afterProg.currentActivity.id
          ) {
            // Milestone reached!
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 },
              colors: ['#4E7A5D', '#8BB99A', '#C7A56D'],
            });
            showToast(
              `Target completed for ${beforeProg.currentActivity.name}! Next up: ${afterProg.currentActivity.name}`,
              'done'
            );
          } else {
            showToast(`${activityName} marked completed for ${dateStr}`, 'done');
          }
        }
      } else if (status === 'completed') {
        showToast(`${activityName} marked completed`, 'done');
      } else if (status === 'not_done') {
        showToast(`${activityName} marked not done`, 'miss');
      } else {
        showToast(`${activityName} marked pending`, 'info');
      }

      // Persist to Cloud if authenticated
      if (user) {
        try {
          await saveRecord(
            user.uid,
            dateStr,
            scheduleId,
            scheduleName,
            activityId,
            activityName,
            type,
            status
          );
        } catch (err) {
          console.error('Error saving record to Firestore:', err);
          setSyncState('error');
        }
      }
    },
    [user, records, cycles, showToast]
  );

  // Add / Edit Cycle
  const addOrUpdateCycle = useCallback(
    async (cycle: Cycle) => {
      setCycles((prev) => {
        const idx = prev.findIndex((c) => c.id === cycle.id);
        const next = [...prev];
        if (idx >= 0) {
          next[idx] = cycle;
        } else {
          next.push(cycle);
        }
        if (!user) setLocalData('cycle_app_guest_cycles', next);
        return next;
      });

      if (user) {
        await saveCycle(user.uid, cycle);
      }
      showToast(`Cycle "${cycle.name}" saved`, 'done');
    },
    [user, showToast]
  );

  // Remove Cycle
  const removeCycle = useCallback(
    async (cycleId: string) => {
      setCycles((prev) => {
        const next = prev.filter((c) => c.id !== cycleId);
        if (!user) setLocalData('cycle_app_guest_cycles', next);
        return next;
      });

      if (user) {
        await deleteCycle(user.uid, cycleId);
      }
      showToast('Cycle archived and removed', 'info');
    },
    [user, showToast]
  );

  // Pause / Resume Cycle
  const setCyclePaused = useCallback(
    async (cycleId: string, paused: boolean) => {
      const cycle = cycles.find((c) => c.id === cycleId);
      if (!cycle) return;
      const updated: Cycle = {
        ...cycle,
        status: paused ? 'paused' : 'active',
        updatedAt: new Date().toISOString(),
      };
      await addOrUpdateCycle(updated);
      showToast(paused ? `Paused "${cycle.name}"` : `Resumed "${cycle.name}"`, 'info');
    },
    [cycles, addOrUpdateCycle, showToast]
  );

  // Restart Cycle (archive historical completed count for this cycle or reset progress)
  const restartCycle = useCallback(
    async (cycleId: string) => {
      const cycle = cycles.find((c) => c.id === cycleId);
      if (!cycle) return;
      // Filter out completed records for this cycle to reset counter
      setRecords((prev) => {
        const next = prev.filter((r) => r.scheduleId !== cycleId);
        if (!user) setLocalData('cycle_app_guest_records', next);
        return next;
      });
      showToast(`Restarted progress for "${cycle.name}"`, 'done');
    },
    [cycles, user, showToast]
  );

  // Add / Edit Routine
  const addOrUpdateRoutine = useCallback(
    async (routine: WeeklyRoutine) => {
      setRoutines((prev) => {
        const idx = prev.findIndex((r) => r.id === routine.id);
        const next = [...prev];
        if (idx >= 0) {
          next[idx] = routine;
        } else {
          next.push(routine);
        }
        if (!user) setLocalData('cycle_app_guest_routines', next);
        return next;
      });

      if (user) {
        await saveRoutine(user.uid, routine);
      }
      showToast(`Routine "${routine.name}" saved`, 'done');
    },
    [user, showToast]
  );

  // Remove Routine
  const removeRoutine = useCallback(
    async (routineId: string) => {
      setRoutines((prev) => {
        const next = prev.filter((r) => r.id !== routineId);
        if (!user) setLocalData('cycle_app_guest_routines', next);
        return next;
      });

      if (user) {
        await deleteRoutine(user.uid, routineId);
      }
      showToast('Weekly routine removed', 'info');
    },
    [user, showToast]
  );

  // Pause / Resume Routine
  const setRoutinePaused = useCallback(
    async (routineId: string, paused: boolean) => {
      const routine = routines.find((r) => r.id === routineId);
      if (!routine) return;
      const updated: WeeklyRoutine = {
        ...routine,
        status: paused ? 'paused' : 'active',
        updatedAt: new Date().toISOString(),
      };
      await addOrUpdateRoutine(updated);
      showToast(paused ? `Paused "${routine.name}"` : `Resumed "${routine.name}"`, 'info');
    },
    [routines, addOrUpdateRoutine, showToast]
  );

  // Update Profile
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...updates, updatedAt: new Date().toISOString() };
        if (!user) setLocalData('cycle_app_guest_profile', next);
        return next;
      });

      if (user) {
        await saveUserProfile(user.uid, updates);
      }
      showToast('Settings saved', 'done');
    },
    [user, showToast]
  );

  // Toggle Theme
  const toggleTheme = useCallback(() => {
    const nextTheme = profile.theme === 'dark' ? 'light' : 'dark';
    updateProfile({ theme: nextTheme });
  }, [profile.theme, updateProfile]);

  // Reset all data
  const resetAllData = useCallback(async () => {
    if (user) {
      await deleteUserCloudData(user.uid);
      await seedInitialUserData(user.uid);
    } else {
      localStorage.removeItem('cycle_app_guest_cycles');
      localStorage.removeItem('cycle_app_guest_routines');
      localStorage.removeItem('cycle_app_guest_records');
      localStorage.removeItem('cycle_app_guest_profile');
      setCycles(INITIAL_CYCLES);
      setRoutines(INITIAL_ROUTINES);
      setRecords(generateInitialRecords('guest'));
      setProfile(DEFAULT_PROFILE);
    }
    showToast('Data reset to original defaults', 'info');
  }, [user, showToast]);

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        syncState,
        profile,
        cycles,
        routines,
        records,
        todayStr,
        selectedDate,
        activeScreen,
        toastInfo,
        isOnline,
        setSelectedDate,
        setActiveScreen,
        updateActivityStatus,
        addOrUpdateCycle,
        removeCycle,
        setCyclePaused,
        restartCycle,
        addOrUpdateRoutine,
        removeRoutine,
        setRoutinePaused,
        updateProfile,
        toggleTheme,
        signInWithGoogle,
        signOutUser,
        showToast,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
