import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  RotateCcw,
  CalendarDays,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogIn,
} from 'lucide-react';
import { SyncIndicator } from './SyncIndicator';
import { PWAInstallButton } from './PWAInstallButton';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeScreen,
    setActiveScreen,
    profile,
    toggleTheme,
    user,
    setShowAuthModal,
    setShowGuide,
  } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'cycles', label: 'My Cycles', icon: RotateCcw },
    { id: 'routines', label: 'Weekly Routines', icon: CalendarDays },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const handleNav = (screenId: typeof navItems[number]['id']) => {
    setActiveScreen(screenId);
    onClose();
  };

  const displayName = user?.displayName || profile.displayName || 'Student';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 w-[230px] shrink-0 h-screen flex flex-col bg-[var(--bg)] border-r border-[var(--border)] transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[var(--accent)] flex items-center justify-center text-white shrink-0 shadow-xs">
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-2">
                <path d="M12 2a9 9 0 0 1 9 9" strokeLinecap="round" />
                <path d="M12 2a9 9 0 1 0 9 9" strokeLinecap="round" strokeDasharray="2 3" />
                <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-heading font-bold text-[16px] tracking-tight text-[var(--text)]">
              Cycle
            </span>
          </div>

          <SyncIndicator />
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13.5px] font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[var(--accent-bg)] text-[var(--accent-text)] font-semibold'
                    : 'text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[var(--accent)]' : 'text-current'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.75}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions & user profile */}
        <div className="p-2.5 border-t border-[var(--border)] space-y-1 bg-[var(--bg)]">
          <button
            type="button"
            onClick={() => {
              setShowGuide(true);
              setActiveScreen('dashboard');
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-xs text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-colors text-left font-medium"
          >
            <span>📖 Instructions Guide</span>
          </button>

          <div className="px-2 py-1 flex items-center justify-between">
            <PWAInstallButton compact />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] transition-colors text-left"
          >
            {profile.theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[var(--text-2)]" />
                <span>Dark mode</span>
              </>
            )}
          </button>

          {/* User profile row */}
          {user ? (
            <button
              type="button"
              onClick={() => handleNav('settings')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-[var(--bg-hover)] transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] flex items-center justify-center text-xs font-semibold shrink-0">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-[var(--text)] truncate">
                  {displayName}
                </div>
                <div className="text-[11px] text-[var(--text-3)] truncate">
                  {user.email || 'Cloud synced'}
                </div>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] text-xs font-semibold transition-colors shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Create Account / Log In</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
