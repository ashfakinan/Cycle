import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowIOSModal(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Install Cycle on your device"
        className={`inline-flex items-center gap-1.5 rounded-md font-medium transition-colors ${
          compact
            ? 'px-2 py-1 text-xs bg-[var(--bg-hover)] text-[var(--text-2)] hover:text-[var(--text)]'
            : 'px-3 py-1.5 text-xs bg-[var(--accent-bg)] text-[var(--accent-text)] hover:bg-[var(--accent)] hover:text-white'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>

      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xl text-[var(--text)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Install Cycle</h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-2)] mb-4 leading-relaxed">
              Install Cycle to your home screen for quick offline access and full-screen distraction-free experience.
            </p>

            {isIOS ? (
              <div className="space-y-2.5 text-xs text-[var(--text)] bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlusSquare className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>2. Scroll down and choose <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[var(--text-2)] bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border)]">
                Click the install button in your browser address bar or menu to add Cycle as a standalone desktop/mobile app.
              </div>
            )}

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full py-2 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
