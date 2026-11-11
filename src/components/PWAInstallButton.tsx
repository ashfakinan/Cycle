import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, ExternalLink, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed & opened as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Check if inside an iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

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
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  if (isInstalled) {
    return null;
  }

  const appUrl = typeof window !== 'undefined' ? window.location.href : '/';

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Install Cycle as a Progressive Web App"
        className={`inline-flex items-center gap-1.5 rounded-md font-medium transition-colors ${
          compact
            ? 'px-2 py-1 text-xs bg-[var(--accent-bg)] text-[var(--accent-text)] hover:bg-[var(--accent)] hover:text-white'
            : 'px-3 py-1.5 text-xs bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-2xs'
        }`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install App</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl text-[var(--text)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold">Install Cycle PWA</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-2)] mb-4 leading-relaxed">
              Install Cycle to your home screen or desktop for fast offline access and full-screen distraction-free experience.
            </p>

            {isInIframe && (
              <div className="mb-3 p-3 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent)]/30 text-xs space-y-2">
                <div className="font-semibold text-[var(--accent-text)] flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>Preview Environment Detected</span>
                </div>
                <p className="text-[11.5px] text-[var(--text-2)] leading-relaxed">
                  Browsers require opening the direct app URL outside of the preview frame to install the PWA.
                </p>
                <a
                  href={appUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors text-xs"
                >
                  <span>Open Full App URL</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {isIOS ? (
              <div className="space-y-2.5 text-xs text-[var(--text)] bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border)]">
                <div className="font-semibold text-[var(--text)]">Safari on iPhone / iPad:</div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlusSquare className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-[var(--text)] bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border)]">
                <div className="font-semibold text-[var(--text)]">Chrome / Edge / Android:</div>
                <div className="text-[11.5px] text-[var(--text-2)] leading-relaxed">
                  1. Tap or click the browser menu (<strong>⋮</strong> or <strong>⋯</strong>).<br />
                  2. Select <strong>Install Cycle</strong> or <strong>Add to Home screen</strong>.
                </div>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full py-2 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
