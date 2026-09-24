import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  ArrowRight, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  UserCheck,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const { 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    signInLocally, 
    authError, 
    clearAuthError 
  } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync mode with initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFormError(null);
      clearAuthError();
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearAuthError();

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(cleanEmail, password, displayName.trim());
      } else {
        await signInWithEmail(cleanEmail, password);
      }
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormError(error?.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSignIn = async () => {
    setFormError(null);
    clearAuthError();
    setIsSubmitting(true);
    try {
      await signInLocally('guest@bolex.ai', 'Guest User');
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setFormError(error?.message || 'Guest sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    clearAuthError();
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      if (error?.message) {
        setFormError(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSwitchToSignUpSuggested = formError && (
    formError.includes('switch to "Create Account"') || 
    formError.includes('not have an account')
  );

  const isSwitchToSignInSuggested = formError && (
    formError.includes('already exists') || 
    formError.includes('switch to "Sign In"')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-neutral-950 font-bold shadow-sm shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                {mode === 'signin' ? 'Sign in to Bolex AI' : 'Create your Bolex account'}
              </h2>
              <p className="text-xs text-neutral-400">
                {mode === 'signin' 
                  ? 'Access your saved chats, folders, and custom roles' 
                  : 'Sync your profile, preferences, and unlimited history'}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Segmented Mode Selector */}
          <div className="p-1 bg-neutral-950 rounded-xl border border-neutral-800 flex gap-1">
            <button
              id="auth-tab-signin"
              type="button"
              onClick={() => {
                setMode('signin');
                setFormError(null);
                clearAuthError();
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setMode('signup');
                setFormError(null);
                clearAuthError();
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Quick Google Sign In */}
          <button
            id="google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-medium text-xs sm:text-sm flex items-center justify-center gap-3 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-neutral-800 flex-1" />
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">Or with Email</span>
            <div className="h-px bg-neutral-800 flex-1" />
          </div>

          {/* Error notice & smart mode switch prompt */}
          {(formError || authError) && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col gap-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="leading-relaxed flex-1">
                  {formError || authError}
                </div>
              </div>

              {isSwitchToSignUpSuggested && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setFormError(null);
                    clearAuthError();
                  }}
                  className="self-start px-2.5 py-1 rounded-md bg-amber-500 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 transition-colors hover:bg-amber-400 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Switch to Create Account</span>
                </button>
              )}

              {isSwitchToSignInSuggested && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setFormError(null);
                    clearAuthError();
                  }}
                  className="self-start px-2.5 py-1 rounded-md bg-amber-500 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 transition-colors hover:bg-amber-400 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Switch to Sign In</span>
                </button>
              )}
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Display Name <span className="text-neutral-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="auth-name-input"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/80 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/80 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/80 transition-colors"
                />
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Must be at least 6 characters
              </span>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Bolex' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security footnote */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Encrypted cloud authentication & Firestore security</span>
          </div>

          {/* Guest fallback option */}
          <div className="text-center pt-2 border-t border-neutral-800/60">
            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={isSubmitting}
              className="text-[11px] text-neutral-400 hover:text-neutral-300 transition-colors hover:underline"
            >
              Continue as guest in offline mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
