import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, UserPlus, X, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signup',
}) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useApp();

  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please provide your email and password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(displayName.trim() || 'Student', trimmedEmail, password);
      } else {
        await signInWithEmail(trimmedEmail, password);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      // Format friendly message
      if (msg.includes('email-already-in-use')) {
        setError('This email is already registered. Please switch to Log In.');
      } else if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.includes('user-not-found')) {
        setError('No account found with this email. Please create an account.');
      } else if (msg.includes('operation-not-allowed')) {
        setError('Email sign-in is not enabled on this project. Please use "Continue with Google".');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden text-[var(--text)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-subtle)]/70">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold">
              C
            </div>
            <h2 className="text-sm font-bold font-heading">
              {mode === 'signup' ? 'Create Cycle Account' : 'Welcome Back — Log In'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[var(--border)] bg-[var(--bg)] text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2.5 font-medium transition-colors text-center border-b-2 ${
              mode === 'signup'
                ? 'border-[var(--accent)] text-[var(--accent)] font-semibold bg-[var(--surface)]'
                : 'border-transparent text-[var(--text-3)] hover:text-[var(--text)]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2.5 font-medium transition-colors text-center border-b-2 ${
              mode === 'login'
                ? 'border-[var(--accent)] text-[var(--accent)] font-semibold bg-[var(--surface)]'
                : 'border-transparent text-[var(--text-3)] hover:text-[var(--text)]'
            }`}
          >
            Log In
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-md text-xs bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2 px-3 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-hover)] text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[var(--border)] w-full" />
            <span className="bg-[var(--surface)] px-2 text-[11px] text-[var(--text-3)] absolute">
              or with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-2)] mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Inan"
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[var(--text-2)] mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-2)] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 text-xs font-semibold rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : mode === 'signup'
                ? 'Create Account'
                : 'Log In'}
            </button>
          </form>

          {/* Continue as guest */}
          <div className="pt-2 text-center border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[var(--text-3)] hover:text-[var(--text)] inline-flex items-center gap-1"
            >
              <span>Continue as guest without account</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
