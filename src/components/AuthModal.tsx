import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  User, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, signInWithGoogle, signInGuest, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInGuest();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Guest Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-base font-bold text-slate-900 font-serif">
                {user ? 'Account & Session' : 'Authenticate with LegalLens'}
              </h2>
              <p className="text-xs text-slate-500">
                {user ? 'Secure identity and tenant isolation' : 'Sign in to analyze private legal agreements'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {user ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-950">Authenticated Session Active</h4>
                  <p className="text-xs text-emerald-800 font-mono break-all">
                    UID: {user.uid}
                  </p>
                  <p className="text-xs text-emerald-800">
                    {user.isAnonymous ? 'Guest / Anonymous Session' : user.email}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                All document analysis and grounded chat requests are cryptographically verified against your Firebase user token.
              </p>

              <button
                id="signout-button"
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Signing out...' : 'Sign Out of Session'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
                <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  LegalLens isolates all uploaded documents by verified Firebase UID. No client can access documents without a cryptographic bearer token.
                </span>
              </div>

              {/* Google Sign-In */}
              <button
                id="google-signin-button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2.5 hover:border-slate-400"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
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
                <span>{loading ? 'Authenticating...' : 'Sign In with Google'}</span>
              </button>

              {/* Guest / Anonymous Sign-In */}
              <button
                id="guest-signin-button"
                onClick={handleGuestSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>{loading ? 'Connecting...' : 'Continue as Guest (Anonymous Session)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
