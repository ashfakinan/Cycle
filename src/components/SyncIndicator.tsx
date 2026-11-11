import React from 'react';
import { useApp } from '../context/AppContext';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

export const SyncIndicator: React.FC = () => {
  const { syncState, user, isOnline } = useApp();

  if (!isOnline || syncState === 'offline') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
        title="Working offline. Changes are saved locally and will sync when reconnected."
      >
        <CloudOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span>Offline</span>
      </div>
    );
  }

  if (syncState === 'syncing') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--bg-subtle)] text-[var(--text-2)] border border-[var(--border)]"
        title="Syncing changes with cloud..."
      >
        <RefreshCw className="w-3 h-3 animate-spin text-[var(--accent)]" />
        <span>Syncing</span>
      </div>
    );
  }

  if (syncState === 'error') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900"
        title="Sync issue detected. Local copy preserved."
      >
        <AlertCircle className="w-3 h-3 text-red-500" />
        <span>Sync issue</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent-bg)] text-[var(--accent-text)] border border-transparent"
      title={user ? `Synced with Google Cloud (${user.email || 'authenticated'})` : 'Local storage active (sign in to sync across devices)'}
    >
      <Cloud className="w-3 h-3 text-[var(--accent)]" />
      <span>{user ? 'Cloud synced' : 'Saved'}</span>
    </div>
  );
};
