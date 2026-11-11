import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { MobileHeader, MobileBottomNav } from './components/MobileNav';
import { DashboardScreen } from './screens/DashboardScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { CyclesScreen } from './screens/CyclesScreen';
import { RoutinesScreen } from './screens/RoutinesScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CycleModal } from './components/Modals/CycleModal';
import { RoutineModal } from './components/Modals/RoutineModal';
import { AuthModal } from './components/AuthModal';
import { Cycle, WeeklyRoutine } from './types';
import { Check, AlertCircle, Info, CloudOff } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    toastInfo,
    isOnline,
    addOrUpdateCycle,
    addOrUpdateRoutine,
    user,
    authLoading,
    showAuthModal,
    setShowAuthModal,
  } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal states
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);

  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<WeeklyRoutine | null>(null);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === '1') setActiveScreen('dashboard');
      else if (e.key === '2') setActiveScreen('calendar');
      else if (e.key === '3') setActiveScreen('cycles');
      else if (e.key === '4') setActiveScreen('routines');
      else if (e.key === '5') setActiveScreen('analytics');
      else if (e.key === '6') setActiveScreen('settings');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveScreen]);

  const handleOpenNewCycle = () => {
    setEditingCycle(null);
    setIsCycleModalOpen(true);
  };

  const handleEditCycle = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setIsCycleModalOpen(true);
  };

  const handleOpenNewRoutine = () => {
    setEditingRoutine(null);
    setIsRoutineModalOpen(true);
  };

  const handleEditRoutine = (routine: WeeklyRoutine) => {
    setEditingRoutine(routine);
    setIsRoutineModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans antialiased selection:bg-[var(--accent-bg)] selection:text-[var(--accent-text)]">
      {/* Sidebar for Desktop */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Mobile Header */}
        <MobileHeader
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenNewCycle={handleOpenNewCycle}
        />

        {/* Offline notification badge if disconnected */}
        {!isOnline && (
          <div className="bg-amber-500 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-xs">
            <CloudOff className="w-3.5 h-3.5" />
            <span>Working in offline mode. All progress is safely saved locally and will sync when back online.</span>
          </div>
        )}

        {/* Active Screen View */}
        <main className="flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 overflow-y-auto">
          {activeScreen === 'dashboard' && (
            <DashboardScreen
              onOpenNewCycle={handleOpenNewCycle}
              onOpenNewRoutine={handleOpenNewRoutine}
            />
          )}

          {activeScreen === 'calendar' && <CalendarScreen />}

          {activeScreen === 'cycles' && (
            <CyclesScreen
              onOpenNewCycle={handleOpenNewCycle}
              onEditCycle={handleEditCycle}
            />
          )}

          {activeScreen === 'routines' && (
            <RoutinesScreen
              onOpenNewRoutine={handleOpenNewRoutine}
              onEditRoutine={handleEditRoutine}
            />
          )}

          {activeScreen === 'analytics' && <AnalyticsScreen />}

          {activeScreen === 'settings' && <SettingsScreen />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Create / Edit Cycle Modal */}
      <CycleModal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        initialCycle={editingCycle}
        onSave={addOrUpdateCycle}
      />

      {/* Create / Edit Routine Modal */}
      <RoutineModal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        initialRoutine={editingRoutine}
        onSave={addOrUpdateRoutine}
      />

      {/* Account Registration & Log In Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Toast Notification */}
      {toastInfo && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-toast"
        >
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-medium text-white shadow-xl ${
              toastInfo.type === 'done'
                ? 'bg-[var(--done)]'
                : toastInfo.type === 'miss'
                ? 'bg-[var(--miss)]'
                : 'bg-[var(--text)]'
            }`}
          >
            {toastInfo.type === 'done' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
            {toastInfo.type === 'miss' && <AlertCircle className="w-3.5 h-3.5" />}
            {toastInfo.type === 'info' && <Info className="w-3.5 h-3.5" />}
            <span>{toastInfo.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
