import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Moon,
  Sun,
  Bell,
  Globe,
  Download,
  Trash2,
  RotateCcw,
  LogIn,
  LogOut,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { PWAInstallButton } from '../components/PWAInstallButton';

export const SettingsScreen: React.FC = () => {
  const {
    profile,
    updateProfile,
    toggleTheme,
    user,
    signInWithGoogle,
    signOutUser,
    cycles,
    routines,
    records,
    resetAllData,
    showToast,
  } = useApp();

  const [displayName, setDisplayName] = useState(profile.displayName || 'Student');
  const [timezone, setTimezone] = useState(profile.timezone || 'Asia/Dhaka');
  const [weekStartsOn, setWeekStartsOn] = useState<'sunday' | 'monday'>(
    profile.weekStartsOn || 'sunday'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile.notificationsEnabled ?? true
  );
  const [reminderTime, setReminderTime] = useState(profile.reminderTime || '20:00');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveProfile = async () => {
    await updateProfile({
      displayName: displayName.trim() || 'Student',
      timezone,
      weekStartsOn,
      notificationsEnabled,
      reminderTime,
    });
  };

  const handleRequestNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast('Notification permission granted!', 'done');
        updateProfile({ notificationsEnabled: true });
        setNotificationsEnabled(true);
      } else {
        showToast('Notifications blocked by browser settings', 'miss');
      }
    } else {
      showToast('Notifications are not supported in this browser', 'info');
    }
  };

  const handleExportJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      user: {
        displayName: profile.displayName,
        timezone: profile.timezone,
      },
      cycles,
      routines,
      records,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cycle-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON backup exported', 'done');
  };

  const handleExportCSV = () => {
    let csv = 'Date,Schedule Type,Schedule Name,Activity Name,Status\n';
    for (const r of records) {
      csv += `"${r.date}","${r.type}","${r.scheduleName}","${r.activityName}","${r.status}"\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cycle-activity-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Activity history CSV exported', 'done');
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold font-heading tracking-tight text-[var(--text)]">
          Settings
        </h1>
        <p className="text-xs text-[var(--text-3)] mt-0.5">
          Account sync, preferences, notifications, and data management
        </p>
      </div>

      {/* 1. Account & Cloud Sync */}
      <section className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <User className="w-4 h-4 text-[var(--accent)]" />
          <span>Account & Cloud Synchronization</span>
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] font-bold flex items-center justify-center text-sm border border-[var(--accent)]/30">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--text)]">
                  {user.displayName || 'Google Account'}
                </div>
                <div className="text-[11px] text-[var(--text-3)] font-mono">
                  {user.email}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] space-y-2.5">
            <div className="text-xs text-[var(--text-2)]">
              You are currently using <strong>Local Storage</strong>. Sign in with Google to synchronize your cycles, routines, and progress across all your devices in real time.
            </div>
            <button
              type="button"
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>
          </div>
        )}

        {/* Display Name Input */}
        <div className="space-y-1.5 pt-2">
          <label className="block text-xs font-medium text-[var(--text-2)]">
            Display Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
            />
            <button
              type="button"
              onClick={handleSaveProfile}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </section>

      {/* 2. Appearance */}
      <section className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[var(--text)]">Appearance Theme</div>
            <div className="text-[11px] text-[var(--text-3)]">
              Switch between calm natural light and low-glare dark mode
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-hover)] text-[var(--text)] transition-colors"
          >
            {profile.theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Dark (Switch to Light)</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[var(--text-2)]" />
                <span>Light (Switch to Dark)</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* 3. Timezone & Region */}
      <section className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Globe className="w-4 h-4 text-[var(--accent)]" />
          <span>Timezone & Regional Preferences</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-[var(--text-2)]">
              Local Timezone (Bangladesh Default)
            </label>
            <select
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value);
                updateProfile({ timezone: e.target.value });
              }}
              className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
            >
              <option value="Asia/Dhaka">Asia/Dhaka (UTC+6, Bangladesh)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30, India)</option>
              <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
              <option value="UTC">UTC (Universal Coordinated Time)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-[var(--text-2)]">
              Week Starts On
            </label>
            <select
              value={weekStartsOn}
              onChange={(e) => {
                const val = e.target.value as 'sunday' | 'monday';
                setWeekStartsOn(val);
                updateProfile({ weekStartsOn: val });
              }}
              className="w-full px-3 py-2 text-xs rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
            >
              <option value="sunday">Sunday (Academic / BD)</option>
              <option value="monday">Monday</option>
            </select>
          </div>
        </div>
      </section>

      {/* 4. Notifications & Reminders */}
      <section className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Bell className="w-4 h-4 text-[var(--accent)]" />
          <span>Gentle Notifications & Reminders</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[var(--text)]">Daily Study Reminders</div>
            <div className="text-[11px] text-[var(--text-3)]">
              Receive a gentle reminder to check in today's activities. Never changes status automatically.
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !notificationsEnabled;
              setNotificationsEnabled(next);
              updateProfile({ notificationsEnabled: next });
              if (next) handleRequestNotifications();
            }}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              notificationsEnabled ? 'bg-[var(--accent)]' : 'bg-[var(--border-mid)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {notificationsEnabled && (
          <div className="flex items-center gap-3 pt-1">
            <label className="text-xs text-[var(--text-2)]">Reminder Time:</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => {
                setReminderTime(e.target.value);
                updateProfile({ reminderTime: e.target.value });
              }}
              className="px-2.5 py-1 text-xs rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)]"
            />
            <button
              type="button"
              onClick={handleRequestNotifications}
              className="text-xs text-[var(--accent)] hover:underline ml-auto"
            >
              Check Permissions
            </button>
          </div>
        )}
      </section>

      {/* 5. PWA Installation */}
      <section className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-[var(--text)]">Install Application</div>
          <div className="text-[11px] text-[var(--text-3)]">
            Run Cycle standalone on your home screen or desktop with offline caching
          </div>
        </div>

        <PWAInstallButton />
      </section>

      {/* 6. Data Management & Export */}
      <section className="p-4 sm:p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Download className="w-4 h-4 text-[var(--accent)]" />
          <span>Data Management & Backup</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-hover)] text-[var(--text)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-hover)] text-[var(--text)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Reset application to sample demo cycles and routines?')) {
                resetAllData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>

        {/* Delete Cloud Data */}
        <div className="pt-3 border-t border-[var(--border)]">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete account & wipe cloud data</span>
            </button>
          ) : (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Are you sure? This will permanently delete all your private cycles, routines, and check-ins.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 text-xs rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await resetAllData();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Permanently Delete Data
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer Info */}
      <div className="text-center text-xs text-[var(--text-3)] pt-4 pb-8">
        Cycle · v1.0.0 · Personal study rhythm & cycle management · Made for calm progress
      </div>
    </div>
  );
};
