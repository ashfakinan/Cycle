import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Calendar,
  RotateCcw,
  CalendarDays,
  BarChart3,
  Settings,
  Menu,
} from 'lucide-react';
import { SyncIndicator } from './SyncIndicator';
import { formatMediumDate } from '../lib/dateUtils';

export const MobileHeader: React.FC<{
  onOpenSidebar: () => void;
  onOpenNewCycle: () => void;
}> = ({ onOpenSidebar, onOpenNewCycle }) => {
  const { todayStr, user, setShowAuthModal } = useApp();

  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--border)]">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open navigation menu"
          className="p-1.5 rounded-md text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)] border border-[var(--border)]"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-[var(--accent)] flex items-center justify-center text-white shrink-0">
            <svg viewBox="0 0 24 24" className="w-3 h-3 stroke-current fill-none stroke-2">
              <path d="M12 2a9 9 0 0 1 9 9" strokeLinecap="round" />
              <path d="M12 2a9 9 0 1 0 9 9" strokeLinecap="round" strokeDasharray="2 3" />
            </svg>
          </div>
          <span className="font-heading font-bold text-sm tracking-tight text-[var(--text)]">
            Cycle
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!user ? (
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="px-2 py-1 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg-hover)]"
          >
            Log In
          </button>
        ) : (
          <span className="text-[11px] font-medium text-[var(--text-2)] px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)]">
            {formatMediumDate(todayStr)}
          </span>
        )}
        <SyncIndicator />
        <button
          type="button"
          onClick={onOpenNewCycle}
          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
        >
          ＋ New
        </button>
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC = () => {
  const { activeScreen, setActiveScreen } = useApp();

  const tabs = [
    { id: 'dashboard', label: 'Today', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'cycles', label: 'Cycles', icon: RotateCcw },
    { id: 'routines', label: 'Routines', icon: CalendarDays },
    { id: 'analytics', label: 'Insights', icon: BarChart3 },
    { id: 'settings', label: 'More', icon: Settings },
  ] as const;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--surface)] border-t border-[var(--border)] px-1 pt-1 pb-[max(6px,env(safe-area-inset-bottom))] shadow-lg"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeScreen === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveScreen(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[50px] py-1 px-1 rounded-md transition-colors ${
                isActive
                  ? 'text-[var(--accent)] font-semibold'
                  : 'text-[var(--text-3)] hover:text-[var(--text-2)]'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[var(--accent)] stroke-[2.2]' : 'stroke-[1.75]'}`}
              />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
